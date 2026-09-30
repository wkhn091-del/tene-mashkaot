'use server';

import { randomInt, randomUUID } from 'node:crypto';
import * as Sentry from '@sentry/nextjs';
import { after } from 'next/server';
import { SITE_URL } from '@/lib/defaults';
import { getDeliverySettings, getDeliveryZonesFresh, getProductsByIdsFresh, getPromotionsFresh, getSiteSettings } from '@/lib/data';
import { localize } from '@/lib/i18n-utils';
import { buildOrderText, formatSlot, type OrderSummary } from '@/lib/order-summary';
import { computeCart, type CartTotals } from '@/lib/pricing';
import { getDeliverySlots, getOrderingState, isValidSlot, type DeliverySlot, type OrderingState } from '@/lib/schedule';
import { createPaymentForm, isCardPaymentEnabled } from '@/lib/server/morning';
import { notifyNewOrder } from '@/lib/server/notify';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { getClientIp, isSameOrigin } from '@/lib/server/request';
import { verifyTurnstile } from '@/lib/server/turnstile';
import type { DeliveryZone, Product, SanityImage } from '@/lib/types';
import { fieldErrors, orderSchema, quoteSchema, type CartItemInput } from '@/lib/validation';
import { whatsappLink } from '@/lib/whatsapp';
import { getWriteClient } from '@/sanity/lib/client';

export interface QuoteLine {
  productId: string;
  title: string;
  slug: string;
  image?: SanityImage;
  quantity: number;
  basePrice: number;
  unitPrice: number;
  lineTotal: number;
  inStock: boolean;
}

export type QuoteResult =
  | {
      ok: true;
      lines: QuoteLine[];
      missingProductIds: string[];
      outOfStockIds: string[];
      totals: CartTotals;
      zones: DeliveryZone[];
      slots: DeliverySlot[];
      ordering: OrderingState;
      pickupEnabled: boolean;
    }
  | { ok: false; error: 'invalid' | 'rateLimited' | 'unavailable' };

export type PlaceOrderResult =
  | { ok: true; orderNumber: string; whatsappUrl: string; summary: string; stored: boolean; paymentUrl?: string }
  | {
      ok: false;
      error:
        | 'invalid'
        | 'rateLimited'
        | 'forbidden'
        | 'bot'
        | 'shabbat'
        | 'unavailable'
        | 'outOfStock'
        | 'zone'
        | 'minOrder'
        | 'slot'
        | 'customization'
        | 'storage'
        | 'payment';
      fieldErrors?: Record<string, string>;
      productIds?: string[];
      whatsappUrl?: string;
      minOrder?: number;
    };

const MIN_FORM_FILL_MS = 2500;
const ORDER_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function createOrderNumber(now: Date): string {
  const y = String(now.getUTCFullYear()).slice(2);
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const suffix = Array.from({ length: 4 }, () => ORDER_ALPHABET[randomInt(ORDER_ALPHABET.length)]).join('');
  return `TN-${y}${m}${d}-${suffix}`;
}

function maxLeadTime(items: { productId: string }[], products: Product[]): number {
  const map = new Map(products.map((p) => [p._id, p]));
  return items.reduce((max, item) => Math.max(max, map.get(item.productId)?.leadTimeHours ?? 0), 0);
}

function customizationValid(item: CartItemInput, product: Product): boolean {
  if (item.dedication && !(product.kind === 'gift' && product.gift?.allowDedication !== false)) return false;
  if (item.ribbonColor && !(product.gift?.ribbonColors ?? []).includes(item.ribbonColor)) return false;
  if (item.balloonColor && !(product.balloons?.colors ?? []).includes(item.balloonColor)) return false;
  if (item.balloonText && !(product.kind === 'balloons' && product.balloons?.allowText !== false)) return false;
  return true;
}

export async function getQuote(raw: unknown, locale: 'he' | 'en'): Promise<QuoteResult> {
  const parsed = quoteSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'invalid' };

  const ip = await getClientIp();
  if (!(await checkRateLimit('quote', ip))) return { ok: false, error: 'rateLimited' };

  const { items, zoneId, fulfillment, couponCode } = parsed.data;
  try {
    const ids = [...new Set(items.map((i) => i.productId))];
    const [products, promotions, zones, settings, delivery] = await Promise.all([
      getProductsByIdsFresh(ids),
      getPromotionsFresh(),
      getDeliveryZonesFresh(),
      getSiteSettings(),
      getDeliverySettings(),
    ]);

    const found = new Set(products.map((p) => p._id));
    const missingProductIds = ids.filter((id) => !found.has(id));
    const outOfStockIds = products.filter((p) => !p.inStock).map((p) => p._id);
    const available = items.filter((i) => found.has(i.productId) && !outOfStockIds.includes(i.productId));
    const zone = zones.find((z) => z._id === zoneId) ?? null;
    const now = new Date();

    const totals = computeCart({ items: available, products, promotions, zone, fulfillment, couponCode, now });
    const productMap = new Map(products.map((p) => [p._id, p]));
    const lines: QuoteLine[] = totals.lines.map((line) => {
      const product = productMap.get(line.productId)!;
      return {
        ...line,
        title: localize(product.title, locale),
        slug: product.slug,
        image: product.images?.[0],
        inStock: product.inStock,
      };
    });

    return {
      ok: true,
      lines,
      missingProductIds,
      outOfStockIds,
      totals,
      zones,
      slots: getDeliverySlots({ now, settings, delivery, leadTimeHours: maxLeadTime(available, products) }),
      ordering: getOrderingState(now, settings, delivery),
      pickupEnabled: delivery.pickupEnabled,
    };
  } catch (error) {
    console.error('[checkout] quote failed', error);
    return { ok: false, error: 'unavailable' };
  }
}

