import 'server-only';
import type { QueryParams } from 'next-sanity';
import { getReadClient } from './client';

/**
 * Cache tags. Lists and single pages are tagged separately, so editing one product refreshes that
 * product's page and the listings – not every other product page on the site.
 */
export const CACHE_TAGS = {
  settings: 'sanity:settings',
  categories: 'sanity:categories',
  products: 'sanity:products',
  promotions: 'sanity:promotions',
  delivery: 'sanity:delivery',
  legal: 'sanity:legal',
} as const;

export const productTag = (slug: string) => `sanity:product:${slug}`;
export const legalTag = (slug: string) => `sanity:legal:${slug}`;

export type CacheTag = string;

interface FetchOptions {
  query: string;
  params?: QueryParams;
  tags: CacheTag[];
  /** Seconds before a background refresh even without a webhook. */
  revalidate?: number;
}

/**
 * Cached, tag-revalidated Sanity query. Returns `null` when Sanity is not configured
 * or unreachable so every page can fall back to built-in defaults instead of crashing.
 */
export async function sanityFetch<T>({ query, params = {}, tags, revalidate = 3600 }: FetchOptions): Promise<T | null> {
  const client = getReadClient();
  if (!client) return null;
  try {
    return await client.fetch<T>(query, params, {
      next: { tags, revalidate },
    });
  } catch (error) {
    console.error('[sanity] query failed', { tags, error: error instanceof Error ? error.message : error });
    return null;
  }
}

/** Uncached read used when correctness matters more than speed (order placement). */
export async function sanityFetchFresh<T>(query: string, params: QueryParams = {}): Promise<T | null> {
  const client = getReadClient();
  if (!client) return null;
  try {
    return await client.fetch<T>(query, params, { cache: 'no-store' });
  } catch (error) {
    console.error('[sanity] fresh query failed', error instanceof Error ? error.message : error);
    return null;
  }
}
