import { SITE_URL } from '@/lib/defaults';
import { localize } from '@/lib/i18n-utils';
import { jsonLd } from '@/lib/seo';
import type { SiteSettings } from '@/lib/types';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function LocalBusinessJsonLd({ locale, settings, nonce }: { locale: string; settings: SiteSettings; nonce?: string }) {
  const phone = settings.phone.replace(/\D/g, '');
  const data = {
    '@context': 'https://schema.org',
    '@type': 'LiquorStore',
    '@id': `${SITE_URL}/#store`,
    name: localize(settings.name, locale),
    slogan: localize(settings.slogan, locale),
    url: `${SITE_URL}/${locale}`,
    image: `${SITE_URL}/og.png`,
    telephone: `+972${phone.replace(/^0/, '')}`,
    priceRange: '₪₪',
    currenciesAccepted: 'ILS',
    address: {
      '@type': 'PostalAddress',
      streetAddress: localize(settings.address, locale),
      addressLocality: localize(settings.city, locale),
      addressCountry: 'IL',
    },
    geo: { '@type': 'GeoCoordinates', latitude: settings.geo.lat, longitude: settings.geo.lng },
    openingHoursSpecification: settings.openingHours
      .filter((d) => !d.closed && d.open && d.close && d.day !== 6)
      .map((d) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: DAY_NAMES[d.day], opens: d.open, closes: d.day === 5 ? settings.eveCloseTime : d.close })),
    sameAs: [settings.facebookUrl, settings.instagramUrl].filter(Boolean),
    areaServed: localize(settings.city, locale),
  };

  return <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />;
}
