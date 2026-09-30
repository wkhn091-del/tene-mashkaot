'use client';

import { useLocale } from 'next-intl';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

interface TurnstileApi {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error('Failed to load Turnstile'));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

export interface TurnstileHandle {
  reset: () => void;
}

/**
 * Cloudflare Turnstile, loaded only on forms that need it. Renders nothing when no site key is
 * configured (the server skips verification in that case). Inside a <form> it also adds the
 * hidden `cf-turnstile-response` field.
 */
export const Turnstile = forwardRef<TurnstileHandle, { onToken?: (token: string | undefined) => void }>(function Turnstile({ onToken }, ref) {
  const locale = useLocale();
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
      onTokenRef.current?.(undefined);
    },
  }));

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !container.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(container.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: 'dark',
          language: locale === 'en' ? 'en' : 'he',
          appearance: 'interaction-only',
          callback: (token: string) => onTokenRef.current?.(token),
          'expired-callback': () => onTokenRef.current?.(undefined),
          'error-callback': () => onTokenRef.current?.(undefined),
        });
      })
      .catch((error) => console.error('[turnstile]', error));
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [locale]);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={container} className="min-h-0" />;
});
