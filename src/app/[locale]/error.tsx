'use client';

import * as Sentry from '@sentry/nextjs';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { buttonStyles } from '@/lib/cn';

export default function LocaleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('errors');

  useEffect(() => {
    console.error('[page-error]', error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center" role="alert">
      <h1 className="font-display text-gold-gradient text-4xl">{t('errorTitle')}</h1>
      <p className="mt-4 text-cream/75">{t('errorBody')}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className={buttonStyles.primary}>
          {t('retry')}
        </button>
        <Link href="/" className={buttonStyles.secondary}>
          {t('home')}
        </Link>
      </div>
    </div>
  );
}
