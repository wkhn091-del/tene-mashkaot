'use client';

import Image, { type ImageLoaderProps } from 'next/image';
import type { SanityImage as SanityImageType } from '@/lib/types';
import { urlForImage } from '@/sanity/lib/image';

function sanityLoader({ src, width, quality }: ImageLoaderProps): string {
  const url = new URL(src);
  url.searchParams.set('w', String(width));
  url.searchParams.set('q', String(quality ?? 75));
  return url.toString();
}

/** Renders a Sanity asset straight from the Sanity image CDN (resized per srcset width). */
export function SanityImage({
  image,
  alt,
  sizes,
  className,
  priority,
  fill = true,
  width,
  height,
}: {
  image: SanityImageType;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
}) {
  const src = urlForImage(image)?.url();
  if (!src) return null;
  return fill ? (
    <Image loader={sanityLoader} src={src} alt={alt} sizes={sizes} fill className={className} preload={priority} />
  ) : (
    <Image loader={sanityLoader} src={src} alt={alt} sizes={sizes} width={width ?? 800} height={height ?? 1000} className={className} preload={priority} />
  );
}
