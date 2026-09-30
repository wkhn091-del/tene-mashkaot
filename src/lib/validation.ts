import { z } from 'zod';
import { BALLOON_COLORS, RIBBON_COLORS } from './types';

const ISRAELI_PHONE = /^(?:\+972|972|0)(?:[23489]|5\d|7\d)\d{7}$/;

export function normalizePhone(value: string): string {
  return value.replace(/[\s\-()]/g, '');
}

const safeText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    // Strip control characters; everything else is escaped at render time.
    .transform((v) => v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ''));

const phone = z
  .string()
  .trim()
  .transform(normalizePhone)
  .refine((v) => ISRAELI_PHONE.test(v), { message: 'phone' });

export const cartItemSchema = z.object({
  productId: z.string().min(1).max(128).regex(/^[A-Za-z0-9._-]+$/),
  quantity: z.number().int().min(1).max(50),
  dedication: safeText(300).optional(),
  ribbonColor: z.enum(RIBBON_COLORS).optional(),
  balloonColor: z.enum(BALLOON_COLORS).optional(),
  balloonText: safeText(40).optional(),
});

export type CartItemInput = z.infer<typeof cartItemSchema>;

export const quoteSchema = z.object({
  items: z.array(cartItemSchema).max(50),
  zoneId: z.string().max(128).optional().nullable(),
  fulfillment: z.enum(['delivery', 'pickup']).default('delivery'),
  couponCode: z.string().trim().max(32).optional().nullable(),
});

export type QuoteInput = z.infer<typeof quoteSchema>;

export const orderSchema = z
  .object({
    items: z.array(cartItemSchema).min(1).max(50),
    fulfillment: z.enum(['delivery', 'pickup']),
    paymentMethod: z.enum(['card', 'onDelivery']).default('onDelivery'),
    zoneId: z.string().max(128).optional().nullable(),
    name: safeText(80).pipe(z.string().min(2, { message: 'name' })),
    phone,
    email: z.union([z.literal(''), z.string().trim().email({ message: 'email' }).max(120)]).optional(),
    street: safeText(120).optional(),
    apartment: safeText(80).optional(),
    notes: safeText(500).optional(),
    slotStart: z.string().datetime(),
    slotEnd: z.string().datetime(),
    couponCode: z.string().trim().max(32).optional().nullable(),
    ageConfirmed: z.literal(true, { message: 'age' }),
    termsAccepted: z.literal(true, { message: 'terms' }),
    locale: z.enum(['he', 'en']),
    turnstileToken: z.string().max(4096).optional(),
    /** Honeypot: real users never fill this. */
    website: z.string().max(0).optional(),
    startedAt: z.number().int().positive(),
  })
  .superRefine((value, ctx) => {
    if (value.fulfillment === 'delivery') {
      if (!value.zoneId) ctx.addIssue({ code: 'custom', path: ['zoneId'], message: 'zone' });
      if (!value.street || value.street.length < 3) ctx.addIssue({ code: 'custom', path: ['street'], message: 'street' });
    }
  });

export type OrderInput = z.infer<typeof orderSchema>;

export const eventInquirySchema = z.object({
  name: safeText(80).pipe(z.string().min(2, { message: 'name' })),
  phone,
  email: z.union([z.literal(''), z.string().trim().email({ message: 'email' }).max(120)]).optional(),
  eventType: safeText(60).pipe(z.string().min(2, { message: 'eventType' })),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'eventDate' }),
  guests: z.coerce.number().int().min(1).max(5000).optional(),
  budget: z.coerce.number().int().min(0).max(1_000_000).optional(),
  message: safeText(1000).optional(),
  locale: z.enum(['he', 'en']),
  turnstileToken: z.string().max(4096).optional(),
  website: z.string().max(0).optional(),
  startedAt: z.coerce.number().int().positive(),
});

export type EventInquiryInput = z.infer<typeof eventInquirySchema>;

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !result[key]) result[key] = issue.message;
  }
  return result;
}
