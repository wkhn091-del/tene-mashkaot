import { readConsent } from './consent';

/**
 * GA4 + Meta Pixel e-commerce events. Every call is a no-op unless the visitor opted in to the
 * matching category and the ID is configured, so components can call `track` unconditionally.
 */

type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue?: unknown[]; push?: unknown; loaded?: boolean; version?: string };

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? '';
export const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '';
export const TRACKING_CONFIGURED = Boolean(GA_ID || PIXEL_ID);

export interface AnalyticsItem {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  category?: string;
}

export type AnalyticsEvent =
  | { name: 'view_item'; item: AnalyticsItem }
  | { name: 'add_to_cart'; item: AnalyticsItem }
  | { name: 'begin_checkout'; value: number; items: AnalyticsItem[] }
  | { name: 'purchase'; transactionId: string; value: number; items: AnalyticsItem[]; shipping?: number; coupon?: string }
  | { name: 'generate_lead'; leadType: string };

const CURRENCY = 'ILS';
const gaItem = (item: AnalyticsItem) => ({
  item_id: item.id,
  item_name: item.name,
  price: item.price,
  quantity: item.quantity ?? 1,
  ...(item.category ? { item_category: item.category } : {}),
});
const itemsValue = (items: AnalyticsItem[]) => Math.round(items.reduce((sum, item) => sum + item.price * (item.quantity ?? 1), 0) * 100) / 100;

function sendGa(event: AnalyticsEvent) {
  const gtag = window.gtag;
  if (!gtag) return;
  switch (event.name) {
    case 'view_item':
    case 'add_to_cart':
      gtag('event', event.name, { currency: CURRENCY, value: event.item.price * (event.item.quantity ?? 1), items: [gaItem(event.item)] });
      break;
    case 'begin_checkout':
      gtag('event', 'begin_checkout', { currency: CURRENCY, value: event.value, items: event.items.map(gaItem) });
      break;
    case 'purchase':
      gtag('event', 'purchase', {
        transaction_id: event.transactionId,
        currency: CURRENCY,
        value: event.value,
        shipping: event.shipping ?? 0,
        ...(event.coupon ? { coupon: event.coupon } : {}),
        items: event.items.map(gaItem),
      });
      break;
    case 'generate_lead':
      gtag('event', 'generate_lead', { lead_type: event.leadType });
      break;
  }
}

function sendPixel(event: AnalyticsEvent) {
  const fbq = window.fbq;
  if (!fbq) return;
  switch (event.name) {
    case 'view_item':
      fbq('track', 'ViewContent', { content_ids: [event.item.id], content_name: event.item.name, content_type: 'product', value: event.item.price, currency: CURRENCY });
      break;
    case 'add_to_cart':
      fbq('track', 'AddToCart', {
        content_ids: [event.item.id],
        content_name: event.item.name,
        content_type: 'product',
        value: event.item.price * (event.item.quantity ?? 1),
        currency: CURRENCY,
      });
      break;
    case 'begin_checkout':
      fbq('track', 'InitiateCheckout', { content_ids: event.items.map((i) => i.id), num_items: event.items.length, value: event.value, currency: CURRENCY });
      break;
    case 'purchase':
      // eventID lets a future server-side Conversions API deduplicate against this browser event.
      fbq(
        'track',
        'Purchase',
        { content_ids: event.items.map((i) => i.id), content_type: 'product', num_items: event.items.length, value: event.value, currency: CURRENCY },
        { eventID: event.transactionId },
      );
      break;
    case 'generate_lead':
      fbq('track', 'Lead', { content_name: event.leadType });
      break;
  }
}

export function track(event: AnalyticsEvent): void {
  if (typeof window === 'undefined' || !TRACKING_CONFIGURED) return;
  const consent = readConsent();
  try {
    if (consent?.analytics) sendGa(event);
    if (consent?.marketing) sendPixel(event);
  } catch (error) {
    console.warn('[analytics] event failed', error);
  }
}

/** Order details kept between checkout and the order page, where the purchase is reported. */
export const PENDING_PURCHASE_KEY = 'tene_pending_purchase';

export interface PendingPurchase {
  transactionId: string;
  value: number;
  shipping: number;
  coupon?: string;
  items: AnalyticsItem[];
  paymentMethod: 'card' | 'onDelivery';
}

export function rememberPurchase(purchase: PendingPurchase): void {
  try {
    window.sessionStorage.setItem(PENDING_PURCHASE_KEY, JSON.stringify(purchase));
  } catch {
    // Storage unavailable: the purchase simply isn't reported.
  }
}

/** Reports the purchase once per order (a refreshed order page does not double count). */
export function reportPurchaseOnce(orderNumber: string, paymentStatus?: string): void {
  try {
    const raw = window.sessionStorage.getItem(PENDING_PURCHASE_KEY);
    if (!raw) return;
    const purchase = JSON.parse(raw) as PendingPurchase;
    if (purchase.transactionId !== orderNumber) return;
    if (purchase.paymentMethod === 'card' && paymentStatus !== 'paid') return;
    const sentKey = `tene_purchase_sent:${orderNumber}`;
    if (window.localStorage.getItem(sentKey)) return;
    track({ name: 'purchase', transactionId: orderNumber, value: purchase.value, items: purchase.items, shipping: purchase.shipping, coupon: purchase.coupon });
    window.localStorage.setItem(sentKey, '1');
    window.sessionStorage.removeItem(PENDING_PURCHASE_KEY);
  } catch {
    // Ignore malformed storage.
  }
}

export { itemsValue };
