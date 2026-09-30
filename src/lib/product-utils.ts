import type { Product } from './types';

/** Products whose options must be chosen on the product page before adding to the cart. */
export function requiresOptions(product: Product): boolean {
  if (product.kind === 'gift') return (product.gift?.ribbonColors?.length ?? 0) > 0;
  if (product.kind === 'balloons') return (product.balloons?.colors?.length ?? 0) > 0;
  return false;
}
