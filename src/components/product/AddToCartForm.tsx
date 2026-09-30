'use client';

import { useTranslations } from 'next-intl';
import { useId, useState, type FormEvent } from 'react';
import { Link } from '@/i18n/navigation';
import { buttonStyles, cn } from '@/lib/cn';
import type { BalloonColor, RibbonColor, SanityImage } from '@/lib/types';
import { useCart } from '../cart/CartProvider';
import { CartIcon, MinusIcon, PlusIcon } from '../ui/icons';

const SWATCH: Record<string, string> = {
  gold: '#d4a95a',
  purple: '#6d28d9',
  burgundy: '#5a1a22',
  silver: '#c0c4cc',
  white: '#f8f8f8',
  red: '#dc2626',
  blue: '#2563eb',
  pink: '#f472b6',
  black: '#111111',
  mixed: 'conic-gradient(#d4a95a, #f472b6, #2563eb, #dc2626, #d4a95a)',
};

const DEDICATION_MAX = 300;
const BALLOON_TEXT_MAX = 40;

function Swatches<T extends string>({
  legend,
  options,
  value,
  onChange,
  name,
}: {
  legend: string;
  options: readonly T[];
  value: T | undefined;
  onChange: (value: T) => void;
  name: string;
}) {
  const tColors = useTranslations('colors');
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-cream/85">
        {legend}: <span className="font-normal text-gold-200">{value ? tColors(value as 'gold') : ''}</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option} className="cursor-pointer">
            <input type="radio" name={name} value={option} checked={value === option} onChange={() => onChange(option)} className="peer sr-only" />
            <span
              title={tColors(option as 'gold')}
              className="block h-10 w-10 rounded-full border-2 border-white/20 ring-offset-2 ring-offset-wine-950 transition peer-checked:ring-2 peer-checked:ring-gold-300 peer-focus-visible:ring-2 peer-focus-visible:ring-gold-300"
              style={{ background: SWATCH[option] ?? option }}
            />
            <span className="sr-only">{tColors(option as 'gold')}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function AddToCartForm({
  product,
}: {
  product: {
    _id: string;
    title: string;
    slug: string;
    price: number;
    image?: SanityImage;
    inStock: boolean;
    ribbonColors: RibbonColor[];
    balloonColors: BalloonColor[];
    allowDedication: boolean;
    allowBalloonText: boolean;
  };
}) {
  const t = useTranslations('product');
  const tCommon = useTranslations('common');
  const tCart = useTranslations('cart');
  const { addItem } = useCart();
  const ids = { dedication: useId(), balloonText: useId(), qty: useId() };

  const [ribbonColor, setRibbonColor] = useState<RibbonColor | undefined>(product.ribbonColors[0]);
  const [balloonColor, setBalloonColor] = useState<BalloonColor | undefined>(product.balloonColors[0]);
  const [dedication, setDedication] = useState('');
  const [balloonText, setBalloonText] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product.inStock) {
    return <p className="rounded-xl bg-black/40 px-4 py-3 text-center font-semibold text-cream/80">{tCommon('outOfStock')}</p>;
  }

  const hasCustomization = product.ribbonColors.length > 0 || product.balloonColors.length > 0 || product.allowDedication || product.allowBalloonText;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    addItem(
      {
        productId: product._id,
        ribbonColor: product.ribbonColors.length ? ribbonColor : undefined,
        balloonColor: product.balloonColors.length ? balloonColor : undefined,
        dedication: product.allowDedication && dedication.trim() ? dedication.trim().slice(0, DEDICATION_MAX) : undefined,
        balloonText: product.allowBalloonText && balloonText.trim() ? balloonText.trim().slice(0, BALLOON_TEXT_MAX) : undefined,
        snapshot: { title: product.title, slug: product.slug, price: product.price, image: product.image },
      },
      quantity,
    );
    setAdded(true);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {hasCustomization && (
        <div className="space-y-5 rounded-[var(--radius-card)] border border-gold-400/20 bg-wine-900/50 p-5">
          <h2 className="font-display text-xl text-gold-200">{t('customize')}</h2>
          {product.ribbonColors.length > 0 && (
            <Swatches legend={t('ribbonColor')} name="ribbon" options={product.ribbonColors} value={ribbonColor} onChange={setRibbonColor} />
          )}
          {product.balloonColors.length > 0 && (
            <Swatches legend={t('balloonColor')} name="balloon" options={product.balloonColors} value={balloonColor} onChange={setBalloonColor} />
          )}
          {product.allowBalloonText && (
            <div>
              <label htmlFor={ids.balloonText} className="mb-2 flex justify-between text-sm font-semibold text-cream/85">
                <span>
                  {t('balloonText')} <span className="font-normal text-cream/50">{tCommon('optional')}</span>
                </span>
                <span className="font-normal text-cream/50">{t('chars', { count: balloonText.length, max: BALLOON_TEXT_MAX })}</span>
              </label>
              <input
                id={ids.balloonText}
                className="field"
                maxLength={BALLOON_TEXT_MAX}
                value={balloonText}
                onChange={(e) => setBalloonText(e.target.value)}
                placeholder={t('balloonTextPlaceholder')}
              />
            </div>
          )}
          {product.allowDedication && (
            <div>
              <label htmlFor={ids.dedication} className="mb-2 flex justify-between text-sm font-semibold text-cream/85">
                <span>
                  {t('dedication')} <span className="font-normal text-cream/50">{tCommon('optional')}</span>
                </span>
                <span className="font-normal text-cream/50">{t('chars', { count: dedication.length, max: DEDICATION_MAX })}</span>
              </label>
              <textarea
                id={ids.dedication}
                className="field min-h-24 resize-y"
                maxLength={DEDICATION_MAX}
                value={dedication}
                onChange={(e) => setDedication(e.target.value)}
                placeholder={t('dedicationPlaceholder')}
              />
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-full border border-gold-400/30" role="group" aria-labelledby={ids.qty}>
          <span id={ids.qty} className="sr-only">
            {tCommon('quantity')}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label={tCommon('decrease')}
            className="flex h-12 w-12 items-center justify-center rounded-full hover:bg-white/5 disabled:opacity-40"
          >
            <MinusIcon width={18} height={18} />
          </button>
          <output className="w-10 text-center text-lg font-bold tabular-nums" aria-live="polite">
            {quantity}
          </output>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(50, q + 1))}
            disabled={quantity >= 50}
            aria-label={tCommon('increase')}
            className="flex h-12 w-12 items-center justify-center rounded-full hover:bg-white/5 disabled:opacity-40"
          >
            <PlusIcon width={18} height={18} />
          </button>
        </div>
        <button type="submit" className={cn(buttonStyles.primary, 'flex-1 py-3.5 text-lg')}>
          <CartIcon width={22} height={22} />
          {tCommon('addToCart')}
        </button>
      </div>

      <p role="status" aria-live="polite" className="min-h-6 text-center">
        {added && (
          <Link href="/cart" className="font-semibold text-[#86efac] underline underline-offset-4">
            {tCommon('added')} · {tCart('checkout')}
          </Link>
        )}
      </p>
    </form>
  );
}
