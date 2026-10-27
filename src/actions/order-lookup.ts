'use server';

import { z } from 'zod';
import { getProducts, getPromotions } from '@/lib/data';
import { localize } from '@/lib/i18n-utils';
import { getProductPrice } from '@/lib/pricing';
import { getClientIp, isSameOrigin } from '@/lib/server/request';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { sanityFetchFresh } from '@/sanity/lib/fetch';
import { phoneKey } from '@/lib/validation';
import type { BalloonColor, RibbonColor, SanityImage } from '@/lib/types';

const ORDER_NUMBER = /^TN-\d{6}-[A-Z2-9]{4}$/;

const lookupSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(ORDER_NUMBER, 'orderNumber'),
  phone: z
    .string()
    .trim()
    .min(9)
    .max(20)
    .transform((v) => v.replace(/[\s\-()]/g, '')),
  locale: z.enum(['he', 'en']).default('he'),
});

interface StoredLookupOrder {
  orderNumber: string;
  status?: string;
  createdAt?: string;
  fulfillment?: 'delivery' | 'pickup';
  paymentMethod?: 'card' | 'onDelivery';
  paymentStatus?: string;
  customer?: { name?: string; phone?: string };
  address?: { city?: string; street?: string; apartment?: string };
  slot?: { label?: string; start?: string; end?: string };
  total?: number;
  deliveryFee?: number;
  discount?: number;
  subtotal?: number;
  receiptUrl?: string;
  items?: {
    title?: string;
    quantity?: number;
    unitPrice?: number;
    lineTotal?: number;
    dedication?: string;
    ribbonColor?: string;
    balloonColor?: string;
    balloonText?: string;
    productId?: string;
  }[];
}

export interface ReorderLine {
  productId: string;
  quantity: number;
  dedication?: string;
  ribbonColor?: RibbonColor;
  balloonColor?: BalloonColor;
  balloonText?: string;
  snapshot: { title: string; slug: string; price: number; image?: SanityImage };
  unavailable?: boolean;
}

export type LookupOrderResult =
  | {
      ok: true;
      order: {
        orderNumber: string;
        status?: string;
        createdAt?: string;
        fulfillment?: 'delivery' | 'pickup';
        paymentMethod?: 'card' | 'onDelivery';
        paymentStatus?: string;
        customerName?: string;
        address?: { city?: string; street?: string; apartment?: string };
        slotLabel?: string;
        total?: number;
        deliveryFee?: number;
        discount?: number;
        subtotal?: number;
        receiptUrl?: string;
        lines: { title: string; quantity: number; unitPrice: number; lineTotal: number }[];
      };
      reorder: ReorderLine[];
    }
  | { ok: false; error: 'notFound' | 'rateLimited' | 'invalid' | 'forbidden' };

/**
 * Verifies order number + phone. Failures always return `notFound` (except rate/origin)
 * so callers cannot probe which half of the credentials is wrong.
 */
export async function lookupOrder(raw: unknown): Promise<LookupOrderResult> {
  if (!(await isSameOrigin())) return { ok: false, error: 'forbidden' };

  const ip = await getClientIp();
  if (!(await checkRateLimit('orderLookup', ip))) return { ok: false, error: 'rateLimited' };

  const parsed = lookupSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'invalid' };

  const { orderNumber, phone, locale } = parsed.data;
  const order = await sanityFetchFresh<StoredLookupOrder>(
    `*[_type == "order" && orderNumber == $orderNumber][0]{
      orderNumber, status, createdAt, fulfillment, paymentMethod, paymentStatus,
      customer, address, slot, total, deliveryFee, discount, subtotal,
      "receiptUrl": receipt.documentUrl,
      items[]{
        title, quantity, unitPrice, lineTotal, dedication, ribbonColor, balloonColor, balloonText,
        "productId": product._ref
      }
    }`,
    { orderNumber },
  );

  if (!order?.customer?.phone || phoneKey(order.customer.phone) !== phoneKey(phone)) {
    return { ok: false, error: 'notFound' };
  }

  const [products, promotions] = await Promise.all([getProducts().catch(() => []), getPromotions().catch(() => [])]);
  const byId = new Map(products.map((p) => [p._id, p]));

  const reorder: ReorderLine[] = (order.items ?? [])
    .filter((item) => item.productId && (item.quantity ?? 0) > 0)
    .map((item) => {
      const product = byId.get(item.productId!);
      const quantity = Math.min(50, Math.max(1, Math.floor(item.quantity ?? 1)));
      if (!product || !product.inStock) {
        return {
          productId: item.productId!,
          quantity,
          dedication: item.dedication,
          ribbonColor: item.ribbonColor as RibbonColor | undefined,
          balloonColor: item.balloonColor as BalloonColor | undefined,
          balloonText: item.balloonText,
          snapshot: { title: item.title || 'מוצר', slug: '', price: item.unitPrice ?? 0 },
          unavailable: true,
        };
      }
      const { price } = getProductPrice(product, promotions);
      return {
        productId: product._id,
        quantity,
        dedication: item.dedication,
        ribbonColor: item.ribbonColor as RibbonColor | undefined,
        balloonColor: item.balloonColor as BalloonColor | undefined,
        balloonText: item.balloonText,
        snapshot: {
          title: localize(product.title, locale),
          slug: product.slug,
          price,
          image: product.images?.[0],
        },
      };
    });

  return {
    ok: true,
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
      fulfillment: order.fulfillment,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      customerName: order.customer?.name,
      address: order.address,
      slotLabel: order.slot?.label,
      total: order.total,
      deliveryFee: order.deliveryFee,
      discount: order.discount,
      subtotal: order.subtotal,
      receiptUrl: order.receiptUrl?.startsWith('https://') ? order.receiptUrl : undefined,
      lines: (order.items ?? []).map((item) => ({
        title: item.title || 'פריט',
        quantity: item.quantity ?? 1,
        unitPrice: item.unitPrice ?? 0,
        lineTotal: item.lineTotal ?? (item.unitPrice ?? 0) * (item.quantity ?? 1),
      })),
    },
    reorder,
  };
}
