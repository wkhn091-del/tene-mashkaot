import 'server-only';
import { sanityFetchFresh } from '@/sanity/lib/fetch';
import { getReadClient, getWriteClient } from '@/sanity/lib/client';
import type { MorningOrder, PaidWith } from './morning';

export interface StoredOrder {
  _id: string;
  _rev: string;
  orderNumber: string;
  status?: string;
  createdAt?: string;
  locale?: 'he' | 'en';
  fulfillment?: 'delivery' | 'pickup';
  paymentMethod?: 'card' | 'onDelivery';
  paymentStatus?: string;
  paidWith?: PaidWith;
  paidAt?: string;
  customer?: { name?: string; phone?: string; email?: string };
  address?: { city?: string; street?: string; apartment?: string };
  slot?: { start?: string; end?: string; label?: string };
  items?: { title?: string; quantity?: number; unitPrice?: number; lineTotal?: number }[];
  couponCode?: string;
  subtotal?: number;
  discount?: number;
  deliveryFee?: number;
  total?: number;
  notes?: string;
  receipt?: { status?: string; documentId?: string; documentNumber?: string; documentUrl?: string; error?: string };
}

export const ORDER_ID_PATTERN = /^order\.[0-9a-f-]{36}$/;

export async function getOrderById(id: string): Promise<StoredOrder | null> {
  const client = getWriteClient() ?? getReadClient();
  if (!client || !ORDER_ID_PATTERN.test(id)) return null;
  return (await client.getDocument<StoredOrder>(id)) ?? null;
}

export interface PublicOrderStatus {
  paymentMethod?: 'card' | 'onDelivery';
  paymentStatus?: string;
  total?: number;
  receiptUrl?: string;
}

/** Only non-personal fields – the order page is reachable by anyone who has the order number. */
export async function getOrderPublicStatus(orderNumber: string): Promise<PublicOrderStatus | null> {
  return sanityFetchFresh<PublicOrderStatus>(
    `*[_type == "order" && orderNumber == $orderNumber][0]{paymentMethod, paymentStatus, total, "receiptUrl": receipt.documentUrl}`,
    { orderNumber },
  );
}

export function toMorningOrder(order: StoredOrder): MorningOrder {
  return {
    orderNumber: order.orderNumber,
    locale: order.locale === 'en' ? 'en' : 'he',
    customer: { name: order.customer?.name || 'לקוח', phone: order.customer?.phone ?? '', email: order.customer?.email || undefined },
    lines: (order.items ?? []).map((item) => ({ title: item.title || 'פריט', quantity: item.quantity ?? 1, unitPrice: item.unitPrice ?? 0 })),
    deliveryFee: order.deliveryFee ?? 0,
    couponDiscount: order.discount ?? 0,
    total: order.total ?? 0,
  };
}

export async function listOrdersForExport(days: number): Promise<StoredOrder[]> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  return (
    (await sanityFetchFresh<StoredOrder[]>(`*[_type == "order" && createdAt >= $since] | order(createdAt desc)[0...5000]`, { since })) ?? []
  );
}

export interface StoredInquiry {
  createdAt?: string;
  status?: string;
  name?: string;
  phone?: string;
  email?: string;
  eventType?: string;
  eventDate?: string;
  guests?: number;
  budget?: number;
  message?: string;
}

export async function listInquiriesForExport(days: number): Promise<StoredInquiry[]> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  return (
    (await sanityFetchFresh<StoredInquiry[]>(`*[_type == "eventInquiry" && createdAt >= $since] | order(createdAt desc)[0...5000]`, { since })) ?? []
  );
}
