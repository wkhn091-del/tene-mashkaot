import 'server-only';
import { plainPrice } from '../format';
import { formatSlot, type OrderSummary } from '../order-summary';
import type { EventInquiryInput } from '../validation';
import { sendEventInquiryEmail, sendOrderEmail, sendOrderPaidEmail } from './email';
import { isolate, sendWhatsAppTemplate, WHATSAPP_TEMPLATES } from './whatsapp-cloud';

/** Never throws: a failing channel is logged and reported as false. */
async function safely(label: string, task: () => Promise<boolean>): Promise<boolean> {
  try {
    return await task();
  } catch (error) {
    console.error(`[notify] ${label} failed`, error);
    return false;
  }
}

export async function notifyNewOrder(
  order: OrderSummary,
  meta: { stored: boolean; orderId?: string; paymentMethod: 'card' | 'onDelivery' },
): Promise<{ emailed: boolean; whatsapp: boolean }> {
  const [emailed, whatsapp] = await Promise.all([
    safely('order email', () => sendOrderEmail(order, meta)),
    safely('order whatsapp', () =>
      sendWhatsAppTemplate(WHATSAPP_TEMPLATES.newOrder, [
        isolate(order.orderNumber),
        order.customerName,
        isolate(plainPrice(order.total, 'he')),
        `${order.fulfillment === 'delivery' ? 'משלוח' : 'איסוף'} · ${formatSlot(order.slotStart, order.slotEnd, 'he')}`,
        meta.paymentMethod === 'card' ? 'אשראי באתר (ממתין לאישור)' : 'במסירה / באיסוף',
      ]),
    ),
  ]);
  return { emailed, whatsapp };
}

export async function notifyOrderPaid(info: {
  orderNumber: string;
  orderId: string;
  total: number;
  verified: boolean;
  documentNumber?: string;
  documentUrl?: string;
}): Promise<void> {
  await Promise.all([
    safely('paid email', () => sendOrderPaidEmail(info)),
    safely('paid whatsapp', () =>
      sendWhatsAppTemplate(WHATSAPP_TEMPLATES.orderPaid, [
        isolate(info.orderNumber),
        isolate(plainPrice(info.total, 'he')),
        info.verified
          ? info.documentNumber
            ? `מסמך ${isolate(info.documentNumber)} הופק ונשלח ללקוח`
            : 'התשלום אומת מול Morning'
          : 'לא ניתן היה לאמת אוטומטית – יש לבדוק ב־Morning',
      ]),
    ),
  ]);
}

export async function notifyEventInquiry(inquiry: EventInquiryInput, meta: { stored: boolean }): Promise<{ emailed: boolean; whatsapp: boolean }> {
  const [emailed, whatsapp] = await Promise.all([
    safely('event email', () => sendEventInquiryEmail(inquiry, meta)),
    safely('event whatsapp', () =>
      sendWhatsAppTemplate(WHATSAPP_TEMPLATES.eventInquiry, [
        inquiry.name,
        isolate(inquiry.phone),
        inquiry.eventType,
        isolate(inquiry.eventDate.split('-').reverse().join('.')),
      ]),
    ),
  ]);
  return { emailed, whatsapp };
}
