import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { localize } from '@/lib/i18n-utils';
import { getProductPrice } from '@/lib/pricing';
import { requiresOptions } from '@/lib/product-utils';
import type { Product, Promotion } from '@/lib/types';
import { PriceTag } from './PriceTag';
import { ProductPlaceholder } from './ProductPlaceholder';
import { QuickAddButton } from './QuickAddButton';
import { SanityImage } from './SanityImage';

export async function ProductCard({ product, promotions, locale, priority }: { product: Product; promotions: Promotion[]; locale: string; priority?: boolean }) {
  const t = await getTranslations({ locale, namespace: 'common' });
  const tProduct = await getTranslations({ locale, namespace: 'product' });
  const title = localize(product.title, locale);
  const { basePrice, price, promotion } = getProductPrice(product, promotions);
  const image = product.images?.[0];
  const badge = promotion ? localize(promotion.badge, locale) || tProduct('sale') : null;
  const href = `/product/${product.slug}`;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-gold-400/15 bg-wine-900/60 transition duration-300 hover:-translate-y-1 hover:border-gold-400/40 hover:shadow-[0_30px_60px_-30px_rgb(0_0_0/0.9)]">
      <div className="relative aspect-[4/5] overflow-hidden bg-wine-900">
        {image?.asset ? (
          <SanityImage
            image={image}
            alt={localize(image.alt, locale) || title}
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 48vw"
            className="object-contain p-4 transition duration-500 group-hover:scale-105"
            priority={priority}
          />
        ) : (
          <ProductPlaceholder kind={product.kind} />
        )}
        <div className="absolute top-3 start-3 flex flex-col gap-1.5">
          {badge && <span className="rounded-full bg-gold-400 px-3 py-1 text-xs font-bold text-wine-950">{badge}</span>}
          {!product.inStock && <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-cream">{t('outOfStock')}</span>}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-semibold leading-snug text-cream">
          <Link href={href} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {title}
          </Link>
        </h3>
        {product.shortDescription && <p className="line-clamp-2 text-sm text-cream/60">{localize(product.shortDescription, locale)}</p>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <PriceTag price={price} basePrice={basePrice} locale={locale} volumeMl={product.volumeMl} />
          <div className="relative z-10">
            {product.inStock &&
              (requiresOptions(product) ? (
                <Link href={href} className="inline-flex rounded-full border border-gold-400/50 px-4 py-2 text-sm font-semibold text-gold-200 transition hover:bg-gold-400/10">
                  {t('chooseOptions')}
                </Link>
              ) : (
                <QuickAddButton product={{ _id: product._id, title, slug: product.slug, price, image }} />
              ))}
          </div>
        </div>
      </div>
    </article>
  );
}
