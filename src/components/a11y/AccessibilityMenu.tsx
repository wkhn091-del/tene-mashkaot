'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { AccessibilityIcon, CloseIcon, MinusIcon, PlusIcon } from '../ui/icons';
import { useA11y, type A11yPrefs } from './A11yProvider';

type ToggleKey = keyof Omit<A11yPrefs, 'scale'>;

export function AccessibilityMenu() {
  const t = useTranslations('a11y');
  const tCommon = useTranslations('common');
  const { prefs, update, reset } = useA11y();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>('button, a')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node) && !triggerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const toggles: { key: ToggleKey; label: string }[] = [
    { key: 'contrast', label: t('contrast') },
    { key: 'reduceMotion', label: t('reduceMotion') },
    { key: 'underlineLinks', label: t('underlineLinks') },
    { key: 'readableFont', label: t('readableFont') },
  ];

  return (
    <div className="fixed bottom-4 start-4 z-[60]">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t('open')}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1d4ed8] text-white shadow-lg ring-2 ring-white/70 transition hover:scale-105"
      >
        <AccessibilityIcon width={26} height={26} />
      </button>

      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label={t('title')}
          className="absolute bottom-16 start-0 w-72 rounded-2xl border border-white/10 bg-wine-900 p-4 text-cream shadow-2xl"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">{t('title')}</h2>
            <button type="button" onClick={() => setOpen(false)} aria-label={tCommon('close')} className="rounded-full p-1 hover:bg-white/10">
              <CloseIcon width={20} height={20} />
            </button>
          </div>

          <div className="mb-3 flex items-center justify-between rounded-xl bg-white/5 p-2">
            <span className="text-sm">{t('textSize')}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => update({ scale: Math.round((prefs.scale - 0.1) * 100) / 100 })}
                disabled={prefs.scale <= 0.85}
                aria-label={t('decrease')}
                className="rounded-lg bg-white/10 p-1.5 hover:bg-white/20 disabled:opacity-40"
              >
                <MinusIcon width={18} height={18} />
              </button>
              <span className="w-12 text-center text-sm tabular-nums" aria-live="polite">
                {Math.round(prefs.scale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => update({ scale: Math.round((prefs.scale + 0.1) * 100) / 100 })}
                disabled={prefs.scale >= 1.5}
                aria-label={t('increase')}
                className="rounded-lg bg-white/10 p-1.5 hover:bg-white/20 disabled:opacity-40"
              >
                <PlusIcon width={18} height={18} />
              </button>
            </div>
          </div>

          <ul className="space-y-2">
            {toggles.map(({ key, label }) => (
              <li key={key}>
                <button
                  type="button"
                  role="switch"
                  aria-checked={prefs[key]}
                  onClick={() => update({ [key]: !prefs[key] } as Partial<A11yPrefs>)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition',
                    prefs[key] ? 'bg-gold-400 text-wine-950' : 'bg-white/5 hover:bg-white/10',
                  )}
                >
                  {label}
                  <span aria-hidden className={cn('h-5 w-9 rounded-full p-0.5 transition', prefs[key] ? 'bg-wine-800' : 'bg-white/20')}>
                    <span className={cn('block h-4 w-4 rounded-full bg-white transition', prefs[key] && 'translate-x-4 rtl:-translate-x-4')} />
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between text-sm">
            <button type="button" onClick={reset} className="underline underline-offset-4 hover:text-gold-300">
              {t('reset')}
            </button>
            <Link href="/legal/accessibility" className="underline underline-offset-4 hover:text-gold-300" onClick={() => setOpen(false)}>
              {t('statement')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
