import { fromAgorot, toAgorot } from './format';
import type { DeliveryZone, LocaleString, Product, Promotion } from './types';

export interface PricedLineInput {
  productId: string;
  quantity: number;
}

export interface PricedLine {
  productId: string;
  quantity: number;
  basePrice: number;
  unitPrice: number;
  lineTotal: number;
  promotionId?: string;
  promotionBadge?: LocaleString;
}

export interface GiftProgress {
  earned: { id: string; title: LocaleString; gift?: LocaleString; threshold: number }[];
  next?: { id: string; title: LocaleString; gift?: LocaleString; threshold: number; missing: number };
}

export interface CartTotals {
  lines: PricedLine[];
  itemsTotal: number;
  couponDiscount: number;
  coupon?: { code: string; valid: boolean; reason?: 'notFound' | 'minSubtotal' | 'expired'; minSubtotal?: number };
  subtotal: number;
  deliveryFee: number;
  total: number;
  gifts: GiftProgress;
  minOrder: number;
  meetsMinOrder: boolean;
  freeDeliveryMissing?: number;
  /** Savings from item promotions + coupon, for display. */
  savings: number;
}

export function isPromotionActive(promotion: Promotion, now: Date): boolean {
  if (promotion.active === false) return false;
  if (promotion.startsAt && new Date(promotion.startsAt) > now) return false;
  if (promotion.endsAt && new Date(promotion.endsAt) <= now) return false;
  return true;
}

function appliesToProduct(promotion: Promotion, product: Product): boolean {
  switch (promotion.scope) {
    case 'all':
      return true;
    case 'categories':
      return !!product.category?._id && (promotion.categoryIds ?? []).includes(product.category._id);
    case 'products':
      return (promotion.productIds ?? []).includes(product._id);
    default:
      return false;
  }
}

/** Best (lowest) promotional unit price for a product, in shekels. */
export function getProductPrice(product: Product, promotions: Promotion[], now = new Date()): {
  basePrice: number;
  price: number;
  promotion?: Promotion;
} {
  const basePrice = product.price;
  let best = toAgorot(basePrice);
  let bestPromotion: Promotion | undefined;

  for (const promotion of promotions) {
    if (!isPromotionActive(promotion, now) || !appliesToProduct(promotion, product)) continue;
    let candidate: number | null = null;
    if (promotion.kind === 'percentOff' && promotion.percent && promotion.percent > 0 && promotion.percent < 100) {
      candidate = Math.round(toAgorot(basePrice) * (1 - promotion.percent / 100));
    } else if (promotion.kind === 'fixedPrice' && promotion.fixedPrice && promotion.fixedPrice > 0) {
      candidate = toAgorot(promotion.fixedPrice);
    }
    if (candidate !== null && candidate < best) {
      best = candidate;
      bestPromotion = promotion;
    }
  }

  return { basePrice, price: fromAgorot(best), promotion: bestPromotion };
}

export function computeGiftProgress(subtotal: number, promotions: Promotion[], now = new Date()): GiftProgress {
  const tiers = promotions
    .filter((p) => p.kind === 'giftThreshold' && p.threshold && p.threshold > 0 && isPromotionActive(p, now))
    .sort((a, b) => (a.threshold ?? 0) - (b.threshold ?? 0));

  const earnedTiers = tiers.filter((p) => subtotal >= (p.threshold ?? Infinity));
  // Tiers are cumulative alternatives (300 / 500 / 1000): the customer receives the highest reached.
  const top = earnedTiers.at(-1);
  const next = tiers.find((p) => subtotal < (p.threshold ?? 0));

  return {
    earned: top ? [{ id: top._id, title: top.title, gift: top.giftDescription, threshold: top.threshold ?? 0 }] : [],
    next: next
      ? {
          id: next._id,
          title: next.title,
          gift: next.giftDescription,
          threshold: next.threshold ?? 0,
          missing: fromAgorot(toAgorot(next.threshold ?? 0) - toAgorot(subtotal)),
        }
      : undefined,
  };
}

interface ComputeCartArgs {
  items: PricedLineInput[];
  products: Product[];
  promotions: Promotion[];
  zone?: DeliveryZone | null;
  fulfillment?: 'delivery' | 'pickup';
  couponCode?: string | null;
  now?: Date;
}

export function computeCart({ items, products, promotions, zone, fulfillment = 'delivery', couponCode, now = new Date() }: ComputeCartArgs): CartTotals {
  const productMap = new Map(products.map((p) => [p._id, p]));
  const lines: PricedLine[] = [];
  let itemsAgorot = 0;
  let baseAgorot = 0;

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) continue;
    const { basePrice, price, promotion } = getProductPrice(product, promotions, now);
    const lineAgorot = toAgorot(price) * item.quantity;
    itemsAgorot += lineAgorot;
    baseAgorot += toAgorot(basePrice) * item.quantity;
    lines.push({
      productId: product._id,
      quantity: item.quantity,
      basePrice,
      unitPrice: price,
      lineTotal: fromAgorot(lineAgorot),
      promotionId: promotion?._id,
      promotionBadge: promotion?.badge,
    });
  }

  let couponAgorot = 0;
  let coupon: CartTotals['coupon'];
  const normalizedCode = couponCode?.trim().toUpperCase();
  if (normalizedCode) {
    const match = promotions.find((p) => p.kind === 'coupon' && p.code?.trim().toUpperCase() === normalizedCode);
    if (!match) {
      coupon = { code: normalizedCode, valid: false, reason: 'notFound' };
    } else if (!isPromotionActive(match, now)) {
      coupon = { code: normalizedCode, valid: false, reason: 'expired' };
    } else if (match.minSubtotal && itemsAgorot < toAgorot(match.minSubtotal)) {
      coupon = { code: normalizedCode, valid: false, reason: 'minSubtotal', minSubtotal: match.minSubtotal };
    } else {
      const value = match.couponValue ?? 0;
      couponAgorot =
        match.couponType === 'amount' ? Math.min(toAgorot(value), itemsAgorot) : Math.round(itemsAgorot * Math.min(Math.max(value, 0), 100) / 100);
      coupon = { code: normalizedCode, valid: true };
    }
  }

  const subtotalAgorot = Math.max(itemsAgorot - couponAgorot, 0);
  const subtotal = fromAgorot(subtotalAgorot);

  let deliveryAgorot = 0;
  let freeDeliveryMissing: number | undefined;
  const minOrder = fulfillment === 'delivery' ? zone?.minOrder ?? 0 : 0;
  if (fulfillment === 'delivery' && zone) {
    const freeAbove = zone.freeAbove ?? null;
    if (freeAbove !== null && subtotalAgorot >= toAgorot(freeAbove)) {
      deliveryAgorot = 0;
    } else {
      deliveryAgorot = toAgorot(zone.fee);
      if (freeAbove !== null && zone.fee > 0) freeDeliveryMissing = fromAgorot(toAgorot(freeAbove) - subtotalAgorot);
    }
  }

  return {
    lines,
    itemsTotal: fromAgorot(itemsAgorot),
    couponDiscount: fromAgorot(couponAgorot),
    coupon,
    subtotal,
    deliveryFee: fromAgorot(deliveryAgorot),
    total: fromAgorot(subtotalAgorot + deliveryAgorot),
    gifts: computeGiftProgress(subtotal, promotions, now),
    minOrder,
    meetsMinOrder: subtotalAgorot >= toAgorot(minOrder),
    freeDeliveryMissing,
    savings: fromAgorot(baseAgorot - itemsAgorot + couponAgorot),
  };
}
