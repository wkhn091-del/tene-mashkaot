import 'server-only';
import { cache } from 'react';
import { CACHE_TAGS, legalTag, productTag, sanityFetch, sanityFetchFresh } from '@/sanity/lib/fetch';
import {
  CATEGORIES_QUERY,
  DELIVERY_SETTINGS_QUERY,
  DELIVERY_ZONES_QUERY,
  FEATURED_PRODUCTS_QUERY,
  LEGAL_PAGE_QUERY,
  PRODUCT_BY_SLUG_QUERY,
  PRODUCT_SLUGS_QUERY,
  PRODUCTS_BY_IDS_QUERY,
  PRODUCTS_QUERY,
  PROMOTIONS_QUERY,
  RELATED_PRODUCTS_QUERY,
  SITE_SETTINGS_QUERY,
} from '@/sanity/lib/queries';
import { DEFAULT_CATEGORIES, DEFAULT_DELIVERY_SETTINGS, DEFAULT_DELIVERY_ZONES, DEFAULT_SITE_SETTINGS } from './defaults';
import type { Category, DeliverySettings, DeliveryZone, LegalPage, Product, Promotion, SiteSettings } from './types';

type Partialish<T> = { [K in keyof T]?: T[K] | null };

function pickDefined<T extends object>(base: T, override: Partialish<T> | null | undefined): T {
  if (!override) return base;
  const result = { ...base };
  for (const key of Object.keys(override) as (keyof T)[]) {
    const value = override[key];
    if (value === null || value === undefined) continue;
    if (typeof value === 'string' && value.trim() === '') continue;
    result[key] = value as T[keyof T];
  }
  return result;
}

function mergeLocale<T extends { he?: string; en?: string }>(base: T | undefined, override: T | null | undefined): T | undefined {
  if (!override) return base;
  return { he: override.he || base?.he, en: override.en || base?.en } as T;
}

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const doc = await sanityFetch<Partialish<SiteSettings>>({ query: SITE_SETTINGS_QUERY, tags: [CACHE_TAGS.settings] });
  const merged = pickDefined(DEFAULT_SITE_SETTINGS, doc);
  return {
    ...merged,
    name: mergeLocale(DEFAULT_SITE_SETTINGS.name, doc?.name) ?? DEFAULT_SITE_SETTINGS.name,
    slogan: mergeLocale(DEFAULT_SITE_SETTINGS.slogan, doc?.slogan) ?? DEFAULT_SITE_SETTINGS.slogan,
    address: mergeLocale(DEFAULT_SITE_SETTINGS.address, doc?.address) ?? DEFAULT_SITE_SETTINGS.address,
    city: mergeLocale(DEFAULT_SITE_SETTINGS.city, doc?.city) ?? DEFAULT_SITE_SETTINGS.city,
    alcoholWarning: mergeLocale(DEFAULT_SITE_SETTINGS.alcoholWarning, doc?.alcoholWarning) ?? DEFAULT_SITE_SETTINGS.alcoholWarning,
    kashrut: mergeLocale(DEFAULT_SITE_SETTINGS.kashrut, doc?.kashrut),
    geo: doc?.geo?.lat && doc?.geo?.lng ? doc.geo : DEFAULT_SITE_SETTINGS.geo,
    openingHours: doc?.openingHours?.length ? doc.openingHours : DEFAULT_SITE_SETTINGS.openingHours,
    legal: pickDefined(DEFAULT_SITE_SETTINGS.legal, doc?.legal),
  };
});

export const getDeliverySettings = cache(async (): Promise<DeliverySettings> => {
  const doc = await sanityFetch<Partialish<DeliverySettings>>({ query: DELIVERY_SETTINGS_QUERY, tags: [CACHE_TAGS.delivery] });
  return pickDefined(DEFAULT_DELIVERY_SETTINGS, doc);
});

export const getDeliveryZones = cache(async (): Promise<DeliveryZone[]> => {
  const zones = await sanityFetch<DeliveryZone[]>({ query: DELIVERY_ZONES_QUERY, tags: [CACHE_TAGS.delivery] });
  return zones?.length ? zones : DEFAULT_DELIVERY_ZONES;
});

export const getCategories = cache(async (): Promise<Category[]> => {
  const categories = await sanityFetch<Category[]>({ query: CATEGORIES_QUERY, tags: [CACHE_TAGS.categories] });
  return categories?.length ? categories : DEFAULT_CATEGORIES;
});

export const getProducts = cache(async (category?: string): Promise<Product[]> => {
  const products = await sanityFetch<Product[]>({
    query: PRODUCTS_QUERY,
    params: { category: category ?? null },
    tags: [CACHE_TAGS.products],
  });
  return products ?? [];
});

export const getFeaturedProducts = cache(async (): Promise<Product[]> => {
  const products = await sanityFetch<Product[]>({ query: FEATURED_PRODUCTS_QUERY, tags: [CACHE_TAGS.products] });
  return products ?? [];
});

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  return sanityFetch<Product>({ query: PRODUCT_BY_SLUG_QUERY, params: { slug }, tags: [productTag(slug)] });
});

export const getRelatedProducts = cache(async (product: Product): Promise<Product[]> => {
  if (!product.category?._id) return [];
  const products = await sanityFetch<Product[]>({
    query: RELATED_PRODUCTS_QUERY,
    params: { categoryId: product.category._id, id: product._id },
    tags: [CACHE_TAGS.products],
  });
  return products ?? [];
});

export async function getProductSlugs(): Promise<{ slug: string; _updatedAt: string }[]> {
  return (await sanityFetch<{ slug: string; _updatedAt: string }[]>({ query: PRODUCT_SLUGS_QUERY, tags: [CACHE_TAGS.products] })) ?? [];
}

export const getPromotions = cache(async (): Promise<Promotion[]> => {
  const promotions = await sanityFetch<Promotion[]>({ query: PROMOTIONS_QUERY, tags: [CACHE_TAGS.promotions], revalidate: 300 });
  return promotions ?? [];
});

export const getLegalPage = cache(async (slug: string): Promise<LegalPage | null> => {
  return sanityFetch<LegalPage>({ query: LEGAL_PAGE_QUERY, params: { slug }, tags: [legalTag(slug)] });
});

/** Fresh, uncached reads for server-side price verification at checkout. */
export async function getProductsByIdsFresh(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  return (await sanityFetchFresh<Product[]>(PRODUCTS_BY_IDS_QUERY, { ids })) ?? [];
}

export async function getPromotionsFresh(): Promise<Promotion[]> {
  return (await sanityFetchFresh<Promotion[]>(PROMOTIONS_QUERY)) ?? [];
}

export async function getDeliveryZonesFresh(): Promise<DeliveryZone[]> {
  const zones = await sanityFetchFresh<DeliveryZone[]>(DELIVERY_ZONES_QUERY);
  return zones?.length ? zones : DEFAULT_DELIVERY_ZONES;
}
