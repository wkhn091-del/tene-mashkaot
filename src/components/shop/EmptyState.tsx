import { buttonStyles } from '@/lib/cn';
import { WhatsAppIcon } from '../ui/icons';
import { ProductPlaceholder } from './ProductPlaceholder';

export function EmptyState({ message, ctaLabel, whatsappHref, newTabLabel }: { message: string; ctaLabel: string; whatsappHref: string; newTabLabel: string }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center bg-waves rounded-[var(--radius-card)] border border-gold-400/25 bg-wine-900/60 p-8 shadow-[0_30px_70px_-30px_rgb(0_0_0/0.8)] text-center">
      <div className="h-40 w-32 overflow-hidden rounded-2xl">
        <ProductPlaceholder kind="wine" />
      </div>
      <p className="mt-6 text-lg text-cream/85">{message}</p>
      <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={`${buttonStyles.whatsapp} mt-6`}>
        <WhatsAppIcon width={20} height={20} />
        {ctaLabel}
        <span className="sr-only">{newTabLabel}</span>
      </a>
    </div>
  );
}
