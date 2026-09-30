'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import type { CategoryKind, SanityImage as SanityImageType } from '@/lib/types';
import { ProductPlaceholder } from '../shop/ProductPlaceholder';
import { SanityImage } from '../shop/SanityImage';

export function ProductGallery({
  images,
  alts,
  kind,
  title,
  thumbLabel,
  placeholderLabel,
}: {
  images: SanityImageType[];
  alts: string[];
  kind: CategoryKind;
  title: string;
  thumbLabel: string;
  placeholderLabel: string;
}) {
  const [active, setActive] = useState(0);
  const valid = images.filter((img) => img.asset);
  const current = valid[active];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-[var(--radius-card)] border border-gold-400/20 bg-gradient-to-b from-wine-800 to-wine-900">
        {current ? (
          <SanityImage image={current} alt={alts[active] || title} sizes="(min-width: 1024px) 45vw, 100vw" className="object-contain p-6" priority />
        ) : (
          <ProductPlaceholder kind={kind} label={placeholderLabel} />
        )}
      </div>
      {valid.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto">
          {valid.map((img, index) => (
            <li key={img.asset?._ref ?? index}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`${thumbLabel} ${index + 1}`}
                aria-pressed={index === active}
                className={cn(
                  'relative block h-20 w-20 overflow-hidden rounded-xl border bg-wine-900 transition',
                  index === active ? 'border-gold-400' : 'border-gold-400/20 hover:border-gold-400/50',
                )}
              >
                <SanityImage image={img} alt="" sizes="80px" className="object-contain p-1" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
