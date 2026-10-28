'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { buttonStyles, cn } from '@/lib/cn';
import { STORE_PHOTOS } from '@/lib/store-photos';
import { LiquidFillText } from '../motion/LiquidFillText';
import { RisingBubbles } from '../motion/RisingBubbles';
import { ArrowIcon, TruckIcon, WhatsAppIcon } from '../ui/icons';

/** Opening screen: a real photo of the store as the backdrop, with a framed photo collage on large screens. */
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
  const { wineCounter: backdrop, wineAisle, daatZkenim: featureShot } = STORE_PHOTOS;

  return (
    <section aria-labelledby="hero-title" className="relative isolate flex min-h-[calc(100svh-4.5rem)] items-center overflow-x-clip overflow-y-visible">
      <Image
        src={backdrop.src}
        alt=""
        fill
        preload
        sizes="100vw"
        className="-z-20 scale-105 object-cover object-[42%_35%]"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-wine-950/90 via-wine-950/45 to-wine-950/20" />
      <div aria-hidden className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-wine-950/90 via-wine-950/45 to-transparent lg:block rtl:bg-gradient-to-l" />
      <RisingBubbles count={12} />

      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pb-24">
        <div className="text-center lg:text-start">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-wine-950/60 px-4 py-1.5 text-sm font-semibold tracking-wide text-gold-200 backdrop-blur">
            <span aria-hidden className={cn('h-2.5 w-2.5 rounded-full', isOpen ? 'animate-pulse bg-[#4ade80]' : 'bg-cream/40')} />
            {openChip}
          </p>
          <h1 id="hero-title" className="font-display text-[clamp(3rem,9vw,6.5rem)] leading-[1.02] drop-shadow-[0_4px_24px_rgb(0_0_0/0.6)]">
            <LiquidFillText>{t('title')}</LiquidFillText>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-cream/90 drop-shadow lg:mx-0 lg:text-xl">{t('subtitle')}</p>
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

        <div aria-hidden className="relative hidden h-[68svh] max-h-[640px] lg:block">
          <div className="absolute inset-y-2 end-10 w-[58%] -rotate-2 overflow-hidden rounded-[2rem] border border-gold-400/40 shadow-[0_30px_80px_rgb(0_0_0/0.65)] ring-1 ring-cream/10">
            <Image src={wineAisle.src} alt="" fill loading="eager" sizes="30vw" className="object-cover object-[50%_40%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-wine-950/35 via-transparent to-transparent" />
          </div>
          <div className="absolute bottom-2 start-0 aspect-[3/4] w-[44%] rotate-2 overflow-hidden rounded-[1.5rem] border border-gold-400/40 bg-wine-950 shadow-[0_24px_60px_rgb(0_0_0/0.7)] ring-1 ring-cream/10">
            <Image src={featureShot.src} alt="" fill sizes="22vw" className="object-cover object-[50%_30%]" />
          </div>
          <div className="absolute end-0 top-8 flex items-center gap-2 rounded-full border border-gold-400/40 bg-wine-950/80 px-4 py-2 text-sm font-bold text-gold-200 shadow-lg backdrop-blur">
            <TruckIcon width={18} height={18} className="text-gold-400" />
            {tHome('trustDelivery')}
          </div>
        </div>
      </div>
    </section>
  );
}
