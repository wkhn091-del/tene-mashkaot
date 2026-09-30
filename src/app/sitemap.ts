import type { MetadataRoute } from 'next';
import { LEGAL_SLUG_LIST } from '@/content/legal';
import { routing } from '@/i18n/routing';
import { getCategories, getProductSlugs } from '@/lib/data';
import { absoluteUrl } from '@/lib/seo';

export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];

function entry(path: string, priority: number, changeFrequency: Entry['changeFrequency'], lastModified?: string): Entry[] {
  const languages = Object.fromEntries(routing.locales.map((l) => [l, absoluteUrl(`/${l}${path}`)]));
  return routing.locales.map((locale) => ({
    url: absoluteUrl(`/${locale}${path}`),
    lastModified: lastModified ? new Date(lastModified) : new Date(),
    changeFrequency,
    priority: locale === routing.defaultLocale ? priority : Math.max(priority - 0.1, 0.1),
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([getCategories().catch(() => []), getProductSlugs().catch(() => [])]);

  return [
    ...entry('', 1, 'daily'),
    ...entry('/shop', 0.9, 'daily'),
    ...entry('/events', 0.7, 'monthly'),
    ...entry('/visit', 0.8, 'monthly'),
    ...categories.flatMap((c) => entry(`/shop/${c.slug}`, 0.8, 'weekly')),
    ...products.flatMap((p) => entry(`/product/${p.slug}`, 0.7, 'weekly', p._updatedAt)),
    ...LEGAL_SLUG_LIST.flatMap((slug) => entry(`/legal/${slug}`, 0.2, 'yearly')),
  ];
}
