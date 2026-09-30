import { getTranslations } from 'next-intl/server';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/cn';

export async function PriceTag({
  price,
  basePrice,
  locale,
  size = 'md',
}: {
  price: number;
  basePrice: number;
  locale: string;
  size?: 'md' | 'lg';
}) {
  const t = await getTranslations({ locale, namespace: 'product' });
  const onSale = price < basePrice;
  return (
    <p data-price className="flex flex-wrap items-baseline gap-x-2">
      <span className={cn('font-bold text-gold-300', size === 'lg' ? 'text-3xl' : 'text-lg')}>{formatPrice(price, locale)}</span>
      {onSale && (
        <span className={cn('text-cream/50 line-through', size === 'lg' ? 'text-lg' : 'text-sm')}>
          <span className="sr-only">{t('wasPrice')}: </span>
          {formatPrice(basePrice, locale)}
        </span>
      )}
    </p>
  );
}
