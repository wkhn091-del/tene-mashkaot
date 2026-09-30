'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function HeaderShell({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300',
        scrolled ? 'bg-wine-950/85 shadow-[0_10px_40px_-20px_rgb(0_0_0/0.8)] backdrop-blur-xl' : 'bg-transparent',
      )}
    >
      {children}
    </header>
  );
}
