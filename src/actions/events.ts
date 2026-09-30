'use server';

import { randomUUID } from 'node:crypto';
import { getSiteSettings } from '@/lib/data';
import { notifyEventInquiry } from '@/lib/server/notify';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { getClientIp, isSameOrigin } from '@/lib/server/request';
import { verifyTurnstile } from '@/lib/server/turnstile';
import { eventInquirySchema, fieldErrors } from '@/lib/validation';
import { whatsappLink } from '@/lib/whatsapp';
import { getWriteClient } from '@/sanity/lib/client';

export type EventInquiryState =
  | { status: 'idle' }
  | { status: 'success' }
  | {
      status: 'error';
      error: 'invalid' | 'rateLimited' | 'forbidden' | 'bot' | 'storage';
      fieldErrors?: Record<string, string>;
      whatsappUrl?: string;
    };

export async function submitEventInquiry(_prev: EventInquiryState, formData: FormData): Promise<EventInquiryState> {
  if (!(await isSameOrigin())) return { status: 'error', error: 'forbidden' };

  const ip = await getClientIp();
  if (!(await checkRateLimit('event', ip))) return { status: 'error', error: 'rateLimited' };

  const raw = Object.fromEntries(
    [...formData.entries()]
      .filter(([, value]) => typeof value === 'string')
      .map(([key, value]) => [key, (value as string).trim() === '' && ['guests', 'budget'].includes(key) ? undefined : value]),
  );
  raw.turnstileToken = formData.get('cf-turnstile-response') ?? undefined;

  const parsed = eventInquirySchema.safeParse(raw);
  if (!parsed.success) return { status: 'error', error: 'invalid', fieldErrors: fieldErrors(parsed.error) };
  const input = parsed.data;

  if (input.website || Date.now() - input.startedAt < 2500) return { status: 'error', error: 'bot' };
  if (!(await verifyTurnstile(input.turnstileToken, ip))) return { status: 'error', error: 'bot' };

  let stored = false;
  const client = getWriteClient();
  if (client) {
    try {
      await client.create({
        _id: `eventInquiry.${randomUUID()}`,
        _type: 'eventInquiry',
        status: 'new',
        createdAt: new Date().toISOString(),
        name: input.name,
        phone: input.phone,
        email: input.email || undefined,
        eventType: input.eventType,
        eventDate: input.eventDate,
        guests: input.guests,
        budget: input.budget,
        message: input.message,
        locale: input.locale,
      });
      stored = true;
    } catch (error) {
      console.error('[events] failed to store inquiry', error);
    }
  }

  const { emailed } = await notifyEventInquiry(input, { stored });
  if (!stored && !emailed) {
    const settings = await getSiteSettings();
    const text = [`פנייה לאירוע`, `שם: ${input.name}`, `טלפון: ${input.phone}`, `סוג: ${input.eventType}`, `תאריך: ${input.eventDate}`, input.message ?? '']
      .filter(Boolean)
      .join('\n');
    return { status: 'error', error: 'storage', whatsappUrl: whatsappLink(settings.whatsapp, text) };
  }
  return { status: 'success' };
}
