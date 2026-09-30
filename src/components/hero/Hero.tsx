import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { buttonStyles, cn } from '@/lib/cn';
import { STORE_PHOTOS } from '@/lib/store-photos';
import { LiquidFillText } from '../motion/LiquidFillText';
import { RisingBubbles } from '../motion/RisingBubbles';
import { ArrowIcon, StarIcon, TruckIcon, WhatsAppIcon } from '../ui/icons';

/** Opening screen: a real photo of the store as the backdrop, with a framed photo collage on large screens. */
export function Hero({ whatsappHref }: { whatsappHref: string }) {
  const t = useTranslations('hero');
  const tHome = useTranslations('home');
  const tCommon = useTranslations('common');
  const { wineAisle: hero, giftBasket } = STORE_PHOTOS;

  return (
    <section aria-labelledby="hero-title" className="relative isolate flex min-h-[calc(100svh-4.5rem)] items-center overflow-hidden">
      <Image
        src={hero.src}
        alt=""
        fill
        preload
        sizes="100vw"
        className="-z-20 object-cover object-[50%_45%] lg:scale-110 lg:blur-[6px]"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-wine-950 via-wine-950/70 to-wine-950/40" />
      <div aria-hidden className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-wine-950/95 via-wine-950/70 to-wine-950/30 lg:block rtl:bg-gradient-to-l" />
      <RisingBubbles count={12} />

      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="text-center lg:text-start">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-wine-950/60 px-4 py-1.5 text-sm font-semibold tracking-wide text-gold-200 backdrop-blur">
            <StarIcon className="h-3.5 w-3.5 text-gold-400" />
            {t('eyebrow')}
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
        </div>

        <div aria-hidden className="relative hidden h-[68svh] max-h-[640px] lg:block">
          <div className="absolute inset-y-0 end-10 w-[58%] -rotate-2 overflow-hidden rounded-[2rem] border border-gold-400/40 shadow-[0_30px_80px_rgb(0_0_0/0.6)]">
            <Image src={hero.src} alt="" fill loading="eager" sizes="30vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-wine-950/50 via-transparent to-transparent" />
          </div>
          <div className="absolute bottom-6 start-0 w-[42%] rotate-3 overflow-hidden rounded-[1.5rem] border border-gold-400/40 shadow-[0_24px_60px_rgb(0_0_0/0.65)]">
            <Image
              src={giftBasket.src}
              alt=""
              width={giftBasket.width}
              height={giftBasket.height}
              sizes="20vw"
              className="aspect-[3/4] w-full object-cover"
            />
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
