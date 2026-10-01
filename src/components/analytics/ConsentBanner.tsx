'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Link } from '@/i18n/navigation';
import { GA_ID, PIXEL_ID, TRACKING_CONFIGURED } from '@/lib/analytics';
import { buttonStyles, cn } from '@/lib/cn';
import { OPEN_CONSENT_EVENT, readConsent, readConsentCookie, subscribeConsent, writeConsent } from '@/lib/consent';

export function ConsentBanner() {
  const t = useTranslations('consent');
  // null on the server and during hydration, so the banner only appears once the cookie can be read.
  const consentCookie = useSyncExternalStore(subscribeConsent, readConsentCookie, () => null);
  const [reopened, setReopened] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const open = TRACKING_CONFIGURED && (reopened || (consentCookie !== null && !readConsent()));

  useEffect(() => {
    if (!TRACKING_CONFIGURED) return;
    const onOpen = () => {
      const current = readConsent();
      if (current) {
        setAnalytics(current.analytics);
        setMarketing(current.marketing);
      }
      setCustomize(true);
      setReopened(true);
      window.requestAnimationFrame(() => headingRef.current?.focus());
    };
    window.addEventListener(OPEN_CONSENT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, onOpen);
  }, []);

  if (!open) return null;

  const save = (choice: { analytics: boolean; marketing: boolean }) => {
    writeConsent(choice);
    setReopened(false);
  };

  const toggle = (label: string, hint: string, checked: boolean, onChange?: (value: boolean) => void) => (
    <label className={cn('flex items-start gap-3 rounded-xl border border-gold-400/15 px-3 py-2', !onChange && 'opacity-80')}>
      <input
        type="checkbox"
        checked={checked}
        disabled={!onChange}
        onChange={(event) => onChange?.(event.target.checked)}
        className="mt-1 h-4 w-4 accent-[#d4a95a]"
      />
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs text-cream/65">{hint}</span>
      </span>
    </label>
  );

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-title"
      className="fixed inset-x-3 bottom-3 z-[90] mx-auto max-w-3xl rounded-2xl border border-gold-400/30 bg-wine-950/95 p-5 text-cream shadow-[0_20px_60px_-20px_rgb(0_0_0/0.8)] backdrop-blur sm:inset-x-6 sm:bottom-6"
    >
      <h2 id="consent-title" ref={headingRef} tabIndex={-1} className="font-display text-xl text-gold-200 outline-none">
        {t('title')}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-cream/85">
        {t('body')}{' '}
        <Link href="/legal/cookies" className="font-semibold text-gold-200 underline underline-offset-4">
          {t('policy')}
        </Link>
      </p>

      {customize && (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {toggle(t('necessary'), t('necessaryHint'), true)}
          {GA_ID && toggle(t('analytics'), t('analyticsHint'), analytics, setAnalytics)}
          {PIXEL_ID && toggle(t('marketing'), t('marketingHint'), marketing, setMarketing)}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" className={cn(buttonStyles.primary, 'px-5 py-2.5 text-sm')} onClick={() => save({ analytics: true, marketing: true })}>
          {t('acceptAll')}
        </button>
        <button type="button" className={cn(buttonStyles.secondary, 'px-5 py-2.5 text-sm')} onClick={() => save({ analytics: false, marketing: false })}>
          {t('necessaryOnly')}
        </button>
        {customize ? (
          <button type="button" className={cn(buttonStyles.ghost, 'text-sm underline underline-offset-4')} onClick={() => save({ analytics, marketing })}>
            {t('saveChoice')}
          </button>
        ) : (
          <button type="button" className={cn(buttonStyles.ghost, 'text-sm underline underline-offset-4')} onClick={() => setCustomize(true)}>
            {t('customize')}
          </button>
        )}
      </div>
    </section>
  );
}
