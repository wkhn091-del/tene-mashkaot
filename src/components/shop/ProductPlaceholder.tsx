import type { ReactNode } from 'react';
import type { CategoryKind } from '@/lib/types';
import { cn } from '@/lib/cn';

const SHAPES: Record<CategoryKind, ReactNode> = {
  wine: (
    <>
      <path d="M52 14h16v14c0 12 3 20 9 29 5 8 8 15 8 27v88c0 5-3 8-8 8H43c-5 0-8-3-8-8V84c0-12 3-19 8-27 6-9 9-17 9-29z" fill="currentColor" opacity="0.9" />
      <rect x="40" y="96" width="40" height="46" rx="3" fill="#f3e6cc" opacity="0.9" />
      <path d="M60 106l2.8 5.8 6.2.8-4.6 4.3 1.2 6.2L60 120l-5.6 3.1 1.2-6.2-4.6-4.3 6.2-.8z" fill="#5a1a22" />
    </>
  ),
  spirits: (
    <>
      <path d="M50 14h20v18c0 6 4 9 10 12 6 3 9 8 9 16v108c0 6-4 10-10 10H41c-6 0-10-4-10-10V60c0-8 3-13 9-16 6-3 10-6 10-12z" fill="currentColor" opacity="0.9" />
      <rect x="38" y="92" width="44" height="40" rx="3" fill="#f3e6cc" opacity="0.9" />
      <rect x="44" y="104" width="32" height="3" fill="#5a1a22" />
      <rect x="48" y="112" width="24" height="3" fill="#5a1a22" opacity="0.6" />
    </>
  ),
  gift: (
    <>
      <rect x="22" y="80" width="76" height="86" rx="6" fill="currentColor" opacity="0.9" />
      <rect x="16" y="64" width="88" height="22" rx="4" fill="currentColor" />
      <rect x="55" y="64" width="10" height="102" fill="#d4a95a" />
      <path d="M60 64c-10-18-30-22-32-10s18 12 32 10zm0 0c10-18 30-22 32-10s-18 12-32 10z" fill="none" stroke="#d4a95a" strokeWidth="5" />
    </>
  ),
  balloons: (
    <>
      <ellipse cx="46" cy="62" rx="24" ry="30" fill="currentColor" opacity="0.9" />
      <ellipse cx="76" cy="54" rx="22" ry="28" fill="#d4a95a" opacity="0.9" />
      <path d="M46 92c-2 20 10 40 14 80M76 82c2 24-10 50-16 90" stroke="#ebcb8b" strokeWidth="1.5" fill="none" />
    </>
  ),
  sweets: (
    <>
      <rect x="18" y="70" width="84" height="70" rx="10" fill="currentColor" opacity="0.9" />
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => <circle key={`${r}-${c}`} cx={38 + c * 22} cy={88 + r * 18} r="7" fill="#d4a95a" opacity={0.85 - r * 0.15} />),
      )}
    </>
  ),
  judaica: (
    <>
      <path d="M40 60h40l-6 50c-1 8-6 12-14 12s-13-4-14-12z" fill="currentColor" opacity="0.9" />
      <rect x="57" y="122" width="6" height="30" fill="currentColor" />
      <rect x="42" y="152" width="36" height="8" rx="3" fill="currentColor" />
      <path d="M60 22l4.6 9.6 10.4 1.3-7.6 7.1 2 10.4L60 45.3l-9.4 5.1 2-10.4-7.6-7.1 10.4-1.3z" fill="#d4a95a" />
    </>
  ),
  other: (
    <path d="M60 40l10 21 23 3-17 16 4 23-20-11-20 11 4-23-17-16 23-3z" fill="currentColor" opacity="0.9" />
  ),
};

/** Branded illustration shown until product photos are uploaded to Sanity. */
export function ProductPlaceholder({ kind, className, label }: { kind: CategoryKind; className?: string; label?: string }) {
  return (
    <div className={cn('bg-waves relative flex h-full w-full items-center justify-center bg-gradient-to-b from-wine-800 to-wine-900', className)}>
      <svg viewBox="0 0 120 180" className="h-3/4 w-auto text-wine-600 drop-shadow-[0_12px_20px_rgb(0_0_0/0.5)]" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
        {SHAPES[kind] ?? SHAPES.other}
      </svg>
    </div>
  );
}
