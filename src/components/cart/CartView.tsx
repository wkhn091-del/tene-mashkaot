'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { buttonStyles, cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';
import { localize } from '@/lib/i18n-utils';
import type { SanityImage as SanityImageData } from '@/lib/types';
import { SanityImage } from '../shop/SanityImage';
import { ProductPlaceholder } from '../shop/ProductPlaceholder';
import { QuickAddButton } from '../shop/QuickAddButton';
import { ArrowIcon, MinusIcon, PlusIcon, TrashIcon } from '../ui/icons';
import { useCart, type CartItem } from './CartProvider';
import { useQuote } from './useQuote';

export interface CartSuggestion {
  _id: string;
  title: string;
  slug: string;
  price: number;
  image?: SanityImageData;
  kind: string;
  featured: boolean;
  requiresOptions: boolean;
}

const MAX_SUGGESTIONS = 3;

/** Prefers product types the cart doesn't have yet (wine → sweets, gifts, balloons), then featured items. */
function pickSuggestions(pool: CartSuggestion[], items: CartItem[]): CartSuggestion[] {
  const inCart = new Set(items.map((i) => i.productId));
  const cartKinds = new Set(pool.filter((p) => inCart.has(p._id)).map((p) => p.kind));
  const score = (p: CartSuggestion) => (cartKinds.has(p.kind) ? 0 : 2) + (p.featured ? 1 : 0);
  return pool
    .filter((p) => !inCart.has(p._id))
    .map((p, index) => ({ p, index }))
    .sort((a, b) => score(b.p) - score(a.p) || a.index - b.index)
    .slice(0, MAX_SUGGESTIONS)
    .map(({ p }) => p);
}

