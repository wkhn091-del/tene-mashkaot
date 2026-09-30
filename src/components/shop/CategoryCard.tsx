import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { localize } from '@/lib/i18n-utils';
import { CATEGORY_PHOTOS } from '@/lib/store-photos';
import type { Category } from '@/lib/types';
import { ArrowIcon } from '../ui/icons';
import { ProductPlaceholder } from './ProductPlaceholder';
import { SanityImage } from './SanityImage';

export function CategoryCard({ category, locale }: { category: Category; locale: string }) {
  const title = localize(category.title, locale);
  const photo = CATEGORY_PHOTOS[category.kind];

  return (
    <Link
      href={`/shop/${category.slug}`}
      className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-[var(--radius-card)] border border-gold-400/20 bg-wine-900"
    >
      <div className="absolute inset-0 transition duration-700 group-hover:scale-105">
        {category.image?.asset ? (
          <SanityImage image={category.image} alt="" sizes="(min-width: 1024px) 16vw, (min-width: 640px) 30vw, 45vw" className="object-cover" />
        ) : photo ? (
          <Image src={photo.src} alt="" fill sizes="(min-width: 1024px) 16vw, (min-width: 640px) 30vw, 45vw" className="object-cover" />
        ) : (
          <ProductPlaceholder kind={category.kind} />
        )}
      </div>
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-wine-950 via-wine-950/40 to-transparent" />
      <div className="relative flex items-center justify-between gap-2 p-4">
        <span>
          <span className="font-display block text-xl text-cream sm:text-2xl">{title}</span>
          {category.description && <span className="mt-1 block text-xs text-cream/70">{localize(category.description, locale)}</span>}
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-400/90 text-wine-950 transition group-hover:bg-gold-300">
          <ArrowIcon width={18} height={18} />
        </span>
      </div>
    </Link>
  );
}
