import 'server-only';
import { Resend } from 'resend';
import { buildOrderText, type OrderSummary } from '../order-summary';
import type { EventInquiryInput } from '../validation';
import { renderEventInquiryEmail, renderNewOrderEmail, renderOrderPaidEmail, type RenderedEmail } from './email-templates';

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

/**
 * Without a verified domain, Resend only delivers to the account owner's own address
 * (sender onboarding@resend.dev) – enough for store alerts until the site has its own domain.
 */
async function send(email: RenderedEmail, replyTo?: string): Promise<boolean> {
  const to = process.env.ORDERS_TO_EMAIL;
  const from = process.env.ORDERS_FROM_EMAIL || 'תנא משקאות <onboarding@resend.dev>';
  if (!resend || !to) {
    console.warn('[email] Resend is not configured (RESEND_API_KEY / ORDERS_TO_EMAIL)');
    return false;
  }
  try {
    const { error } = await resend.emails.send({
      from,
      to: to
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      subject: email.subject,
      html: email.html,
      text: email.text,
      replyTo,
    });
    if (error) {
      console.error('[email] send failed', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[email] send threw', error);
    return false;
  }
}

export async function sendOrderEmail(
  order: OrderSummary,
  meta: { stored: boolean; orderId?: string; paymentMethod: 'card' | 'onDelivery' },
): Promise<boolean> {
  const email = renderNewOrderEmail(order, meta);
  email.text = (meta.stored ? '' : '⚠️ ההזמנה לא נשמרה במערכת הניהול – יש לטפל בה ישירות מהמייל הזה.\n\n') + buildOrderText({ ...order, locale: 'he' });
  return send(email, order.email || undefined);
}

export async function sendOrderPaidEmail(info: Parameters<typeof renderOrderPaidEmail>[0]): Promise<boolean> {
  return send(renderOrderPaidEmail(info));
}

export async function sendEventInquiryEmail(inquiry: EventInquiryInput, meta: { stored: boolean }): Promise<boolean> {
  return send(renderEventInquiryEmail(inquiry, meta), inquiry.email || undefined);
}
