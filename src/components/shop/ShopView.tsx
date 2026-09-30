import { getTranslations } from 'next-intl/server';
import { getCategories, getProducts, getPromotions, getSiteSettings } from '@/lib/data';
import type { Category } from '@/lib/types';
import { whatsappLink } from '@/lib/whatsapp';
import { SectionHeading } from '../ui/SectionHeading';
import { CategoryNav } from './CategoryNav';
import { EmptyState } from './EmptyState';
import { ProductGrid } from './ProductGrid';

export async function ShopView({ locale, category, title, subtitle }: { locale: string; category?: Category; title: string; subtitle?: string }) {
  const [t, tCommon, categories, products, promotions, settings] = await Promise.all([
    getTranslations({ locale, namespace: 'shop' }),
    getTranslations({ locale, namespace: 'common' }),
    getCategories(),
    getProducts(category?.slug),
    getPromotions(),
    getSiteSettings(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      <SectionHeading as="h1" title={title} subtitle={subtitle} />
      <CategoryNav categories={categories} active={category?.slug} locale={locale} />
      <p className="mb-6 mt-4 text-sm text-cream/60" aria-live="polite">
        {t('count', { count: products.length })}
      </p>
      {products.length > 0 ? (
        <ProductGrid products={products} promotions={promotions} locale={locale} />
      ) : (
        <EmptyState message={t('empty')} ctaLabel={t('emptyCta')} whatsappHref={whatsappLink(settings.whatsapp)} newTabLabel={tCommon('newTab')} />
      )}
    </div>
  );
}
