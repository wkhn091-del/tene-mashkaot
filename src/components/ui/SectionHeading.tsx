import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { StarIcon } from './icons';

export function SectionHeading({
  title,
  subtitle,
  as: Tag = 'h2',
  align = 'center',
  id,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  as?: 'h1' | 'h2';
  align?: 'center' | 'start';
  id?: string;
  action?: ReactNode;
}) {
  return (
    <div className={cn('mb-10 flex flex-col gap-3', align === 'center' ? 'items-center text-center' : 'items-start text-start')}>
      <StarIcon className="h-5 w-5 text-gold-400" />
      <Tag id={id} className={cn('font-display text-gold-gradient', Tag === 'h1' ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl')}>
        {title}
      </Tag>
      {subtitle && <p className="max-w-2xl text-cream/70 sm:text-lg">{subtitle}</p>}
      <div className="gold-hairline mt-1 w-32" aria-hidden />
      {action}
    </div>
  );
}
