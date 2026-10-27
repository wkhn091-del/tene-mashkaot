'use client';

import { useTranslations } from 'next-intl';
import { useSyncExternalStore } from 'react';
import { Link } from '@/i18n/navigation';
import { readRecentViews, subscribeMemory, type RecentView } from '@/lib/customer-memory';

const EMPTY: RecentView[] = [];

function useRecentViews(): RecentView[] {
  return useSyncExternalStore(subscribeMemory, readRecentViews, () => EMPTY);
}

/** Horizontal rail of products the shopper opened on this device. */
export function RecentlyViewed({ excludeId }: { excludeId?: string }) {
  const t = useTranslations('shop');
  const views = useRecentViews().filter((view) => view.id !== excludeId);

  if (views.length === 0) return null;

  return (
    <section className="mt-12 border-t border-gold-400/15 pt-8" aria-labelledby="recently-viewed-title">
      <h2 id="recently-viewed-title" className="font-display text-2xl text-gold-200">
        {t('recentlyViewed')}
      </h2>
      <ul className="mt-4 flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {views.map((view) => (
          <li key={view.id} className="w-36 shrink-0 sm:w-40">
            <Link
              href={`/product/${view.slug}`}
              className="block overflow-hidden rounded-[var(--radius-card)] border border-gold-400/15 bg-wine-900/60 transition hover:border-gold-400/40"
            >
              <div className="aspect-[4/5] bg-wine-950">
                {view.imageUrl ? (
                  // Stored CDN URL from a prior visit; next/image domains already allow Sanity.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={view.imageUrl} alt="" width={160} height={200} className="h-full w-full object-contain p-2" loading="lazy" decoding="async" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-cream/40">—</div>
                )}
              </div>
              <p className="line-clamp-2 px-2.5 py-2 text-sm font-medium text-cream">{view.title}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
