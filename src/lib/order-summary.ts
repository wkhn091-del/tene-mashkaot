import { formatPrice } from './format';
import { TIME_ZONE } from './schedule';

export interface OrderSummaryLine {
  title: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  dedication?: string;
  ribbonColor?: string;
  balloonColor?: string;
  balloonText?: string;
}

export interface OrderSummary {
  orderNumber: string;
  locale: 'he' | 'en';
  fulfillment: 'delivery' | 'pickup';
  customerName: string;
  phone: string;
  email?: string;
  city?: string;
  street?: string;
  apartment?: string;
  notes?: string;
  slotStart: string;
  slotEnd: string;
  lines: OrderSummaryLine[];
  gifts: string[];
  couponCode?: string;
  itemsTotal: number;
  couponDiscount: number;
  deliveryFee: number;
  total: number;
  paymentMethod?: 'card' | 'onDelivery';
}

const COLOR_LABELS: Record<string, { he: string; en: string }> = {
  gold: { he: 'זהב', en: 'Gold' },
  purple: { he: 'סגול', en: 'Purple' },
  burgundy: { he: 'בורדו', en: 'Burgundy' },
  silver: { he: 'כסף', en: 'Silver' },
  white: { he: 'לבן', en: 'White' },
  red: { he: 'אדום', en: 'Red' },
  blue: { he: 'כחול', en: 'Blue' },
  pink: { he: 'ורוד', en: 'Pink' },
  black: { he: 'שחור', en: 'Black' },
  mixed: { he: 'צבעוני משולב', en: 'Mixed' },
};

export function colorLabel(color: string | undefined, locale: 'he' | 'en'): string {
  if (!color) return '';
  return COLOR_LABELS[color]?.[locale] ?? color;
}

export function formatSlot(start: string, end: string, locale: 'he' | 'en'): string {
  const lang = locale === 'he' ? 'he-IL' : 'en-IL';
  const day = new Intl.DateTimeFormat(lang, { timeZone: TIME_ZONE, weekday: 'long', day: 'numeric', month: 'numeric' }).format(new Date(start));
  const time = new Intl.DateTimeFormat(lang, { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  return `${day} ${time.format(new Date(start))}–${time.format(new Date(end))}`;
}

const TEXT = {
  he: {
    title: 'הזמנה חדשה',
    order: 'מספר הזמנה',
    name: 'שם',
    phone: 'טלפון',
    email: 'מייל',
    delivery: 'משלוח',
    pickup: 'איסוף עצמי מהחנות',
    address: 'כתובת',
    slot: 'מועד',
    items: 'פריטים',
    dedication: 'הקדשה',
    ribbon: 'סרט',
    balloon: 'בלון',
    balloonText: 'טקסט',
    gifts: 'מתנה',
    coupon: 'קופון',
    itemsTotal: 'סכום פריטים',
    discount: 'הנחה',
    deliveryFee: 'משלוח',
    free: 'חינם',
    total: 'סה"כ לתשלום',
    notes: 'הערות',
    payment: 'התשלום יתבצע בטלפון או בעת המסירה',
    paymentCard: 'תשלום באשראי באתר (דף תשלום מאובטח)',
  },
  en: {
    title: 'New order',
    order: 'Order number',
    name: 'Name',
    phone: 'Phone',
    email: 'Email',
    delivery: 'Delivery',
    pickup: 'Store pickup',
    address: 'Address',
    slot: 'Time',
    items: 'Items',
    dedication: 'Dedication',
    ribbon: 'Ribbon',
    balloon: 'Balloon',
    balloonText: 'Text',
    gifts: 'Gift',
    coupon: 'Coupon',
    itemsTotal: 'Items total',
    discount: 'Discount',
    deliveryFee: 'Delivery',
    free: 'Free',
    total: 'Total to pay',
    notes: 'Notes',
    payment: 'Payment by phone or upon delivery',
    paymentCard: 'Card payment on the website (secure payment page)',
  },
} as const;

export function buildOrderText(order: OrderSummary): string {
  const t = TEXT[order.locale];
  const price = (n: number) => formatPrice(n, order.locale);
  const rows: string[] = [
    `*${t.title}* – ${order.orderNumber}`,
    '',
    `${t.name}: ${order.customerName}`,
    `${t.phone}: ${order.phone}`,
  ];
  if (order.email) rows.push(`${t.email}: ${order.email}`);
  rows.push(`${order.fulfillment === 'delivery' ? t.delivery : t.pickup}`);
  if (order.fulfillment === 'delivery') {
    rows.push(`${t.address}: ${[order.street, order.apartment, order.city].filter(Boolean).join(', ')}`);
  }
  rows.push(`${t.slot}: ${formatSlot(order.slotStart, order.slotEnd, order.locale)}`, '', `*${t.items}:*`);

  for (const line of order.lines) {
    rows.push(`• ${line.quantity} × ${line.title} – ${price(line.lineTotal)}`);
    if (line.ribbonColor) rows.push(`   ${t.ribbon}: ${colorLabel(line.ribbonColor, order.locale)}`);
    if (line.balloonColor) rows.push(`   ${t.balloon}: ${colorLabel(line.balloonColor, order.locale)}`);
    if (line.balloonText) rows.push(`   ${t.balloonText}: ${line.balloonText}`);
    if (line.dedication) rows.push(`   ${t.dedication}: ${line.dedication}`);
  }

  if (order.gifts.length) rows.push('', `🎁 ${t.gifts}: ${order.gifts.join(', ')}`);
  rows.push('', `${t.itemsTotal}: ${price(order.itemsTotal)}`);
  if (order.couponDiscount > 0) rows.push(`${t.discount}${order.couponCode ? ` (${order.couponCode})` : ''}: -${price(order.couponDiscount)}`);
  if (order.fulfillment === 'delivery') rows.push(`${t.deliveryFee}: ${order.deliveryFee > 0 ? price(order.deliveryFee) : t.free}`);
  rows.push(`*${t.total}: ${price(order.total)}*`);
  if (order.notes) rows.push('', `${t.notes}: ${order.notes}`);
  rows.push('', order.paymentMethod === 'card' ? t.paymentCard : t.payment);
  return rows.join('\n');
}
