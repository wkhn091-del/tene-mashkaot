import * as Sentry from '@sentry/nextjs';
import { NextResponse, type NextRequest } from 'next/server';
import { parseBody } from 'next-sanity/webhook';
import { createDeliveryReceipt, getMorningConfig } from '@/lib/server/morning';
import { getOrderById, toMorningOrder } from '@/lib/server/orders';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { requestIp } from '@/lib/server/secrets';
import { getWriteClient } from '@/sanity/lib/client';

/**
 * Sanity webhook: when the store marks a pay-on-delivery order as "paid" in the Studio, issue the
 * receipt in Morning (which e-mails it to the customer) and store its number on the order.
 * Webhook filter: _type == "order" && paymentStatus == "paid" && paymentMethod != "card" && !defined(receipt.documentId)
 */
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_ORDER_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ message: 'Not configured' }, { status: 503 });
  if (!(await checkRateLimit('webhook', requestIp(request)))) return NextResponse.json({ message: 'Too many requests' }, { status: 429 });

  let id: string | undefined;
  try {
    const { isValidSignature, body } = await parseBody<{ _id?: string }>(request, secret, true);
    if (!isValidSignature) return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
    id = body?._id;
  } catch {
    return NextResponse.json({ message: 'Bad request' }, { status: 400 });
  }

  const client = getWriteClient();
  if (!client) return NextResponse.json({ message: 'Storage not configured' }, { status: 503 });
  const order = id ? await getOrderById(id) : null;
  if (!order || order.paymentStatus !== 'paid' || order.paymentMethod === 'card') return NextResponse.json({ ok: true, status: 'ignored' });
  if (order.receipt?.documentId || order.receipt?.status === 'creating') return NextResponse.json({ ok: true, status: 'already-handled' });

  if (!getMorningConfig()) {
    await client.patch(order._id).set({ receipt: { status: 'error', error: 'Morning אינו מחובר – יש להפיק קבלה ידנית.' } }).commit();
    return NextResponse.json({ ok: true, status: 'not-configured' });
  }

  // Claim the order atomically: a second delivery of the same webhook fails the revision check.
  try {
    await client.patch(order._id).ifRevisionId(order._rev).set({ receipt: { status: 'creating' } }).commit();
  } catch {
    return NextResponse.json({ ok: true, status: 'busy' });
  }

  const paidAt = order.paidAt ?? new Date().toISOString();
  try {
    const document = await createDeliveryReceipt(toMorningOrder(order), order.paidWith ?? 'cash', new Date(paidAt));
    await client
      .patch(order._id)
      .set({ paidAt, receipt: { status: 'created', documentId: document.id, documentNumber: document.number, documentUrl: document.url } })
      .commit();
    return NextResponse.json({ ok: true, status: 'created', document: document.number ?? document.id });
  } catch (error) {
    console.error('[orders/paid] receipt failed', { orderId: order._id, error });
    Sentry.captureException(error, { tags: { integration: 'morning' }, extra: { orderNumber: order.orderNumber } });
    // Saving again (after fixing the cause) re-triggers the webhook, because "error" is not a final state.
    await client
      .patch(order._id)
      .set({ receipt: { status: 'error', error: error instanceof Error ? error.message.slice(0, 300) : 'שגיאה לא ידועה' } })
      .commit()
      .catch(() => undefined);
    return NextResponse.json({ ok: false, status: 'error' });
  }
}
