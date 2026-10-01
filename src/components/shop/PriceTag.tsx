import { getTranslations } from 'next-intl/server';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/cn';
import { pricePer100ml } from '@/lib/product-utils';

export async function PriceTag({
  price,
  basePrice,
  locale,
  volumeMl,
  size = 'md',
}: {
  price: number;
  basePrice: number;
  locale: string;
  volumeMl?: number | null;
  size?: 'md' | 'lg';
}) {
  const t = await getTranslations({ locale, namespace: 'product' });
  const onSale = price < basePrice;
  const unit = pricePer100ml(price, volumeMl);
  return (
    <p data-price className="flex flex-wrap items-baseline gap-x-2">
      <span className={cn('font-bold text-gold-300', size === 'lg' ? 'text-3xl' : 'text-lg')}>{formatPrice(price, locale)}</span>
      {onSale && (
        <span className={cn('text-cream/50 line-through', size === 'lg' ? 'text-lg' : 'text-sm')}>
          <span className="sr-only">{t('wasPrice')}: </span>
          {formatPrice(basePrice, locale)}
        </span>
      )}
      {unit !== null && (
        <span className={cn('basis-full text-cream/60', size === 'lg' ? 'text-sm' : 'text-xs')}>
          {t('per100ml', { price: formatPrice(unit, locale) })}
        </span>
      )}
    </p>
  );
}
