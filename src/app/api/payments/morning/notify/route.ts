import * as Sentry from '@sentry/nextjs';
import { after, NextResponse, type NextRequest } from 'next/server';
import { getMorningConfig, getMorningDocument, type MorningDocumentInfo } from '@/lib/server/morning';
import { notifyOrderPaid } from '@/lib/server/notify';
import { getOrderById, ORDER_ID_PATTERN } from '@/lib/server/orders';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { requestIp, safeEqual } from '@/lib/server/secrets';
import { getWriteClient } from '@/sanity/lib/client';

/**
 * Payment notification from Morning (the notifyUrl given to each payment form). The URL carries the
 * order id and a shared secret; the payment itself is then verified against Morning's API (document
 * exists and the amount matches), so a leaked URL alone can never mark an order as paid.
 */
export const dynamic = 'force-dynamic';

async function readPayload(request: NextRequest): Promise<Record<string, unknown>> {
  if (request.method !== 'POST') return {};
  const type = request.headers.get('content-type') ?? '';
  try {
    if (type.includes('application/json')) return ((await request.json()) as Record<string, unknown>) ?? {};
    if (type.includes('form')) {
      const form = await request.formData();
      return Object.fromEntries([...form.entries()].map(([key, value]) => [key, typeof value === 'string' ? value : '']));
    }
    const text = await request.text();
    return text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function findDocumentId(payload: Record<string, unknown>, query: URLSearchParams): string | undefined {
  const nested = (value: unknown, key: string) => (value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined);
  const candidates = [
    payload.documentId,
    payload.docId,
    nested(payload.document, 'id'),
    nested(payload.data, 'documentId'),
    nested(nested(payload.data, 'document'), 'id'),
    payload.id,
    query.get('documentId'),
    query.get('docId'),
  ];
  const found = candidates.find((value) => typeof value === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(value));
  return typeof found === 'string' ? found : undefined;
}

async function handle(request: NextRequest) {
  const secret = process.env.MORNING_WEBHOOK_SECRET;
  if (!secret || !getMorningConfig()) return NextResponse.json({ message: 'Not configured' }, { status: 503 });
  if (!(await checkRateLimit('webhook', requestIp(request)))) return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
  const query = request.nextUrl.searchParams;
  if (!safeEqual(query.get('token'), secret)) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const orderId = query.get('order') ?? '';
  if (!ORDER_ID_PATTERN.test(orderId)) return NextResponse.json({ message: 'Bad order id' }, { status: 400 });
  const client = getWriteClient();
  if (!client) return NextResponse.json({ message: 'Storage not configured' }, { status: 503 });
  const order = await getOrderById(orderId);
  if (!order) return NextResponse.json({ message: 'Unknown order' }, { status: 404 });
  if (order.paymentStatus === 'paid') return NextResponse.json({ ok: true, status: 'already-paid' });

  const payload = await readPayload(request);
  const documentId = findDocumentId(payload, query);
  let document: MorningDocumentInfo | undefined;
  let verified = false;
  if (documentId) {
    try {
      document = await getMorningDocument(documentId);
      const amountMatches = document.amount !== undefined && Math.abs(document.amount - (order.total ?? 0)) < 0.01;
      const orderMatches = !document.custom || document.custom === orderId;
      verified = amountMatches && orderMatches;
    } catch (error) {
      console.error('[morning-notify] document lookup failed', { orderId, documentId, error });
    }
  }

  await client
    .patch(orderId)
    .set({
      paymentStatus: verified ? 'paid' : 'review',
      ...(verified ? { paidAt: new Date().toISOString() } : {}),
      receipt: {
        status: document ? 'created' : 'unverified',
        documentId: document?.id || documentId,
        documentNumber: document?.number,
        documentUrl: document?.url,
        // Keys only, for troubleshooting: payment payloads can contain personal data.
        error: verified ? undefined : `לא אומת אוטומטית. שדות שהתקבלו: ${Object.keys(payload).slice(0, 30).join(', ') || 'אין'}`,
      },
    })
    .commit();

  if (!verified) {
    // Surfaces in Sentry so the payload format can be confirmed; only field names are sent.
    Sentry.captureMessage('Morning payment notice could not be verified', {
      level: 'warning',
      tags: { integration: 'morning' },
      extra: { orderNumber: order.orderNumber, documentFound: Boolean(document), fields: Object.keys(payload).slice(0, 30) },
    });
  }

  after(() =>
    notifyOrderPaid({
      orderNumber: order.orderNumber,
      orderId,
      total: order.total ?? 0,
      verified,
      documentNumber: document?.number,
      documentUrl: document?.url,
    }),
  );
  return NextResponse.json({ ok: true, verified });
}

export const POST = handle;
export const GET = handle;
