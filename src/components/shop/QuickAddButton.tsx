'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import type { SanityImage } from '@/lib/types';
import { useCart } from '../cart/CartProvider';
import { CartIcon } from '../ui/icons';

export function QuickAddButton({
  product,
  className,
}: {
  product: { _id: string; title: string; slug: string; price: number; image?: SanityImage };
  className?: string;
}) {
  const t = useTranslations('common');
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const id = window.setTimeout(() => setAdded(false), 1800);
    return () => window.clearTimeout(id);
  }, [added]);

  return (
    <button
      type="button"
      onClick={() => {
        addItem({ productId: product._id, snapshot: { title: product.title, slug: product.slug, price: product.price, image: product.image } });
        setAdded(true);
      }}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition active:scale-95',
        added ? 'bg-[#1f9d55] text-white' : 'bg-gold-400 text-wine-950 hover:bg-gold-300',
        className,
      )}
    >
      {!added && <CartIcon width={18} height={18} />}
      <span aria-live="polite">{added ? t('added') : t('addToCart')}</span>
    </button>
  );
}
