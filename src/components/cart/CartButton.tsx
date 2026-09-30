'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { CartIcon } from '../ui/icons';
import { useCart } from './CartProvider';

export function CartButton() {
  const t = useTranslations('nav');
  const { count, hydrated } = useCart();

  return (
    <Link
      href="/cart"
      aria-label={t('cartCount', { count: hydrated ? count : 0 })}
      className="relative flex h-11 w-11 items-center justify-center rounded-full text-cream transition hover:bg-white/10"
    >
      <CartIcon width={24} height={24} />
      <AnimatePresence>
        {hydrated && count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            aria-hidden
            className="absolute -top-0.5 -end-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-400 px-1 text-[0.7rem] font-bold text-wine-950"
          >
            {count > 99 ? '99+' : count}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}
