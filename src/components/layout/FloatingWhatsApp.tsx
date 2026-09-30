'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { whatsappLink } from '@/lib/whatsapp';
import { WhatsAppIcon } from '../ui/icons';

/** Hidden on checkout/cart where the page has its own WhatsApp fallback and space matters. */
export function FloatingWhatsApp({ number }: { number: string }) {
  const t = useTranslations('common');
  const pathname = usePathname();
  if (pathname.startsWith('/checkout') || pathname.startsWith('/cart')) return null;

  return (
    <a
      href={whatsappLink(number)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${t('whatsapp')} ${t('newTab')}`}
      className="fixed bottom-4 end-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-[#1f9d55] text-white shadow-[0_10px_30px_-8px_rgb(31_157_85/0.7)] ring-2 ring-white/20 transition hover:scale-105"
    >
      <WhatsAppIcon width={30} height={30} />
    </a>
  );
}
