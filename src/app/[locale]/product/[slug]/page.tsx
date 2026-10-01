import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AddToCartForm } from '@/components/product/AddToCartForm';
import { ProductGallery } from '@/components/product/ProductGallery';
import { PriceTag } from '@/components/shop/PriceTag';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { ClockIcon } from '@/components/ui/icons';
import { RichText } from '@/components/ui/RichText';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Link } from '@/i18n/navigation';
import { getProductBySlug, getPromotions, getRelatedProducts, getSiteSettings } from '@/lib/data';
import { localize, localizeBlock } from '@/lib/i18n-utils';
import { getProductPrice } from '@/lib/pricing';
import { absoluteUrl, alternatesFor, jsonLd } from '@/lib/seo';
import { imageUrl } from '@/sanity/lib/image';
import { headers } from 'next/headers';
import { TrackOnMount } from '@/components/analytics/TrackOnMount';


type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const title = localize(product.title, locale);
  const image = imageUrl(product.images?.[0], 1200);
  return {
    title,
    description: localize(product.shortDescription, locale) || undefined,
    alternates: alternatesFor(locale, `/product/${product.slug}`),
    openGraph: image ? { images: [{ url: image, width: 1200, alt: title }] } : undefined,
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [t, tCommon, tShop, promotions, related, settings, nonce] = await Promise.all([
    getTranslations({ locale, namespace: 'product' }),
    getTranslations({ locale, namespace: 'common' }),
    getTranslations({ locale, namespace: 'shop' }),
    getPromotions(),
    getRelatedProducts(product),
    getSiteSettings(),
    headers().then((h) => h.get('x-nonce') ?? undefined),
  ]);

  const title = localize(product.title, locale);
  const { basePrice, price, promotion } = getProductPrice(product, promotions);
  const images = product.images ?? [];
  const isAlcohol = product.kind === 'wine' || product.kind === 'spirits';

  const specs: { label: string; value: string }[] = [];
  const add = (label: string, value: string | number | undefined | null) => {
    if (value !== undefined && value !== null && value !== '') specs.push({ label, value: String(value) });
  };
  if (product.wine) {
    add(t('winery'), localize(product.wine.winery, locale));
    add(t('series'), localize(product.wine.series, locale));
    add(t('grape'), localize(product.wine.grape, locale));
    add(t('vintage'), product.wine.vintage);
    if (product.wine.sweetness) add(t('sweetness'), t(`sweetness_${product.wine.sweetness}`));
    if (typeof product.wine.mevushal === 'boolean') add(t('mevushal'), product.wine.mevushal ? t('yes') : t('no'));
  }
  if (product.spirits) {
    add(t('spiritType'), localize(product.spirits.spiritType, locale));
    add(t('country'), localize(product.spirits.country, locale));
    if (product.spirits.ageYears) add(t('age'), t('ageValue', { years: product.spirits.ageYears }));
  }
  if (isAlcohol && product.volumeMl) add(t('volume'), t('volumeValue', { ml: product.volumeMl }));
  if (isAlcohol && product.abv) add(t('abv'), `${product.abv}%`);
  add(t('kashrut'), localize(product.kashrut, locale));

  const includes = (product.gift?.includes ?? []).map((item) => localize(item, locale)).filter(Boolean);

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title,
    description: localize(product.shortDescription, locale) || undefined,
    image: images.map((img) => imageUrl(img, 1200)).filter(Boolean),
    category: product.category ? localize(product.category.title, locale) : undefined,
    brand: product.wine?.winery ? { '@type': 'Brand', name: localize(product.wine.winery, locale) } : undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'ILS',
      price: price.toFixed(2),
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: absoluteUrl(`/${locale}/product/${product.slug}`),
      seller: { '@type': 'Organization', name: localize(settings.name, locale) },
    },
  };

  const crumbs = [
    { name: localize(settings.name, locale), path: `/${locale}` },
    { name: tShop('title'), path: `/${locale}/shop` },
    ...(product.category ? [{ name: localize(product.category.title, locale), path: `/${locale}/shop/${product.category.slug}` }] : []),
    { name: title, path: `/${locale}/product/${product.slug}` },
  ];
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <nav aria-label={t('breadcrumb')} className="mb-6 text-sm text-cream/60">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/shop" className="hover:text-gold-200">
              {tCommon('backToShop')}
            </Link>
          </li>
          {product.category && (
            <>
              <li aria-hidden>/</li>
              <li>
                <Link href={`/shop/${product.category.slug}`} className="hover:text-gold-200">
                  {localize(product.category.title, locale)}
                </Link>
              </li>
            </>
          )}
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductGallery
          images={images}
          alts={images.map((img) => localize(img.alt, locale))}
          kind={product.kind}
          title={title}
          thumbLabel={title}
          placeholderLabel={`${title} – ${t('imagePlaceholder')}`}
        />

        <div className="flex flex-col gap-6">
          <div>
            {promotion && (
              <span className="mb-3 inline-block rounded-full bg-gold-400 px-3 py-1 text-xs font-bold text-wine-950">
                {localize(promotion.badge, locale) || t('sale')}
              </span>
            )}
            <h1 className="font-display text-4xl leading-tight text-cream sm:text-5xl">{title}</h1>
            {product.shortDescription && <p className="mt-3 text-lg text-cream/75">{localize(product.shortDescription, locale)}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <PriceTag price={price} basePrice={basePrice} locale={locale} volumeMl={product.volumeMl} size="lg" />
            {product.inStock && <span className="rounded-full bg-[#1f9d55]/20 px-3 py-1 text-sm font-semibold text-[#86efac]">{t('inStock')}</span>}
          </div>

          {product.leadTimeHours ? (
            <p className="flex items-center gap-2 text-sm text-gold-200">
              <ClockIcon width={18} height={18} />
              {t('leadTime', { hours: product.leadTimeHours })}
            </p>
          ) : null}

          <AddToCartForm
            product={{
              _id: product._id,
              title,
              slug: product.slug,
              price,
              image: images[0],
              inStock: product.inStock,
              ribbonColors: product.kind === 'gift' ? product.gift?.ribbonColors ?? [] : [],
              balloonColors: product.kind === 'balloons' ? product.balloons?.colors ?? [] : [],
              allowDedication: product.kind === 'gift' && product.gift?.allowDedication !== false,
              allowBalloonText: product.kind === 'balloons' && product.balloons?.allowText !== false,
            }}
          />

          {includes.length > 0 && (
            <section>
              <h2 className="font-display mb-3 text-xl text-gold-200">{t('includes')}</h2>
              <ul className="list-inside list-disc space-y-1 text-cream/85 marker:text-gold-400">
                {includes.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {specs.length > 0 && (
            <section>
              <h2 className="font-display mb-3 text-xl text-gold-200">{t('details')}</h2>
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-[var(--radius-card)] border border-gold-400/15 bg-wine-900/40 p-5 text-sm">
                {specs.map((spec) => (
                  <div key={spec.label} className="contents">
                    <dt className="text-cream/60">{spec.label}</dt>
                    <dd className="font-medium">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <RichText value={localizeBlock(product.description, locale)} />

          {isAlcohol && (
            <p role="note" className="rounded-xl border border-gold-400/30 bg-black/30 px-4 py-3 text-center text-sm font-bold text-gold-100">
              {localize(settings.alcoholWarning, locale)}
            </p>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="pt-24">
          <SectionHeading id="related-title" title={t('related')} />
          <ProductGrid products={related} promotions={promotions} locale={locale} />
        </section>
      )}

      <TrackOnMount
        event={{
          name: 'view_item',
          item: {
            id: product._id,
            name: localize(product.title, locale),
            price,
            category: product.category ? localize(product.category.title, locale) : undefined,
          },
        }}
      />
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: jsonLd(productJsonLd) }} />
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbJsonLd) }} />
    </div>
  );
}
