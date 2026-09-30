import { getTranslations } from 'next-intl/server';
import { formatPhone } from '@/lib/format';
import type { SiteSettings } from '@/lib/types';
import { whatsappLink } from '@/lib/whatsapp';
import { CartButton } from '../cart/CartButton';
import { PhoneIcon } from '../ui/icons';
import { HeaderShell } from './HeaderShell';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Logo } from './Logo';
import { MobileMenu } from './MobileMenu';
import { NavLinks } from './NavLinks';

export async function Header({ locale, settings }: { locale: string; settings: SiteSettings }) {
  const t = await getTranslations({ locale, namespace: 'common' });
  const phone = formatPhone(settings.phone);
  const phoneHref = `tel:${settings.phone.replace(/\D/g, '')}`;

  return (
    <HeaderShell>
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-20">
        <div className="flex items-center gap-2">
          <MobileMenu phone={phone} phoneHref={phoneHref} whatsappHref={whatsappLink(settings.whatsapp)} />
          <Logo settings={settings} locale={locale} />
        </div>
        <NavLinks />
        <div className="flex items-center gap-1 sm:gap-2">
          <a
            href={phoneHref}
            className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-gold-200 transition hover:bg-white/5 xl:flex"
            aria-label={`${t('call')} ${phone}`}
          >
            <PhoneIcon width={18} height={18} />
            <span dir="ltr">{phone}</span>
          </a>
          <LanguageSwitcher className="hidden rounded-full border border-gold-400/40 px-3 py-1.5 text-sm font-semibold text-gold-200 transition hover:bg-gold-400/10 sm:inline-flex" />
          <CartButton />
        </div>
      </div>
    </HeaderShell>
  );
}
