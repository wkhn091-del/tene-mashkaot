import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { ShopView } from '@/components/shop/ShopView';
import { getCategories } from '@/lib/data';
import { localize } from '@/lib/i18n-utils';
import { alternatesFor } from '@/lib/seo';

type Params = Promise<{ locale: string; category: string }>;

async function findCategory(slug: string) {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, category: slug } = await params;
  const category = await findCategory(slug);
  if (!category) return {};
  return {
    title: localize(category.title, locale),
    description: localize(category.description, locale) || undefined,
    alternates: alternatesFor(locale, `/shop/${category.slug}`),
  };
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { locale, category: slug } = await params;
  setRequestLocale(locale);
  const category = await findCategory(slug);
  if (!category) notFound();
  return <ShopView locale={locale} category={category} title={localize(category.title, locale)} subtitle={localize(category.description, locale) || undefined} />;
}
