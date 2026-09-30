import { getCategories, getSiteSettings } from '@/lib/data';
import { localize } from '@/lib/i18n-utils';
import { OG_SIZE, renderOgCard } from '@/lib/og/card';
import { jpegImageUrl } from '@/sanity/lib/image';

export const size = OG_SIZE;
export const contentType = 'image/jpeg';
export const alt = 'תנא משקאות';
export const revalidate = 86400;

export default async function CategoryOgImage({ params }: { params: Promise<{ locale: string; category: string }> }) {
  const { locale, category: slug } = await params;
  const [categories, settings] = await Promise.all([getCategories(), getSiteSettings()]);
  const category = categories.find((c) => c.slug === decodeURIComponent(slug));
  const brand = localize(settings.name, locale);
  return renderOgCard({
    locale,
    brand,
    title: category ? localize(category.title, locale) : brand,
    subtitle: category ? localize(category.description, locale) || undefined : undefined,
    badge: locale === 'en' ? 'Shop online · Delivery in Elad' : 'להזמנה באתר · משלוחים באלעד',
    photoUrl: jpegImageUrl(category?.image, 800, 920),
  });
}
