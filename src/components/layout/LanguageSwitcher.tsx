'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';

export function LanguageSwitcher({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const target = locale === 'he' ? 'en' : 'he';

  return (
    <Link
      href={pathname || '/'}
      locale={target}
      hrefLang={target}
      lang={target}
      aria-label={t('languageLabel')}
      onClick={onNavigate}
      className={className ?? 'rounded-full border border-gold-400/40 px-3 py-1.5 text-sm font-semibold text-gold-200 transition hover:bg-gold-400/10'}
    >
      {t('language')}
    </Link>
  );
}
