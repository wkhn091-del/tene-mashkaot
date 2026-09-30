import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { localize } from '@/lib/i18n-utils';
import type { Category } from '@/lib/types';

export async function CategoryNav({ categories, active, locale }: { categories: Category[]; active?: string; locale: string }) {
  const t = await getTranslations({ locale, namespace: 'shop' });
  const items = [{ slug: undefined, label: t('all') }, ...categories.map((c) => ({ slug: c.slug, label: localize(c.title, locale) }))];

  return (
    <nav aria-label={t('categories')} className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
      <ul className="flex w-max gap-2">
        {items.map((item) => {
          const isActive = item.slug === active;
          return (
            <li key={item.slug ?? 'all'}>
              <Link
                href={item.slug ? `/shop/${item.slug}` : '/shop'}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'block whitespace-nowrap rounded-full border px-5 py-2 text-sm font-semibold transition',
                  isActive ? 'border-gold-400 bg-gold-400 text-wine-950' : 'border-gold-400/30 text-cream/85 hover:border-gold-400/60 hover:text-cream',
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
