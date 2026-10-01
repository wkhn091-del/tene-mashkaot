import { getTranslations } from 'next-intl/server';
import { getCategories, getProducts, getPromotions, getSiteSettings } from '@/lib/data';
import { getProductPrice } from '@/lib/pricing';
import { normalizeSearch } from '@/lib/search';
import type { Category, LocaleString, Product } from '@/lib/types';
import { whatsappLink } from '@/lib/whatsapp';
import { SectionHeading } from '../ui/SectionHeading';
import { CategoryNav } from './CategoryNav';
import { EmptyState } from './EmptyState';
import { ProductBrowser } from './ProductBrowser';
import { ProductCard } from './ProductCard';

function searchText(product: Product): string {
  const both = (value?: LocaleString) => [value?.he, value?.en];
  return normalizeSearch(
    [
      ...both(product.title),
      ...both(product.shortDescription),
      ...both(product.category?.title),
      ...both(product.wine?.winery),
      ...both(product.wine?.series),
      ...both(product.wine?.grape),
      ...both(product.spirits?.spiritType),
      ...both(product.spirits?.country),
    ]
      .filter(Boolean)
      .join(' '),
  );
}

export async function ShopView({ locale, category, title, subtitle }: { locale: string; category?: Category; title: string; subtitle?: string }) {
  const [t, tCommon, categories, products, promotions, settings] = await Promise.all([
    getTranslations({ locale, namespace: 'shop' }),
    getTranslations({ locale, namespace: 'common' }),
    getCategories(),
    getProducts(category?.slug),
    getPromotions(),
    getSiteSettings(),
  ]);

  const entries = products.map((product, index) => ({
    id: product._id,
    text: searchText(product),
    price: getProductPrice(product, promotions).price,
    card: <ProductCard product={product} promotions={promotions} locale={locale} priority={index < 4} />,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      <SectionHeading as="h1" title={title} subtitle={subtitle} />
      <CategoryNav categories={categories} active={category?.slug} locale={locale} />
      {products.length > 0 ? (
        <ProductBrowser entries={entries} />
      ) : (
        <div className="mt-6">
          <EmptyState message={t('empty')} ctaLabel={t('emptyCta')} whatsappHref={whatsappLink(settings.whatsapp)} newTabLabel={tCommon('newTab')} />
        </div>
      )}
    </div>
  );
}
