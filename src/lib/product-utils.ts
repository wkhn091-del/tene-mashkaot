import type { Product } from './types';

/** Products whose options must be chosen on the product page before adding to the cart. */
export function requiresOptions(product: Product): boolean {
  if (product.kind === 'gift') return (product.gift?.ribbonColors?.length ?? 0) > 0;
  if (product.kind === 'balloons') return (product.balloons?.colors?.length ?? 0) > 0;
  return false;
}

/** Unit price per 100 ml, which Israeli consumer law requires next to the price of packaged drinks. */
export function pricePer100ml(price: number, volumeMl?: number | null): number | null {
  if (!volumeMl || volumeMl <= 0) return null;
  return Math.round((price * 10000) / volumeMl) / 100;
}
