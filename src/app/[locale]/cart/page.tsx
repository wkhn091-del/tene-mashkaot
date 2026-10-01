import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CartView, type CartSuggestion } from '@/components/cart/CartView';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getProducts, getPromotions } from '@/lib/data';
import { localize } from '@/lib/i18n-utils';
import { getProductPrice } from '@/lib/pricing';
import { requiresOptions } from '@/lib/product-utils';

const SUGGESTION_POOL = 24;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'cart' });
  return { title: t('title'), robots: { index: false, follow: true } };
}

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, products, promotions] = await Promise.all([
    getTranslations({ locale, namespace: 'cart' }),
    getProducts().catch(() => []),
    getPromotions().catch(() => []),
  ]);

  const suggestions: CartSuggestion[] = products
    .filter((product) => product.inStock && product.images?.[0]?.asset)
    .slice(0, SUGGESTION_POOL)
    .map((product) => ({
      _id: product._id,
      title: localize(product.title, locale),
      slug: product.slug,
      price: getProductPrice(product, promotions).price,
      image: product.images?.[0],
      kind: product.kind,
      featured: Boolean(product.featured),
      requiresOptions: requiresOptions(product),
    }));

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <SectionHeading as="h1" title={t('title')} />
      <CartView suggestions={suggestions} />
    </div>
  );
}
