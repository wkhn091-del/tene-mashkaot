import type { CSSProperties } from 'react';
import { cn } from '@/lib/cn';

/** Deterministic pseudo-random so server and client markup match. */
function seeded(index: number, salt: number): number {
  const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

type BubbleStyle = CSSProperties & Record<`--${string}`, string>;

/** Decorative champagne-style bubbles rising through a section. Pure CSS; hidden for reduced motion. */
export function RisingBubbles({ count = 18, className }: { count?: number; className?: string }) {
  const bubbles = Array.from({ length: count }, (_, i) => {
    const size = 4 + seeded(i, 1) * 14;
    const style: BubbleStyle = {
      insetInlineStart: `${(seeded(i, 2) * 100).toFixed(2)}%`,
      width: `${size.toFixed(1)}px`,
      height: `${size.toFixed(1)}px`,
      '--bubble-duration': `${(7 + seeded(i, 3) * 9).toFixed(2)}s`,
      '--bubble-delay': `${(-seeded(i, 4) * 14).toFixed(2)}s`,
      '--bubble-drift': `${((seeded(i, 5) - 0.5) * 60).toFixed(1)}px`,
      '--bubble-opacity': (0.25 + seeded(i, 6) * 0.45).toFixed(2),
      '--bubble-rise': `${(60 + seeded(i, 7) * 50).toFixed(0)}vh`,
    };
    return <span key={i} className="bubble" style={style} />;
  });

  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {bubbles}
    </div>
  );
}
