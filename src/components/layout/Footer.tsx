import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { formatPhone } from '@/lib/format';
import { localize } from '@/lib/i18n-utils';
import type { SiteSettings } from '@/lib/types';
import { wazeLink } from '@/lib/whatsapp';
import { FacebookIcon, InstagramIcon, MapPinIcon, PhoneIcon } from '../ui/icons';
import { PhotoBackdrop } from '../ui/PhotoBackdrop';
import { HoursList } from './HoursList';
import { Logo } from './Logo';
import { NAV_ITEMS } from './nav-items';
import { CookieSettingsButton } from '../analytics/CookieSettingsButton';

const LEGAL_LINKS = ['terms', 'privacy', 'accessibility', 'shipping-returns', 'cookies'] as const;

export async function Footer({ locale, settings }: { locale: string; settings: SiteSettings }) {
  const [t, tNav, tLegal, tCommon, tVisit] = await Promise.all([
    getTranslations({ locale, namespace: 'footer' }),
    getTranslations({ locale, namespace: 'nav' }),
    getTranslations({ locale, namespace: 'legal' }),
    getTranslations({ locale, namespace: 'common' }),
    getTranslations({ locale, namespace: 'visit' }),
  ]);
  const name = localize(settings.name, locale);
  const fullAddress = `${localize(settings.address, locale)}, ${localize(settings.city, locale)}`;
  const phoneHref = `tel:${settings.phone.replace(/\D/g, '')}`;
  const kashrut = localize(settings.kashrut, locale);
  const businessName = locale === 'he' ? settings.legal.businessName || name : name;

  return (
    <footer className="relative isolate mt-24 overflow-hidden border-t border-gold-400/20">
      <PhotoBackdrop src="/images/store/bar-backdrop.webp" blur={false} overlay="bg-gradient-to-b from-wine-950/85 via-wine-950/90 to-wine-950" />
      <div aria-hidden className="bg-waves absolute inset-0 -z-10 opacity-70" />
      <div aria-hidden className="gold-hairline absolute inset-x-0 top-0" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo settings={settings} locale={locale} />
          {kashrut && <p className="text-sm text-gold-200/80">{kashrut}</p>}
          <div className="flex gap-2">
            {settings.facebookUrl && (
              <a
                href={settings.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${t('facebook')} ${tCommon('newTab')}`}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gold-400/30 text-gold-200 transition hover:bg-gold-400/10"
              >
                <FacebookIcon width={20} height={20} />
              </a>
            )}
            {settings.instagramUrl && (
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${t('instagram')} ${tCommon('newTab')}`}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gold-400/30 text-gold-200 transition hover:bg-gold-400/10"
              >
                <InstagramIcon width={20} height={20} />
              </a>
            )}
          </div>
        </div>

        <div>
          <h2 className="font-display mb-4 text-lg text-gold-300">{t('contact')}</h2>
          <ul className="space-y-3 text-sm">
            <li>
              <a href={wazeLink(fullAddress)} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 hover:text-gold-200">
                <MapPinIcon width={18} height={18} className="mt-0.5 shrink-0 text-gold-400" />
                {fullAddress}
                <span className="sr-only">{tCommon('newTab')}</span>
              </a>
            </li>
            <li>
              <a href={phoneHref} className="flex items-center gap-2 hover:text-gold-200">
                <PhoneIcon width={18} height={18} className="shrink-0 text-gold-400" />
                <span dir="ltr">{formatPhone(settings.phone)}</span>
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-display mb-4 text-lg text-gold-300">{tVisit('hours')}</h2>
          <HoursList settings={settings} locale={locale} compact />
        </div>

        <div className="grid grid-cols-2 gap-6 lg:grid-cols-1">
          <nav aria-label={tNav('mainNav')}>
            <ul className="space-y-2 text-sm">
              {NAV_ITEMS.map((item) => (
                <li key={item.key}>
                  <Link href={item.href} className="text-cream/80 hover:text-gold-200">
                    {tNav(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label={t('legal')}>
            <ul className="space-y-2 text-sm">
              {LEGAL_LINKS.map((slug) => (
                <li key={slug}>
                  <Link href={`/legal/${slug}`} className="text-cream/80 hover:text-gold-200">
                    {tLegal(slug)}
                  </Link>
                </li>
              ))}
            </ul>
            <CookieSettingsButton className="mt-2 text-sm text-cream/80 underline-offset-4 hover:text-gold-200 hover:underline" />
          </nav>
        </div>
      </div>

      <div className="border-t border-gold-400/15">
        <p className="bg-black/30 px-4 py-3 text-center text-sm font-bold text-gold-100" role="note">
          {localize(settings.alcoholWarning, locale)}
        </p>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 pt-5 pb-24 text-xs text-cream/55 sm:flex-row sm:px-6 sm:pb-5">
          <p>
            {t('rights', { year: new Date().getFullYear(), name: businessName })}
            {settings.legal.businessId && <> · {t('businessId', { id: settings.legal.businessId })}</>}
          </p>
        </div>
      </div>
    </footer>
  );
}
