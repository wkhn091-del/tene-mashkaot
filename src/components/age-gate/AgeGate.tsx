'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { StarIcon } from '../ui/icons';
import { AGE_COOKIE } from '@/lib/client-constants';
import { buttonStyles } from '@/lib/cn';

export function AgeGate({ initiallyVerified }: { initiallyVerified: boolean }) {
  const t = useTranslations('ageGate');
  const [state, setState] = useState<'verified' | 'asking' | 'denied'>(initiallyVerified ? 'verified' : 'asking');
  const confirmRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state === 'verified') {
      document.documentElement.style.removeProperty('overflow');
      return;
    }
    document.documentElement.style.overflow = 'hidden';
    confirmRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>('button, a[href]');
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.style.removeProperty('overflow');
    };
  }, [state]);

  if (state === 'verified') return null;

  const confirm = () => {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    // Session cookie: the age question returns on every new visit.
    document.cookie = `${AGE_COOKIE}=1; Path=/; SameSite=Lax${secure}`;
    setState('verified');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-wine-950/95 p-4 backdrop-blur-md">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="age-gate-title"
        aria-describedby="age-gate-body"
        className="bg-waves w-full max-w-md rounded-[var(--radius-card)] border border-gold-400/30 bg-wine-800 p-8 text-center shadow-2xl"
      >
        <StarIcon className="mx-auto mb-4 h-10 w-10 text-gold-400" />
        <h2 id="age-gate-title" className="font-display text-gold-gradient text-3xl">
          {t('title')}
        </h2>
        {state === 'asking' ? (
          <>
            <p id="age-gate-body" className="mt-4 text-cream/80">
              {t('body')}
            </p>
            <p className="mt-6 text-xl font-bold">{t('question')}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button ref={confirmRef} type="button" onClick={confirm} className={buttonStyles.primary}>
                {t('confirm')}
              </button>
              <button type="button" onClick={() => setState('denied')} className={buttonStyles.secondary}>
                {t('deny')}
              </button>
            </div>
          </>
        ) : (
          <p id="age-gate-body" role="status" className="mt-6 text-lg text-cream/90">
            {t('denied')}
          </p>
        )}
      </div>
    </div>
  );
}
