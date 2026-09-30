import 'server-only';

/**
 * WhatsApp Cloud API (Meta) alerts to the store. Business-initiated messages must use templates
 * approved in WhatsApp Manager; see integrations/whatsapp/TEMPLATES.md for the exact texts.
 * Alerts go FROM a dedicated API number TO the store's regular WhatsApp, which stays untouched.
 */

export const WHATSAPP_TEMPLATES = {
  newOrder: process.env.WHATSAPP_TEMPLATE_NEW_ORDER || 'tene_new_order',
  orderPaid: process.env.WHATSAPP_TEMPLATE_ORDER_PAID || 'tene_order_paid',
  eventInquiry: process.env.WHATSAPP_TEMPLATE_EVENT || 'tene_event_inquiry',
} as const;

function recipients(): string[] {
  return (process.env.WHATSAPP_ALERT_TO ?? '')
    .split(',')
    .map((value) => value.replace(/\D/g, ''))
    .map((digits) => (digits.startsWith('0') ? `972${digits.slice(1)}` : digits))
    .filter((digits) => digits.length >= 11);
}

export function isWhatsAppConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && recipients().length);
}

/** Template parameters may not contain new lines, tabs or more than four consecutive spaces. */
function cleanParam(value: string): string {
  const cleaned = value
    .replace(/[\r\n\t]+/g, ' · ')
    .replace(/ {4,}/g, '   ')
    .trim();
  return (cleaned || '—').slice(0, 900);
}

/** Keeps numbers (order numbers, phones, prices) left-to-right inside Hebrew text. */
export function isolate(value: string | number): string {
  return `\u2066${value}\u2069`;
}

let warned = false;

export async function sendWhatsAppTemplate(template: string, params: string[]): Promise<boolean> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const to = recipients();
  if (!token || !phoneNumberId || !to.length) {
    if (!warned) {
      console.warn('[whatsapp] Cloud API is not configured (WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ALERT_TO)');
      warned = true;
    }
    return false;
  }
  const version = process.env.WHATSAPP_GRAPH_VERSION || 'v23.0';
  const language = process.env.WHATSAPP_TEMPLATE_LANG || 'he';

  const results = await Promise.allSettled(
    to.map(async (recipient) => {
      const res = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: recipient,
          type: 'template',
          template: {
            name: template,
            language: { code: language },
            components: [{ type: 'body', parameters: params.map((text) => ({ type: 'text', text: cleanParam(text) })) }],
          },
        }),
        cache: 'no-store',
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`WhatsApp API ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }),
  );
  for (const result of results) {
    if (result.status === 'rejected') console.error('[whatsapp] send failed', result.reason);
  }
  return results.some((result) => result.status === 'fulfilled');
}
