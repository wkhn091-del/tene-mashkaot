'use client';

import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import { Link } from '@/i18n/navigation';
import { buttonStyles, cn } from '@/lib/cn';
import { ArrowIcon } from '../ui/icons';
import { HeroVisual } from './HeroVisual';

/**
 * Scroll-pinned cinematic stage: the camera walks into the wine room, up to the bar,
 * and the bottle pours as the section is scrolled through.
 */
export function PourShowcase() {
  const t = useTranslations('home');
  const tHero = useTranslations('hero');
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section ref={sectionRef} aria-labelledby="pour-title" className="relative mt-24 h-[300svh]">
      <div className="sticky top-[4.5rem] h-[calc(100svh-4.5rem)] px-3 py-3 sm:px-6 sm:py-5">
        <div className="relative mx-auto h-full max-w-[96rem] overflow-hidden rounded-[2rem] border border-gold-400/30 bg-[#0d0507] bg-[url('/images/store/bar-backdrop.webp')] bg-cover bg-center shadow-[0_40px_100px_-20px_rgb(0_0_0/0.8)]">
          <HeroVisual sectionRef={sectionRef} />

          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-wine-950/85 via-wine-950/40 to-transparent stage-side:inset-y-0 stage-side:h-auto stage-side:w-1/2 stage-side:bg-gradient-to-r stage-side:from-wine-950/90 stage-side:via-wine-950/45 rtl:stage-side:bg-gradient-to-l" />

          <div className="absolute inset-x-0 top-0 p-5 text-center sm:p-8 stage-side:inset-y-0 stage-side:end-auto stage-side:flex stage-side:max-w-md stage-side:flex-col stage-side:justify-center stage-side:p-10 stage-side:text-start lg:p-12">
            <p className="text-sm font-semibold tracking-[0.2em] text-gold-300">{t('pourEyebrow')}</p>
            <h2 id="pour-title" className="font-display text-gold-gradient mt-2 text-3xl drop-shadow-[0_2px_12px_rgb(0_0_0/0.7)] sm:text-5xl">
              {t('pourTitle')}
            </h2>
            <p className="mx-auto mt-4 hidden max-w-md text-lg leading-relaxed text-cream/85 sm:block stage-side:mx-0">{t('pourBody')}</p>
            <div>
              <Link href="/shop/wine" className={cn(buttonStyles.primary, 'mt-4 stage-side:mt-7')}>
                {t('pourCta')}
                <ArrowIcon width={18} height={18} />
              </Link>
            </div>
          </div>

          <p aria-hidden className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-sm text-cream/60">
            {tHero('scrollHint')} ↓
          </p>
          <div aria-hidden className="gold-hairline pointer-events-none absolute inset-x-10 bottom-0" />
        </div>
      </div>
    </section>
  );
}
