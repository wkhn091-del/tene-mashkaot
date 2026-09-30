import Image from 'next/image';
import { cn } from '@/lib/cn';

/** Decorative blurred store photo behind a section; the parent must be `relative isolate overflow-hidden`. */
export function PhotoBackdrop({
  src,
  overlay = 'bg-wine-950/80',
  blur = true,
  position = 'object-center',
  sizes = '100vw',
}: {
  src: string;
  overlay?: string;
  blur?: boolean;
  position?: string;
  sizes?: string;
}) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <Image src={src} alt="" fill sizes={sizes} quality={60} className={cn('object-cover', position, blur && 'scale-110 blur-md')} />
      <div className={cn('absolute inset-0', overlay)} />
    </div>
  );
}
