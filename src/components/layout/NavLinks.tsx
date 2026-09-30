'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { isActivePath, NAV_ITEMS } from './nav-items';

export function NavLinks() {
  const t = useTranslations('nav');
  const pathname = usePathname();

  return (
    <nav aria-label={t('mainNav')} className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative rounded-full px-4 py-2 text-[0.95rem] font-medium transition',
                  active ? 'text-gold-300' : 'text-cream/80 hover:bg-white/5 hover:text-cream',
                )}
              >
                {t(item.key)}
                {active && <span aria-hidden className="gold-hairline absolute inset-x-4 -bottom-0.5" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
