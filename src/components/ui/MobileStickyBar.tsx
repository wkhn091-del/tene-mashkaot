import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Full-width action bar pinned above the home indicator on small screens only. */
export function MobileStickyBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-[55] border-t border-gold-400/25 bg-wine-950/95 px-3 pt-3 shadow-[0_-12px_40px_-16px_rgb(0_0_0/0.75)] backdrop-blur-md lg:hidden',
        'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Spacer so page content is not hidden behind MobileStickyBar. */
export function MobileStickySpacer() {
  return <div className="h-24 lg:hidden" aria-hidden />;
}
