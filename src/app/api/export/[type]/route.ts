import { NextResponse, type NextRequest } from 'next/server';
import { label, ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from '@/lib/order-status';
import { toCsv, type CsvColumn } from '@/lib/server/csv';
import { listInquiriesForExport, listOrdersForExport, type StoredInquiry, type StoredOrder } from '@/lib/server/orders';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { bearerToken, requestIp, safeEqual } from '@/lib/server/secrets';

/**
 * CSV feed for the Google Sheets sync (integrations/google-sheets/Code.gs).
 * Auth: `Authorization: Bearer <SHEETS_EXPORT_TOKEN>` (never in the URL, so it stays out of logs).
 */
export const dynamic = 'force-dynamic';

const israelTime = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Jerusalem',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const hhmm = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

const when = (iso?: string) => (iso ? israelTime.format(new Date(iso)) : '');
const slot = (order: StoredOrder) =>
  order.slot?.start && order.slot.end ? `${when(order.slot.start).slice(0, 10)} ${hhmm.format(new Date(order.slot.start))}–${hhmm.format(new Date(order.slot.end))}` : '';

const PAYMENT_METHOD: Record<string, string> = { card: 'אשראי באתר', onDelivery: 'במסירה / באיסוף' };

const ORDER_COLUMNS: CsvColumn<StoredOrder>[] = [
  { header: 'מספר הזמנה', kind: 'lrm', value: (o) => o.orderNumber },
  { header: 'נוצרה', kind: 'lrm', value: (o) => when(o.createdAt) },
  { header: 'סטטוס', kind: 'text', value: (o) => label(ORDER_STATUS_OPTIONS, o.status) },
  { header: 'אמצעי תשלום', kind: 'text', value: (o) => PAYMENT_METHOD[o.paymentMethod ?? 'onDelivery'] },
  { header: 'סטטוס תשלום', kind: 'text', value: (o) => label(PAYMENT_STATUS_OPTIONS, o.paymentStatus) },
  { header: 'שם', kind: 'text', value: (o) => o.customer?.name },
  { header: 'טלפון', kind: 'lrm', value: (o) => o.customer?.phone },
  { header: 'מייל', kind: 'text', value: (o) => o.customer?.email },
  { header: 'אופן קבלה', kind: 'text', value: (o) => (o.fulfillment === 'pickup' ? 'איסוף עצמי' : 'משלוח') },
  { header: 'כתובת', kind: 'text', value: (o) => [o.address?.street, o.address?.apartment, o.address?.city].filter(Boolean).join(', ') },
  { header: 'מועד', kind: 'lrm', value: slot },
  { header: 'פריטים', kind: 'text', value: (o) => (o.items ?? []).map((i) => `${i.quantity ?? 1}× ${i.title ?? ''}`).join(' | ') },
  { header: 'סכום פריטים', kind: 'number', value: (o) => o.subtotal },
  { header: 'הנחה', kind: 'number', value: (o) => o.discount },
  { header: 'משלוח', kind: 'number', value: (o) => o.deliveryFee },
  { header: 'סה״כ', kind: 'number', value: (o) => o.total },
  { header: 'קופון', kind: 'text', value: (o) => o.couponCode },
  { header: 'הערות', kind: 'text', value: (o) => o.notes },
  { header: 'מסמך ב־Morning', kind: 'lrm', value: (o) => o.receipt?.documentNumber },
];

const INQUIRY_COLUMNS: CsvColumn<StoredInquiry>[] = [
  { header: 'נוצרה', kind: 'lrm', value: (i) => when(i.createdAt) },
  { header: 'סטטוס', kind: 'text', value: (i) => i.status },
  { header: 'שם', kind: 'text', value: (i) => i.name },
  { header: 'טלפון', kind: 'lrm', value: (i) => i.phone },
  { header: 'מייל', kind: 'text', value: (i) => i.email },
  { header: 'סוג אירוע', kind: 'text', value: (i) => i.eventType },
  { header: 'תאריך האירוע', kind: 'lrm', value: (i) => i.eventDate },
  { header: 'משתתפים', kind: 'number', value: (i) => i.guests },
  { header: 'תקציב', kind: 'number', value: (i) => i.budget },
  { header: 'הודעה', kind: 'text', value: (i) => i.message },
];

const NO_STORE = { 'Cache-Control': 'no-store, max-age=0', 'X-Robots-Tag': 'noindex' };

export async function GET(request: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const token = process.env.SHEETS_EXPORT_TOKEN;
  if (!token) return NextResponse.json({ message: 'Export is not configured' }, { status: 503, headers: NO_STORE });
  if (!(await checkRateLimit('export', requestIp(request)))) {
    return NextResponse.json({ message: 'Too many requests' }, { status: 429, headers: { ...NO_STORE, 'Retry-After': '600' } });
  }
  if (!safeEqual(bearerToken(request), token)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401, headers: { ...NO_STORE, 'WWW-Authenticate': 'Bearer' } });
  }

  const { type } = await params;
  const days = Math.min(Math.max(Number(request.nextUrl.searchParams.get('days')) || 90, 1), 730);
  let csv: string;
  if (type === 'orders') csv = toCsv(await listOrdersForExport(days), ORDER_COLUMNS);
  else if (type === 'inquiries') csv = toCsv(await listInquiriesForExport(days), INQUIRY_COLUMNS);
  else return NextResponse.json({ message: 'Unknown export' }, { status: 404, headers: NO_STORE });

  return new NextResponse(csv, {
    headers: { ...NO_STORE, 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `inline; filename="${type}.csv"` },
  });
}
