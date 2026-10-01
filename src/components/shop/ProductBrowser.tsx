'use client';

import { useTranslations } from 'next-intl';
import { useDeferredValue, useMemo, useState, type ReactNode } from 'react';
import { matchesSearch } from '@/lib/search';

export interface BrowserEntry {
  id: string;
  /** Pre-normalized searchable text (titles, category, winery, grape...). */
  text: string;
  price: number;
  card: ReactNode;
}

type Sort = 'recommended' | 'priceAsc' | 'priceDesc';

const fieldClass =
  'h-11 rounded-full border border-gold-400/25 bg-wine-900/70 px-4 text-sm text-cream placeholder:text-cream/45 focus:border-gold-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-300/40';

export function ProductBrowser({ entries }: { entries: BrowserEntry[] }) {
  const t = useTranslations('shop');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('recommended');
  const deferredQuery = useDeferredValue(query);

  const visible = useMemo(() => {
    const found = entries.filter((entry) => matchesSearch(entry.text, deferredQuery));
    if (sort === 'priceAsc') return [...found].sort((a, b) => a.price - b.price);
    if (sort === 'priceDesc') return [...found].sort((a, b) => b.price - a.price);
    return found;
  }, [entries, deferredQuery, sort]);

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-3" role="search">
        <label className="relative min-w-0 flex-1 basis-60">
          <span className="sr-only">{t('searchLabel')}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('searchPlaceholder')}
            enterKeyHint="search"
            className={`${fieldClass} w-full`}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-cream/70">
          {t('sortLabel')}
          <select value={sort} onChange={(event) => setSort(event.target.value as Sort)} className={fieldClass}>
            <option value="recommended">{t('sortRecommended')}</option>
            <option value="priceAsc">{t('sortPriceAsc')}</option>
            <option value="priceDesc">{t('sortPriceDesc')}</option>
          </select>
        </label>
      </div>

      <p className="mb-6 mt-4 text-sm text-cream/60" aria-live="polite">
        {t('count', { count: visible.length })}
      </p>

      {visible.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
          {visible.map((entry) => (
            <li key={entry.id} className="flex">
              <div className="w-full">{entry.card}</div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-[var(--radius-card)] border border-gold-400/20 bg-wine-900/50 p-8 text-center">
          <p className="text-lg">{t('noResults', { query: deferredQuery.trim() })}</p>
          <button
            type="button"
            onClick={() => setQuery('')}
            className="mt-4 rounded-full border border-gold-400/50 px-5 py-2 text-sm font-semibold text-gold-200 transition hover:bg-gold-400/10"
          >
            {t('clearSearch')}
          </button>
        </div>
      )}
    </>
  );
}
