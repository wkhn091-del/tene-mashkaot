'use client';

import { useTranslations } from 'next-intl';
import { TRACKING_CONFIGURED } from '@/lib/analytics';
import { openConsentSettings } from '@/lib/consent';

export function CookieSettingsButton({ className }: { className?: string }) {
  const t = useTranslations('consent');
  if (!TRACKING_CONFIGURED) return null;
  return (
    <button type="button" onClick={openConsentSettings} className={className}>
      {t('settings')}
    </button>
  );
}
