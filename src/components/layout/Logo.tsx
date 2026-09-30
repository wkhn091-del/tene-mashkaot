import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { localize } from '@/lib/i18n-utils';
import type { SiteSettings } from '@/lib/types';
import { imageUrl } from '@/sanity/lib/image';
import { StarIcon } from '../ui/icons';

export function Logo({ settings, locale, compact = false }: { settings: SiteSettings; locale: string; compact?: boolean }) {
  const name = localize(settings.name, locale);
  const slogan = localize(settings.slogan, locale);
  const logoSrc = imageUrl(settings.logo, 400);

  return (
    <Link href="/" className="group flex items-center gap-2" aria-label={name}>
      {logoSrc ? (
        <Image src={logoSrc} alt={name} width={160} height={56} className="h-11 w-auto" preload />
      ) : (
        <span className="flex flex-col leading-none">
          <span className="font-display text-gold-gradient flex items-center gap-1.5 text-2xl sm:text-[1.7rem]">
            <StarIcon className="h-4 w-4 text-gold-400 transition-transform duration-500 group-hover:rotate-[72deg]" />
            {name}
          </span>
          {!compact && <span className="mt-1 ps-6 text-[0.7rem] tracking-[0.35em] text-gold-300/80">{slogan}</span>}
        </span>
      )}
    </Link>
  );
}
