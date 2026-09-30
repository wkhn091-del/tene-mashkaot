import type { LegalTokens } from '@/content/legal';
import { formatPhone } from './format';
import { localize } from './i18n-utils';
import type { SiteSettings } from './types';

const PHYSICAL_FALLBACK = {
  he: 'לפרטים על נגישות החנות הפיזית ולתיאום סיוע בהגעה ניתן לפנות אלינו בטלפון.',
  en: 'For details on the physical store accessibility and to arrange assistance, please call us.',
};

export function legalTokens(settings: SiteSettings, locale: string): LegalTokens {
  const lang = locale === 'en' ? 'en' : 'he';
  const email = settings.legal.accessibilityCoordinatorEmail;
  return {
    businessName: (lang === 'he' && settings.legal.businessName) || localize(settings.name, locale),
    address: `${localize(settings.address, locale)}, ${localize(settings.city, locale)}`,
    phone: formatPhone(settings.phone),
    coordinatorName: settings.legal.accessibilityCoordinatorName || localize(settings.name, locale),
    coordinatorPhone: formatPhone(settings.legal.accessibilityCoordinatorPhone || settings.phone),
    coordinatorEmail: email ? (lang === 'he' ? `, מייל ${email}` : `, email ${email}`) : '',
    physicalAccessibility: localize(settings.legal.physicalAccessibility, locale) || PHYSICAL_FALLBACK[lang],
  };
}
