import { getProductBySlug, getSiteSettings } from '@/lib/data';
import { localize } from '@/lib/i18n-utils';
import { OG_SIZE, renderOgCard } from '@/lib/og/card';
import { jpegImageUrl } from '@/sanity/lib/image';

export const size = OG_SIZE;
export const contentType = 'image/jpeg';
export const alt = 'תנא משקאות';
export const revalidate = 86400;

export default async function ProductOgImage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(decodeURIComponent(slug)), getSiteSettings()]);
  const brand = localize(settings.name, locale);
  return renderOgCard({
    locale,
    brand,
    title: product ? localize(product.title, locale) : brand,
    subtitle: product?.category ? localize(product.category.title, locale) : undefined,
    badge: locale === 'en' ? 'Elad · Wines, spirits & gifts' : 'חוויה של לגימה · אלעד',
    photoUrl: jpegImageUrl(product?.images?.[0], 800, 920),
  });
}
