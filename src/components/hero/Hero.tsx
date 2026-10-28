'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { buttonStyles, cn } from '@/lib/cn';
import { STORE_PHOTOS } from '@/lib/store-photos';
import { LiquidFillText } from '../motion/LiquidFillText';
import { RisingBubbles } from '../motion/RisingBubbles';
import { ArrowIcon, TruckIcon, WhatsAppIcon } from '../ui/icons';

/** Full-bleed store photo under the header; soft side veil only — no hard top/bottom cut bands. */
export function Hero({
  whatsappHref,
  openChip,
  isOpen,
}: {
  whatsappHref: string;
  openChip: string;
  isOpen: boolean;
}) {
  const t = useTranslations('hero');
  const tHome = useTranslations('home');
  const tCommon = useTranslations('common');
  // Continuous bottle wall (no counter “seam”). Framed shots stay distinct from the backdrop.
  const { spirits: backdrop, wineAisle, daatZkenim: featureShot } = STORE_PHOTOS;

  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate -mt-[4.5rem] flex min-h-svh items-center overflow-x-clip pt-[4.5rem]"
    >
      <Image
        src={backdrop.src}
        alt=""
        fill
        preload
        sizes="100vw"
        className="-z-20 object-cover object-[50%_42%]"
      />
      {/* Soft veil on the copy side only — no hard black bands cutting the photo top/bottom */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-r from-wine-950/80 via-wine-950/40 to-wine-950/20 rtl:bg-gradient-to-l"
      />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-28 bg-gradient-to-t from-wine-950/55 to-transparent" />
      <RisingBubbles count={10} />

      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:py-16">
        <div className="text-center lg:text-start">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-wine-950/55 px-4 py-1.5 text-sm font-semibold tracking-wide text-gold-200 backdrop-blur-md">
            <span aria-hidden className={cn('h-2.5 w-2.5 rounded-full', isOpen ? 'animate-pulse bg-[#4ade80]' : 'bg-cream/40')} />
            {openChip}
          </p>
          <h1 id="hero-title" className="font-display text-[clamp(3rem,9vw,6.5rem)] leading-[1.02] drop-shadow-[0_4px_24px_rgb(0_0_0/0.55)]">
            <LiquidFillText>{t('title')}</LiquidFillText>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-cream/92 drop-shadow lg:mx-0 lg:text-xl">{t('subtitle')}</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link href="/shop" className={cn(buttonStyles.primary, 'px-8 text-lg')}>
              {t('ctaShop')}
              <ArrowIcon width={20} height={20} />
            </Link>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={cn(buttonStyles.whatsapp, 'px-8 text-lg')}>
              <WhatsAppIcon width={22} height={22} />
              {t('ctaWhatsapp')}
              <span className="sr-only">{tCommon('newTab')}</span>
            </a>
          </div>
          <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-gold-200/90">
            <TruckIcon width={16} height={16} className="text-gold-400" />
            {tHome('trustDelivery')}
          </p>
        </div>

        <div aria-hidden className="relative hidden h-[min(68svh,640px)] lg:block">
          <div className="absolute inset-y-4 end-8 w-[56%] -rotate-2 overflow-hidden rounded-[2rem] border border-gold-400/35 shadow-[0_30px_80px_rgb(0_0_0/0.55)]">
            <Image src={wineAisle.src} alt="" fill loading="eager" sizes="30vw" className="object-cover object-[48%_38%]" />
          </div>
          <div className="absolute bottom-4 start-0 aspect-[3/4] w-[42%] rotate-2 overflow-hidden rounded-[1.5rem] border border-gold-400/35 bg-wine-950 shadow-[0_24px_60px_rgb(0_0_0/0.6)]">
            <Image src={featureShot.src} alt="" fill sizes="22vw" className="object-cover object-[50%_28%]" />
          </div>
          <div className="absolute end-0 top-6 flex items-center gap-2 rounded-full border border-gold-400/40 bg-wine-950/75 px-4 py-2 text-sm font-bold text-gold-200 shadow-lg backdrop-blur-md">
            <TruckIcon width={18} height={18} className="text-gold-400" />
            {tHome('trustDelivery')}
          </div>
        </div>
      </div>
    </section>
  );
}
