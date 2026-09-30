'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { GA_ID, PIXEL_ID } from '@/lib/analytics';
import { clearCookies, CONSENT_EVENT, readConsent, type ConsentState } from '@/lib/consent';

/*
 * Loaders replicate the official gtag.js / fbevents.js bootstrap snippets without inline scripts:
 * this module is loaded through the nonce-trusted bundle, so under CSP 'strict-dynamic' the script
 * tags it creates are allowed while injected third-party inline code is not.
 */

function loadGa(id: string) {
  if (window.gtag) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // gtag.js expects the `arguments` object itself.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' });
  window.gtag('js', new Date());
  window.gtag('config', id, { allow_google_signals: false, allow_ad_personalization_signals: false });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
}

function loadPixel(id: string) {
  if (window.fbq) return;
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue!.push(args);
  } as NonNullable<Window['fbq']>;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  window.fbq = fbq;
  if (!window._fbq) window._fbq = fbq;
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);
  fbq('init', id);
  fbq('track', 'PageView');
}

export function AnalyticsProvider() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const previous = useRef<ConsentState | null>(null);
  const firstPath = useRef(true);

  useEffect(() => {
    setConsent(readConsent());
    const onChange = (event: Event) => setConsent((event as CustomEvent<ConsentState>).detail);
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  useEffect(() => {
    const before = previous.current;
    previous.current = consent;
    if (!consent) return;
    // Withdrawn consent: delete what the trackers stored and reload so their scripts are gone.
    const withdrewAnalytics = before?.analytics && !consent.analytics;
    const withdrewMarketing = before?.marketing && !consent.marketing;
    if (withdrewAnalytics) clearCookies(/^_ga/);
    if (withdrewMarketing) clearCookies(/^_fb/);
    if (withdrewAnalytics || withdrewMarketing) {
      window.location.reload();
      return;
    }
    if (GA_ID && consent.analytics) loadGa(GA_ID);
    if (PIXEL_ID && consent.marketing) loadPixel(PIXEL_ID);
  }, [consent]);

  // GA4 records client-side navigations itself (enhanced measurement); the Pixel needs a PageView.
  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    if (consent?.marketing && window.fbq) window.fbq('track', 'PageView');
  }, [pathname, consent?.marketing]);

  return null;
}
