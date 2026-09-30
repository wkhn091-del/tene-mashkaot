'use client';

import { useInView } from 'motion/react';
import { useRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Headline whose letters fill with golden liquid (rising level + moving wave) once scrolled into view.
 * The text stays real text for screen readers and SEO; the effect is pure CSS (see `.liquid-text`).
 */
export function LiquidFillText({
  as: Tag = 'span',
  children,
  className,
  delay = 0,
}: {
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p';
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLHeadingElement & HTMLParagraphElement & HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });

  return (
    <Tag ref={ref} data-filled={inView} className={cn('liquid-text', className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}
