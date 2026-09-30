import { getTranslations } from 'next-intl/server';
import { ProductPlaceholder } from '@/components/shop/ProductPlaceholder';
import { Link } from '@/i18n/navigation';
import { buttonStyles, cn } from '@/lib/cn';

export default async function LocaleNotFound() {
  const t = await getTranslations('errors');
  const tCommon = await getTranslations('common');

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
      <div className="h-40 w-32 overflow-hidden rounded-2xl opacity-80">
        <ProductPlaceholder kind="wine" />
      </div>
      <p className="font-display text-gold-gradient mt-8 text-7xl">404</p>
      <h1 className="font-display mt-4 text-3xl">{t('notFoundTitle')}</h1>
      <p className="mt-3 text-cream/70">{t('notFoundBody')}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonStyles.primary}>
          {t('home')}
        </Link>
        <Link href="/shop" className={cn(buttonStyles.secondary)}>
          {tCommon('backToShop')}
        </Link>
      </div>
    </div>
  );
}