export async function placeOrder(raw: unknown): Promise<PlaceOrderResult> {
  if (!(await isSameOrigin())) return { ok: false, error: 'forbidden' };

  const ip = await getClientIp();
  if (!(await checkRateLimit('order', ip))) return { ok: false, error: 'rateLimited' };

  const parsed = orderSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'invalid', fieldErrors: fieldErrors(parsed.error) };
  const input = parsed.data;

  if (input.website || Date.now() - input.startedAt < MIN_FORM_FILL_MS) return { ok: false, error: 'bot' };
  if (!(await verifyTurnstile(input.turnstileToken, ip))) return { ok: false, error: 'bot' };
  if (input.paymentMethod === 'card' && !isCardPaymentEnabled()) return { ok: false, error: 'payment' };

  const [settings, delivery] = await Promise.all([getSiteSettings(), getDeliverySettings()]);
  const now = new Date();

  if (getOrderingState(now, settings, delivery).blocked) return { ok: false, error: 'shabbat' };

  let products: Product[];
  let promotions;
  let zones: DeliveryZone[];
  try {
    const ids = [...new Set(input.items.map((i) => i.productId))];
    [products, promotions, zones] = await Promise.all([getProductsByIdsFresh(ids), getPromotionsFresh(), getDeliveryZonesFresh()]);
    const found = new Set(products.map((p) => p._id));
    const missing = ids.filter((id) => !found.has(id));
    if (missing.length) return { ok: false, error: 'unavailable', productIds: missing };
  } catch (error) {
    console.error('[checkout] catalog read failed', error);
    return { ok: false, error: 'unavailable' };
  }

  const productMap = new Map(products.map((p) => [p._id, p]));
  const outOfStock = input.items.filter((i) => !productMap.get(i.productId)?.inStock).map((i) => i.productId);
  if (outOfStock.length) return { ok: false, error: 'outOfStock', productIds: outOfStock };

  const invalidCustomization = input.items.filter((i) => !customizationValid(i, productMap.get(i.productId)!)).map((i) => i.productId);
  if (invalidCustomization.length) return { ok: false, error: 'customization', productIds: invalidCustomization };

  let zone: DeliveryZone | null = null;
  if (input.fulfillment === 'delivery') {
    zone = zones.find((z) => z._id === input.zoneId && z.active !== false) ?? null;
    if (!zone) return { ok: false, error: 'zone', fieldErrors: { zoneId: 'zone' } };
  } else if (!delivery.pickupEnabled) {
    return { ok: false, error: 'invalid', fieldErrors: { fulfillment: 'fulfillment' } };
  }

  const slots = getDeliverySlots({ now, settings, delivery, leadTimeHours: maxLeadTime(input.items, products) });
  if (!isValidSlot({ start: input.slotStart, end: input.slotEnd }, slots)) {
    return { ok: false, error: 'slot', fieldErrors: { slot: 'slot' } };
  }

  const totals = computeCart({
    items: input.items,
    products,
    promotions,
    zone,
    fulfillment: input.fulfillment,
    couponCode: input.couponCode,
    now,
  });
  if (!totals.meetsMinOrder) return { ok: false, error: 'minOrder', minOrder: totals.minOrder };

  const orderNumber = createOrderNumber(now);
  const lineByProduct = new Map(totals.lines.map((l) => [l.productId, l]));
  const summaryLines = input.items.map((item) => {
    const product = productMap.get(item.productId)!;
    const priced = lineByProduct.get(item.productId)!;
    return {
      productId: product._id,
      title: localize(product.title, 'he'),
      quantity: item.quantity,
      unitPrice: priced.unitPrice,
      lineTotal: Math.round(priced.unitPrice * item.quantity * 100) / 100,
      dedication: item.dedication || undefined,
      ribbonColor: item.ribbonColor,
      balloonColor: item.balloonColor,
      balloonText: item.balloonText || undefined,
    };
  });

  const summary: OrderSummary = {
    orderNumber,
    locale: input.locale,
    fulfillment: input.fulfillment,
    customerName: input.name,
    phone: input.phone,
    email: input.email || undefined,
    city: zone ? localize(zone.city, 'he') : undefined,
    street: input.street,
    apartment: input.apartment,
    notes: input.notes,
    slotStart: input.slotStart,
    slotEnd: input.slotEnd,
    lines: summaryLines,
    gifts: totals.gifts.earned.map((g) => localize(g.gift ?? g.title, 'he')),
    couponCode: totals.coupon?.valid ? totals.coupon.code : undefined,
    itemsTotal: totals.itemsTotal,
    couponDiscount: totals.couponDiscount,
    deliveryFee: totals.deliveryFee,
    total: totals.total,
    paymentMethod: input.paymentMethod,
  };

  const card = input.paymentMethod === 'card';
  // A dot in the id keeps the document private even in a public dataset (Sanity "path" ids).
  const orderId = `order.${randomUUID()}`;
  let stored = false;
  const client = getWriteClient();
  if (client) {
    try {
      await client.create({
        _id: orderId,
        _type: 'order',
        orderNumber,
        status: 'new',
        paymentMethod: input.paymentMethod,
        paymentStatus: card ? 'pending' : 'unpaid',
        createdAt: now.toISOString(),
        locale: input.locale,
        fulfillment: input.fulfillment,
        slot: { start: input.slotStart, end: input.slotEnd, label: formatSlot(input.slotStart, input.slotEnd, 'he') },
        customer: { name: input.name, phone: input.phone, email: input.email || undefined },
        address: input.fulfillment === 'delivery' ? { city: summary.city, street: input.street, apartment: input.apartment } : undefined,
        zone: zone && !zone._id.startsWith('default-') ? { _type: 'reference', _ref: zone._id, _weak: true } : undefined,
        notes: input.notes,
        ageConfirmed: true,
        termsAccepted: true,
        items: summaryLines.map((line) => ({
          _key: randomUUID().slice(0, 12),
          _type: 'orderItem',
          product: { _type: 'reference', _ref: line.productId, _weak: true },
          title: line.title,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          lineTotal: line.lineTotal,
          dedication: line.dedication,
          ribbonColor: line.ribbonColor,
          balloonColor: line.balloonColor,
          balloonText: line.balloonText,
        })),
        gifts: summary.gifts,
        couponCode: summary.couponCode,
        subtotal: totals.itemsTotal,
        discount: totals.couponDiscount,
        deliveryFee: totals.deliveryFee,
        total: totals.total,
      });
      stored = true;
    } catch (error) {
      console.error('[checkout] failed to store order', { orderNumber, error });
    }
  } else {
    console.error('[checkout] SANITY_API_WRITE_TOKEN is missing; order will be emailed only', { orderNumber });
  }

  const text = buildOrderText(summary);
  const whatsappUrl = whatsappLink(settings.whatsapp, text);

  if (card) {
    // Payment status is tracked on the stored order, so a card order cannot proceed without it.
    if (!stored || !client) return { ok: false, error: 'storage', whatsappUrl };
    const secret = process.env.MORNING_WEBHOOK_SECRET ?? '';
    let paymentUrl: string;
    try {
      paymentUrl = await createPaymentForm(
        {
          orderNumber,
          locale: input.locale,
          customer: { name: input.name, phone: input.phone, email: input.email || undefined },
          lines: summaryLines.map((line) => ({ title: line.title, quantity: line.quantity, unitPrice: line.unitPrice })),
          deliveryFee: totals.deliveryFee,
          couponDiscount: totals.couponDiscount,
          total: totals.total,
        },
        {
          success: `${SITE_URL}/${input.locale}/order/${orderNumber}?payment=success`,
          failure: `${SITE_URL}/${input.locale}/order/${orderNumber}?payment=failed`,
          notify: `${SITE_URL}/api/payments/morning/notify?order=${encodeURIComponent(orderId)}&token=${encodeURIComponent(secret)}`,
        },
        orderId,
      );
    } catch (error) {
      console.error('[checkout] payment form failed', { orderNumber, error });
      Sentry.captureException(error, { tags: { integration: 'morning' }, extra: { orderNumber } });
      await client
        .patch(orderId)
        .set({ status: 'cancelled', paymentStatus: 'failed', internalNotes: 'יצירת דף התשלום נכשלה – הלקוח לא חויב.' })
        .commit()
        .catch(() => undefined);
      return { ok: false, error: 'payment', whatsappUrl };
    }
    // Alerts go out after the response, so the customer reaches the payment page immediately.
    after(() => notifyNewOrder(summary, { stored, orderId, paymentMethod: 'card' }));
    return { ok: true, orderNumber, whatsappUrl, summary: text, stored, paymentUrl };
  }

  if (stored) {
    after(() => notifyNewOrder(summary, { stored, orderId, paymentMethod: 'onDelivery' }));
    return { ok: true, orderNumber, whatsappUrl, summary: text, stored };
  }

  // Not stored: the e-mail is the only record, so it must succeed before we confirm.
  const { emailed } = await notifyNewOrder(summary, { stored, paymentMethod: 'onDelivery' });
  if (!emailed) return { ok: false, error: 'storage', whatsappUrl };
  return { ok: true, orderNumber, whatsappUrl, summary: text, stored };
}
