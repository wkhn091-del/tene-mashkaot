import type { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { HoursList } from '@/components/layout/HoursList';
import { Reveal } from '@/components/motion/Reveal';
import { SanityImage } from '@/components/shop/SanityImage';
import { ClockIcon, MapPinIcon, PhoneIcon, ShieldIcon, StarIcon, WazeIcon, WhatsAppIcon } from '@/components/ui/icons';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { OpenNowBadge } from '@/components/visit/OpenNowBadge';
import { buttonStyles, cn } from '@/lib/cn';
import { getSiteSettings } from '@/lib/data';
import { formatPhone } from '@/lib/format';
import { localize } from '@/lib/i18n-utils';
import { alternatesFor } from '@/lib/seo';
import { GALLERY } from '@/lib/store-photos';
import { googleMapsEmbed, googleMapsLink, googleReviewsLink, wazeLink, whatsappLink } from '@/lib/whatsapp';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'visit' });
  return { title: t('title'), description: t('subtitle'), alternates: alternatesFor(locale, '/visit') };
}

export default async function VisitPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tCommon, settings] = await Promise.all([
    getTranslations({ locale, namespace: 'visit' }),
    getTranslations({ locale, namespace: 'common' }),
    getSiteSettings(),
  ]);
  const lang = locale === 'en' ? 'en' : 'he';
  const address = `${localize(settings.address, locale)}, ${localize(settings.city, locale)}`;
  const addressHe = `${localize(settings.address, 'he')}, ${localize(settings.city, 'he')}`;
  const kashrut = localize(settings.kashrut, locale);
  const physical = localize(settings.legal.physicalAccessibility, locale);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      <SectionHeading as="h1" title={t('title')} subtitle={t('subtitle')} action={<OpenNowBadge locale={locale} />} />

      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <div className="space-y-6">
          <section aria-labelledby="visit-address" className="rounded-[var(--radius-card)] border border-gold-400/20 bg-wine-900/50 p-6">
            <h2 id="visit-address" className="font-display mb-3 flex items-center gap-2 text-xl text-gold-200">
              <MapPinIcon width={20} height={20} /> {t('address')}
            </h2>
            <p className="text-lg">{address}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={wazeLink(addressHe)} target="_blank" rel="noopener noreferrer" className={cn(buttonStyles.secondary, 'px-4 py-2 text-sm')}>
                <WazeIcon width={18} height={18} />
                {tCommon('waze')}
                <span className="sr-only">{tCommon('newTab')}</span>
              </a>
              <a href={googleMapsLink(addressHe)} target="_blank" rel="noopener noreferrer" className={cn(buttonStyles.secondary, 'px-4 py-2 text-sm')}>
                <MapPinIcon width={18} height={18} />
                {tCommon('googleMaps')}
                <span className="sr-only">{tCommon('newTab')}</span>
              </a>
            </div>
          </section>

          <section aria-labelledby="visit-hours" className="rounded-[var(--radius-card)] border border-gold-400/20 bg-wine-900/50 p-6">
            <h2 id="visit-hours" className="font-display mb-4 flex items-center gap-2 text-xl text-gold-200">
              <ClockIcon width={20} height={20} /> {t('hours')}
            </h2>
            <HoursList settings={settings} locale={locale} />
          </section>

          <section aria-labelledby="visit-contact" className="rounded-[var(--radius-card)] border border-gold-400/20 bg-wine-900/50 p-6">
            <h2 id="visit-contact" className="font-display mb-4 text-xl text-gold-200">
              {t('contact')}
            </h2>
            <div className="flex flex-col gap-2">
              <a href={`tel:${settings.phone.replace(/\D/g, '')}`} className={cn(buttonStyles.secondary, 'justify-start')}>
                <PhoneIcon width={18} height={18} />
                <span dir="ltr">{formatPhone(settings.phone)}</span>
              </a>
              <a href={whatsappLink(settings.whatsapp)} target="_blank" rel="noopener noreferrer" className={cn(buttonStyles.whatsapp, 'justify-start')}>
                <WhatsAppIcon width={20} height={20} />
                {tCommon('whatsapp')}
                <span className="sr-only">{tCommon('newTab')}</span>
              </a>
              <a
                href={googleReviewsLink(settings.googleReviewsUrl, localize(settings.name, 'he'), addressHe)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonStyles.secondary, 'justify-start')}
              >
                <StarIcon width={18} height={18} />
                {tCommon('googleReviews')}
                <span className="sr-only">{tCommon('newTab')}</span>
              </a>
            </div>
          </section>

          {(kashrut || physical) && (
            <section className="space-y-3 rounded-[var(--radius-card)] border border-gold-400/20 bg-wine-900/50 p-6">
              {kashrut && (
                <div>
                  <h2 className="font-display flex items-center gap-2 text-xl text-gold-200">
                    <ShieldIcon width={20} height={20} /> {t('kashrut')}
                  </h2>
                  <p className="mt-2">{kashrut}</p>
                  {settings.kashrutCertificate?.asset && (
                    <div className="relative mt-3 aspect-[3/4] w-40 overflow-hidden rounded-xl border border-gold-400/20">
                      <SanityImage image={settings.kashrutCertificate} alt={kashrut} sizes="160px" className="object-contain" />
                    </div>
                  )}
                </div>
              )}
              {physical && <p className="text-sm text-cream/75">{physical}</p>}
            </section>
          )}
        </div>

        <div className="min-h-[24rem] overflow-hidden rounded-[var(--radius-card)] border border-gold-400/20 bg-wine-900">
          <iframe
            title={t('mapTitle')}
            src={googleMapsEmbed(addressHe)}
            className="h-full min-h-[24rem] w-full grayscale-[35%] contrast-[1.05]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>

      <section aria-labelledby="visit-gallery" className="pt-20">
        <SectionHeading id="visit-gallery" title={t('gallery')} />
        <ul className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>li]:mb-3">
          {GALLERY.map((photo, index) => (
            <li key={photo.src} className="break-inside-avoid">
              <Reveal delay={(index % 4) * 0.05}>
                <Image
                  src={photo.src}
                  alt={photo.alt[lang]}
                  width={photo.width}
                  height={photo.height}
                  sizes="(min-width: 1024px) 24vw, (min-width: 640px) 32vw, 48vw"
                  className="w-full rounded-2xl border border-gold-400/15 object-cover"
                />
              </Reveal>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
