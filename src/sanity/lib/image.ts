import { createImageUrlBuilder } from '@sanity/image-url';
import { dataset, projectId } from '../env';
import type { SanityImage } from '@/lib/types';

const builder = projectId ? createImageUrlBuilder({ projectId, dataset }) : null;

export function urlForImage(source: SanityImage | null | undefined) {
  if (!builder || !source?.asset?._ref) return null;
  return builder.image(source).auto('format').fit('max');
}

export function imageUrl(source: SanityImage | null | undefined, width: number): string | null {
  return urlForImage(source)?.width(width).url() ?? null;
}

/** JPEG at a fixed box, for generated share images (the renderer does not read WebP/AVIF). */
export function jpegImageUrl(source: SanityImage | null | undefined, width: number, height: number): string | null {
  if (!builder || !source?.asset?._ref) return null;
  return builder.image(source).width(width).height(height).fit('max').format('jpg').quality(85).url();
}