function CartSuggestions({ pool, items }: { pool: CartSuggestion[]; items: CartItem[] }) {
  const t = useTranslations('cart');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const picks = pickSuggestions(pool, items);
  if (!picks.length) return null;
  return (
    <section aria-labelledby="cart-suggestions" className="pt-6">
      <h2 id="cart-suggestions" className="font-display mb-3 text-xl text-gold-200">
        {t('suggestions')}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-3">
        {picks.map((product) => (
          <li key={product._id} className="flex items-center gap-3 rounded-2xl border border-gold-400/15 bg-wine-900/40 p-3 sm:flex-col sm:items-stretch">
            <Link href={`/product/${product.slug}`} className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-wine-900 sm:h-32 sm:w-full" tabIndex={-1} aria-hidden>
              {product.image?.asset ? <SanityImage image={product.image} alt="" sizes="(min-width: 640px) 200px, 64px" className="object-contain p-1" /> : null}
            </Link>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Link href={`/product/${product.slug}`} className="line-clamp-2 text-sm font-semibold hover:text-gold-200">
                {product.title}
              </Link>
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-gold-300">{formatPrice(product.price, locale)}</span>
                {product.requiresOptions ? (
                  <Link href={`/product/${product.slug}`} className="rounded-full border border-gold-400/50 px-3 py-1.5 text-xs font-semibold text-gold-200 hover:bg-gold-400/10">
                    {tCommon('chooseOptions')}
                  </Link>
                ) : (
                  <QuickAddButton product={product} className="px-3 py-1.5 text-xs" />
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CartItemOptions({ item }: { item: CartItem }) {
  const t = useTranslations('product');
  const tColors = useTranslations('colors');
  const rows = [
    item.ribbonColor && `${t('ribbonColor')}: ${tColors(item.ribbonColor)}`,
    item.balloonColor && `${t('balloonColor')}: ${tColors(item.balloonColor)}`,
    item.balloonText && `${t('balloonText')}: ${item.balloonText}`,
    item.dedication && `${t('dedication')}: ${item.dedication}`,
  ].filter(Boolean) as string[];
  if (!rows.length) return null;
  return (
    <ul className="mt-1 space-y-0.5 text-xs text-cream/60">
      {rows.map((row) => (
        <li key={row} className="break-words">
          {row}
        </li>
      ))}
    </ul>
  );
}

export function CartView({ suggestions = [] }: { suggestions?: CartSuggestion[] }) {
  const t = useTranslations('cart');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  const locale = useLocale();
  const { items, hydrated, setQuantity, removeItem } = useCart();
  const quote = useQuote({ items, hydrated });
  const data = quote.quote;
  const unitPrice = new Map(data?.lines.map((l) => [l.productId, l]) ?? []);
  const missing = new Set(data?.missingProductIds ?? []);
  const outOfStock = new Set(data?.outOfStockIds ?? []);
  const blocked = items.some((i) => missing.has(i.productId) || outOfStock.has(i.productId));
  const lang = locale === 'en' ? 'en' : 'he';

  if (!hydrated) {
    return (
      <div className="space-y-3" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-[var(--radius-card)] border border-gold-400/20 bg-wine-900/50 p-10 text-center">
        <p className="text-xl">{t('empty')}</p>
        <Link href="/shop" className={cn(buttonStyles.primary, 'mt-6')}>
          {t('emptyCta')}
        </Link>
      </div>
    );
  }

  const gifts = data?.totals.gifts;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div>
      <ul className="space-y-3">
        {items.map((item) => {
          const line = unitPrice.get(item.productId);
          const price = line?.unitPrice ?? item.snapshot.price;
          const isMissing = missing.has(item.productId);
          const isOut = outOfStock.has(item.productId);
          const image = line?.image ?? item.snapshot.image;
          return (
            <li
              key={item.key}
              className={cn('flex gap-4 rounded-2xl border bg-wine-900/50 p-3 sm:p-4', isMissing || isOut ? 'border-red-400/50' : 'border-gold-400/15')}
            >
              <Link href={`/product/${item.snapshot.slug}`} className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-wine-900" tabIndex={-1} aria-hidden>
                {image?.asset ? <SanityImage image={image} alt="" sizes="80px" className="object-contain p-1" /> : <ProductPlaceholder kind="wine" />}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/product/${item.snapshot.slug}`} className="font-semibold hover:text-gold-200">
                      {line?.title ?? item.snapshot.title}
                    </Link>
                    <CartItemOptions item={item} />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.key)}
                    aria-label={`${tCommon('remove')} ${item.snapshot.title}`}
                    className="rounded-full p-2 text-cream/60 transition hover:bg-white/5 hover:text-red-300"
                  >
                    <TrashIcon width={18} height={18} />
                  </button>
                </div>
                {(isMissing || isOut) && (
                  <p role="alert" className="mt-1 text-sm text-red-300">
                    {isMissing ? t('unavailable') : t('outOfStockItem')}
                  </p>
                )}
                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                  <div className="flex items-center rounded-full border border-gold-400/25">
                    <button
                      type="button"
                      onClick={() => setQuantity(item.key, item.quantity - 1)}
                      aria-label={tCommon('decrease')}
                      className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/5"
                    >
                      <MinusIcon width={16} height={16} />
                    </button>
                    <span className="w-8 text-center font-semibold tabular-nums" aria-label={tCommon('quantity')}>
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(item.key, item.quantity + 1)}
                      disabled={item.quantity >= 50}
                      aria-label={tCommon('increase')}
                      className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/5 disabled:opacity-40"
                    >
                      <PlusIcon width={16} height={16} />
                    </button>
                  </div>
                  <span className="font-bold text-gold-300">{formatPrice(Math.round(price * item.quantity * 100) / 100, locale)}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <CartSuggestions pool={suggestions} items={items} />
      </div>

      <aside className="h-fit space-y-4 rounded-[var(--radius-card)] border border-gold-400/20 bg-wine-900/60 p-6 lg:sticky lg:top-28" aria-busy={quote.status === 'loading'}>
        <div className="flex items-center justify-between text-lg">
          <span>{t('itemsTotal')}</span>
          <span className="font-bold text-gold-300">{data ? formatPrice(data.totals.itemsTotal, locale) : <span className="skeleton inline-block h-6 w-20 rounded" />}</span>
        </div>
        {data && data.totals.savings > 0 && <p className="text-sm text-[#86efac]">{t('savings', { amount: formatPrice(data.totals.savings, locale) })}</p>}
        {gifts?.earned[0] && (
          <p className="rounded-xl bg-gold-400/10 px-3 py-2 text-sm text-gold-100">{t('giftEarned', { gift: localize(gifts.earned[0].gift ?? gifts.earned[0].title, lang) })}</p>
        )}
        {gifts?.next && (
          <p className="text-sm text-cream/75">
            {t('giftNext', { amount: formatPrice(gifts.next.missing, locale), gift: localize(gifts.next.gift ?? gifts.next.title, lang) })}
          </p>
        )}
        {quote.status === 'error' && (
          <p role="alert" className="text-sm text-red-300">
            {t('loadError')}{' '}
            <button type="button" onClick={quote.refresh} className="underline underline-offset-2">
              {tErrors('retry')}
            </button>
          </p>
        )}
        <Link
          href="/checkout"
          aria-disabled={blocked}
          className={cn(buttonStyles.primary, 'w-full py-3.5 text-lg', blocked && 'pointer-events-none opacity-50')}
          tabIndex={blocked ? -1 : undefined}
        >
          {t('checkout')}
          <ArrowIcon width={20} height={20} />
        </Link>
        <Link href="/shop" className="block text-center text-sm text-cream/70 underline-offset-4 hover:underline">
          {t('continue')}
        </Link>
      </aside>
    </div>
  );
}
