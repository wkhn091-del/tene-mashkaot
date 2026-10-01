import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Hero } from '@/components/hero/Hero';
import { PourShowcase } from '@/components/hero/PourShowcase';
import { BottleTilt } from '@/components/motion/BottleTilt';
import { LiquidFillText } from '@/components/motion/LiquidFillText';
import { RisingBubbles } from '@/components/motion/RisingBubbles';
import { Reveal } from '@/components/motion/Reveal';
import { CategoryCard } from '@/components/shop/CategoryCard';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { GiftIcon, ShieldIcon, StarIcon, TruckIcon, ChatIcon, WhatsAppIcon, ArrowIcon } from '@/components/ui/icons';
import { PhotoBackdrop } from '@/components/ui/PhotoBackdrop';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { OpenNowBadge } from '@/components/visit/OpenNowBadge';
import { Link } from '@/i18n/navigation';
import { buttonStyles, cn } from '@/lib/cn';
import { getCategories, getFeaturedProducts, getPromotions, getSiteSettings } from '@/lib/data';
import { formatPrice } from '@/lib/format';
import { localize } from '@/lib/i18n-utils';
import { isPromotionActive } from '@/lib/pricing';
import { STORE_PHOTOS } from '@/lib/store-photos';
import { googleReviewsLink, whatsappLink } from '@/lib/whatsapp';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, tCommon, tShop, settings, categories, featured, promotions] = await Promise.all([
    getTranslations({ locale, namespace: 'home' }),
    getTranslations({ locale, namespace: 'common' }),
    getTranslations({ locale, namespace: 'shop' }),
    getSiteSettings(),
    getCategories(),
    getFeaturedProducts(),
    getPromotions(),
  ]);

  const now = new Date();
  const whatsappHref = whatsappLink(settings.whatsapp);
  const giftTiers = promotions
    .filter((p) => p.kind === 'giftThreshold' && p.threshold && isPromotionActive(p, now))
    .sort((a, b) => (a.threshold ?? 0) - (b.threshold ?? 0));
  const badgePromos = promotions.filter((p) => (p.kind === 'percentOff' || p.kind === 'fixedPrice') && isPromotionActive(p, now)).slice(0, 4);
  const lang = locale === 'en' ? 'en' : 'he';

  const showcase = [
    { ...STORE_PHOTOS.wineAisle, caption: lang === 'he' ? 'יינות' : 'Wines' },
    { ...STORE_PHOTOS.spirits, caption: lang === 'he' ? 'משקאות חריפים' : 'Spirits' },
    { ...STORE_PHOTOS.giftBasket, caption: lang === 'he' ? 'מארזי מתנה' : 'Gift baskets' },
    { ...STORE_PHOTOS.kiddush, caption: lang === 'he' ? 'קידוש ויודאיקה' : 'Kiddush & Judaica' },
  ];
  const visitPhotos = [STORE_PHOTOS.dolmenBarrel, STORE_PHOTOS.wineAisle, STORE_PHOTOS.daatZkenim];

  const trust = [
    { icon: TruckIcon, label: t('trustDelivery') },
    { icon: ShieldIcon, label: t('trustKosher') },
    { icon: GiftIcon, label: t('trustGift') },
    { icon: ChatIcon, label: t('trustAdvice') },
  ];

  return (
    <>
      <Hero whatsappHref={whatsappHref} />

      <section aria-label={t('trustDelivery')} className="relative z-10 border-y border-gold-400/15 bg-wine-900/70 backdrop-blur">
        <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 sm:px-6 md:grid-cols-4">
          {trust.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center justify-center gap-3 text-center text-sm font-semibold text-cream/90 sm:text-base">
              <Icon width={26} height={26} className="shrink-0 text-gold-400" />
              {label}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="categories-title" className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <SectionHeading id="categories-title" title={t('categoriesTitle')} subtitle={t('categoriesSubtitle')} />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6">
          {categories.map((category, index) => (
            <li key={category._id}>
              <Reveal delay={index * 0.06}>
                <CategoryCard category={category} locale={locale} />
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      {(giftTiers.length > 0 || badgePromos.length > 0) && (
        <section aria-labelledby="promo-title" className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
          <SectionHeading id="promo-title" title={t('promoTitle')} />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {giftTiers.map((tier) => (
              <li key={tier._id} className="bg-waves flex items-center gap-4 rounded-[var(--radius-card)] border border-gold-400/30 bg-wine-800/60 p-5">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gold-400/15 text-gold-300">
                  <GiftIcon width={28} height={28} />
                </span>
                <p>
                  <span className="block font-bold text-gold-200">{t('giftTier', { amount: formatPrice(tier.threshold ?? 0, locale) })}</span>
                  <span className="text-cream/85">{localize(tier.giftDescription ?? tier.title, lang)}</span>
                </p>
              </li>
            ))}
            {badgePromos.map((promo) => (
              <li key={promo._id} className="flex items-center gap-4 rounded-[var(--radius-card)] border border-gold-400/30 bg-wine-800/60 p-5">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gold-400 text-sm font-bold text-wine-950">
                  {promo.kind === 'percentOff' ? `${promo.percent}%` : <StarIcon width={22} height={22} />}
                </span>
                <p>
                  <span className="block font-bold text-gold-200">{localize(promo.badge, lang) || localize(promo.title, lang)}</span>
                  <span className="text-cream/85">{localize(promo.title, lang)}</span>
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="featured-title" className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <SectionHeading
          id="featured-title"
          title={t('featuredTitle')}
          subtitle={t('featuredSubtitle')}
          action={
            featured.length > 0 ? (
              <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-gold-300 underline-offset-4 hover:underline">
                {tShop('title')}
                <ArrowIcon width={16} height={16} />
              </Link>
            ) : undefined
          }
        />
        {featured.length > 0 ? (
          <ProductGrid products={featured} promotions={promotions} locale={locale} />
        ) : (
          <div className="relative isolate overflow-hidden rounded-[var(--radius-card)] border border-gold-400/20">
            <PhotoBackdrop src={STORE_PHOTOS.wineCounter.src} overlay="bg-gradient-to-t from-wine-950 via-wine-950/85 to-wine-950/60" />
            <ul className="grid grid-cols-2 gap-3 p-4 sm:gap-4 sm:p-6 md:grid-cols-4">
              {showcase.map((photo, index) => (
                <li key={photo.src}>
                  <Reveal delay={index * 0.08}>
                    <figure className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-gold-400/25 shadow-[0_20px_50px_-15px_rgb(0_0_0/0.7)]">
                      <Image
                        src={photo.src}
                        alt={photo.alt[lang]}
                        fill
                        sizes="(min-width: 768px) 22vw, 45vw"
                        className="object-cover transition duration-700 group-hover:scale-105"
                      />
                      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3 pt-10 text-sm font-semibold text-cream">
                        {photo.caption}
                      </figcaption>
                    </figure>
                  </Reveal>
                </li>
              ))}
            </ul>
            <div className="flex flex-col items-center gap-4 px-6 pb-8 pt-2 text-center sm:flex-row sm:justify-center">
              <p className="text-lg text-cream/90">{t('featuredEmpty')}</p>
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={cn(buttonStyles.whatsapp, 'shrink-0')}>
                <WhatsAppIcon width={20} height={20} />
                {tCommon('whatsapp')}
                <span className="sr-only">{tCommon('newTab')}</span>
              </a>
            </div>
          </div>
        )}
      </section>

      <PourShowcase />

      <section aria-labelledby="gifts-title" className="relative isolate overflow-hidden border-y border-gold-400/15">
        <PhotoBackdrop
          src={STORE_PHOTOS.giftBasket.src}
          overlay="bg-gradient-to-b from-wine-950/90 via-wine-950/80 to-wine-950/95"
        />
        <div aria-hidden className="bg-waves absolute inset-0 -z-10 opacity-60" />
        <RisingBubbles count={12} />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div className="relative mx-auto w-full max-w-md">
            <div aria-hidden className="absolute -inset-6 rounded-full bg-gold-400/15 blur-3xl" />
            <BottleTilt
              src={STORE_PHOTOS.giftWhisky.src}
              alt={STORE_PHOTOS.giftWhisky.alt[lang]}
              width={STORE_PHOTOS.giftWhisky.width}
              height={STORE_PHOTOS.giftWhisky.height}
              sizes="(min-width: 1024px) 30vw, 70vw"
              className="relative w-[78%]"
            />
            <div className="absolute -bottom-6 end-0 w-[46%] rotate-6 overflow-hidden rounded-2xl border-2 border-gold-400/50 shadow-[0_24px_60px_rgb(0_0_0/0.6)]">
              <Image
                src={STORE_PHOTOS.giftBasket.src}
                alt={STORE_PHOTOS.giftBasket.alt[lang]}
                width={STORE_PHOTOS.giftBasket.width}
                height={STORE_PHOTOS.giftBasket.height}
                sizes="(min-width: 1024px) 18vw, 35vw"
                className="aspect-[3/4] w-full object-cover"
              />
            </div>
          </div>
          <Reveal>
            <h2 id="gifts-title" className="font-display text-4xl sm:text-5xl">
              <LiquidFillText>{t('giftsTitle')}</LiquidFillText>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-cream/80">{t('giftsBody')}</p>
            <Link href="/shop/gift-baskets" className={cn(buttonStyles.primary, 'mt-8')}>
              {t('giftsCta')}
              <ArrowIcon width={18} height={18} />
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 pt-24 sm:px-6 lg:grid-cols-2">
        <Reveal className="h-full">
          <div className="relative isolate flex h-full min-h-80 flex-col items-start justify-end overflow-hidden rounded-[var(--radius-card)] border border-gold-400/30 p-8 shadow-[0_30px_70px_-25px_rgb(0_0_0/0.8)]">
            <PhotoBackdrop
              src={STORE_PHOTOS.balloons.src}
              blur={false}
              position="object-[50%_30%]"
              sizes="(min-width: 1024px) 45vw, 100vw"
              overlay="bg-gradient-to-t from-wine-950 via-wine-950/80 to-wine-950/20"
            />
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold-400/40 bg-wine-950/60 backdrop-blur">
              <StarIcon className="h-6 w-6 text-gold-400" />
            </span>
            <h2 className="font-display mt-4 text-3xl text-gold-200">{t('eventsTitle')}</h2>
            <p className="mt-3 max-w-md text-cream/85">{t('eventsBody')}</p>
            <Link href="/events" className={cn(buttonStyles.primary, 'mt-6')}>
              {t('eventsCta')}
              <ArrowIcon width={18} height={18} />
            </Link>
          </div>
        </Reveal>
        {settings.whatsappGroupUrl && (
          <Reveal className="h-full" delay={0.1}>
            <div className="relative isolate flex h-full min-h-80 flex-col items-start justify-end overflow-hidden rounded-[var(--radius-card)] border border-[#1f9d55]/50 p-8 shadow-[0_30px_70px_-25px_rgb(0_0_0/0.8)]">
              <PhotoBackdrop
                src={STORE_PHOTOS.spirits.src}
                blur={false}
                position="object-[50%_35%]"
                sizes="(min-width: 1024px) 45vw, 100vw"
                overlay="bg-gradient-to-t from-[#06170d] via-[#0d2a1a]/85 to-[#0d2a1a]/25"
              />
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#4ade80]/40 bg-[#06170d]/60 backdrop-blur">
                <WhatsAppIcon className="h-7 w-7 text-[#4ade80]" />
              </span>
              <h2 className="font-display mt-4 text-3xl text-cream">{t('groupTitle')}</h2>
              <p className="mt-3 max-w-md text-cream/85">{t('groupBody')}</p>
              <a href={settings.whatsappGroupUrl} target="_blank" rel="noopener noreferrer" className={cn(buttonStyles.whatsapp, 'mt-6')}>
                {t('groupCta')}
                <span className="sr-only">{tCommon('newTab')}</span>
              </a>
            </div>
          </Reveal>
        )}
      </section>

      <section aria-labelledby="visit-title" className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <div className="relative isolate grid overflow-hidden rounded-[var(--radius-card)] border border-gold-400/25 md:grid-cols-[1.1fr_1fr]">
          <PhotoBackdrop src={STORE_PHOTOS.wineCounter.src} overlay="bg-wine-950/85" />
          <div aria-hidden className="bg-waves absolute inset-0 -z-10 opacity-70" />
          <ul className="grid grid-cols-3 gap-3 p-4 sm:p-6">
            {visitPhotos.map((photo, index) => (
              <li
                key={photo.src}
                className={cn(
                  'relative aspect-[9/16] overflow-hidden rounded-2xl border border-gold-400/30 shadow-[0_20px_50px_-15px_rgb(0_0_0/0.8)]',
                  index === 1 ? 'md:-translate-y-4' : 'md:translate-y-4',
                )}
              >
                <Image src={photo.src} alt={photo.alt[lang]} fill sizes="(min-width: 768px) 17vw, 30vw" className="object-cover" />
              </li>
            ))}
          </ul>
          <div className="flex flex-col items-start justify-center gap-4 p-8 sm:p-12">
            <OpenNowBadge locale={locale} />
            <h2 id="visit-title" className="font-display text-gold-gradient text-4xl">
              {t('visitTitle')}
            </h2>
            <p className="text-lg text-cream/80">{t('visitBody')}</p>
            <p className="text-cream/70">
              {localize(settings.address, locale)}, {localize(settings.city, locale)}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/visit" className={buttonStyles.primary}>
                {t('visitCta')}
                <ArrowIcon width={18} height={18} />
              </Link>
              <a
                href={googleReviewsLink(
                  settings.googleReviewsUrl,
                  localize(settings.name, 'he'),
                  `${localize(settings.address, 'he')}, ${localize(settings.city, 'he')}`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonStyles.secondary}
              >
                <StarIcon width={18} height={18} />
                {tCommon('googleReviews')}
                <span className="sr-only">{tCommon('newTab')}</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
