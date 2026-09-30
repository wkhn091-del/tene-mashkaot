'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { CloseIcon, MenuIcon, PhoneIcon, WhatsAppIcon } from '../ui/icons';
import { LanguageSwitcher } from './LanguageSwitcher';
import { isActivePath, NAV_ITEMS } from './nav-items';

export function MobileMenu({ phone, phoneHref, whatsappHref }: { phone: string; phoneHref: string; whatsappHref: string }) {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const pathname = usePathname();
  const from = useLocale() === 'he' ? '100%' : '-100%';
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.style.overflow = 'hidden';
    panelRef.current?.querySelector<HTMLElement>('a, button')?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>('a[href], button');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
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
      root.style.removeProperty('overflow');
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t('openMenu')}
        className="flex h-11 w-11 items-center justify-center rounded-full text-cream transition hover:bg-white/10"
      >
        <MenuIcon />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
              onClick={close}
              aria-hidden
            />
            <motion.div
              key="panel"
              ref={panelRef}
              id={panelId}
              role="dialog"
              aria-modal="true"
              aria-label={t('menu')}
              initial={{ x: from }}
              animate={{ x: 0 }}
              exit={{ x: from }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              className="bg-waves fixed inset-y-0 start-0 z-[71] flex w-[min(22rem,88vw)] flex-col bg-wine-900 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-gold-gradient text-2xl">{t('menu')}</span>
                <button
                  type="button"
                  onClick={() => {
                    close();
                    triggerRef.current?.focus();
                  }}
                  aria-label={t('closeMenu')}
                  className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10"
                >
                  <CloseIcon />
                </button>
              </div>

              <nav aria-label={t('mainNav')} className="mt-8 flex-1">
                <ul className="space-y-1">
                  {NAV_ITEMS.map((item, index) => {
                    const active = isActivePath(pathname, item.href);
                    return (
                      <motion.li
                        key={item.key}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * index + 0.1 }}
                      >
                        <Link
                          href={item.href}
                          onClick={close}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'block rounded-xl px-4 py-3 text-lg font-semibold transition',
                            active ? 'bg-gold-400/15 text-gold-300' : 'text-cream hover:bg-white/5',
                          )}
                        >
                          {t(item.key)}
                        </Link>
                      </motion.li>
                    );
                  })}
                  <li>
                    <Link href="/cart" onClick={close} className="block rounded-xl px-4 py-3 text-lg font-semibold text-cream hover:bg-white/5">
                      {t('cart')}
                    </Link>
                  </li>
                </ul>
              </nav>

              <div className="space-y-3 border-t border-gold-400/20 pt-6">
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl bg-[#1f9d55] px-4 py-3 font-bold text-white">
                  <WhatsAppIcon width={22} height={22} />
                  {tCommon('whatsapp')}
                  <span className="sr-only">{tCommon('newTab')}</span>
                </a>
                <a href={phoneHref} className="flex items-center gap-3 rounded-xl border border-gold-400/30 px-4 py-3 font-semibold text-gold-200">
                  <PhoneIcon width={20} height={20} />
                  <span dir="ltr">{phone}</span>
                </a>
                <LanguageSwitcher
                  onNavigate={close}
                  className="block rounded-xl px-4 py-3 text-center font-semibold text-gold-200 underline-offset-4 hover:underline"
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
