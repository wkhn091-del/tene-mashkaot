import type { PortableTextBlock } from '@portabletext/react';

export type LocaleString = { he?: string; en?: string };
export type LocaleBlock = { he?: PortableTextBlock[]; en?: PortableTextBlock[] };

export interface SanityImage {
  _type?: 'image';
  asset?: { _ref: string; _type?: 'reference' };
  alt?: LocaleString;
  hotspot?: { x: number; y: number; height: number; width: number };
  crop?: { top: number; bottom: number; left: number; right: number };
}

export const CATEGORY_KINDS = ['wine', 'spirits', 'gift', 'balloons', 'sweets', 'judaica', 'other'] as const;
export type CategoryKind = (typeof CATEGORY_KINDS)[number];

export const RIBBON_COLORS = ['gold', 'purple', 'burgundy', 'silver', 'white', 'red', 'blue'] as const;
export type RibbonColor = (typeof RIBBON_COLORS)[number];

export const BALLOON_COLORS = ['gold', 'silver', 'white', 'pink', 'blue', 'red', 'black', 'mixed'] as const;
export type BalloonColor = (typeof BALLOON_COLORS)[number];

export const WINE_SWEETNESS = ['dry', 'semiDry', 'sweet'] as const;
export type WineSweetness = (typeof WINE_SWEETNESS)[number];

export interface CategoryRef {
  _id: string;
  title: LocaleString;
  slug: string;
  kind: CategoryKind;
}

export interface Category extends CategoryRef {
  description?: LocaleString;
  image?: SanityImage;
  order?: number;
}

export interface Product {
  _id: string;
  title: LocaleString;
  slug: string;
  kind: CategoryKind;
  category: CategoryRef | null;
  price: number;
  images?: SanityImage[];
  shortDescription?: LocaleString;
  description?: LocaleBlock;
  inStock: boolean;
  featured?: boolean;
  leadTimeHours?: number;
  kashrut?: LocaleString;
  volumeMl?: number;
  abv?: number;
  wine?: {
    winery?: LocaleString;
    series?: LocaleString;
    grape?: LocaleString;
    vintage?: number;
    sweetness?: WineSweetness;
    mevushal?: boolean;
  };
  spirits?: {
    spiritType?: LocaleString;
    country?: LocaleString;
    ageYears?: number;
  };
  gift?: {
    includes?: LocaleString[];
    allowDedication?: boolean;
    ribbonColors?: RibbonColor[];
  };
  balloons?: {
    colors?: BalloonColor[];
    allowText?: boolean;
  };
}

export type PromotionKind = 'percentOff' | 'fixedPrice' | 'giftThreshold' | 'coupon';

export interface Promotion {
  _id: string;
  title: LocaleString;
  badge?: LocaleString;
  kind: PromotionKind;
  scope: 'all' | 'categories' | 'products';
  categoryIds?: string[];
  productIds?: string[];
  percent?: number;
  fixedPrice?: number;
  threshold?: number;
  giftDescription?: LocaleString;
  code?: string;
  couponType?: 'percent' | 'amount';
  couponValue?: number;
  minSubtotal?: number;
  startsAt?: string;
  endsAt?: string;
  active: boolean;
}

export interface DeliveryZone {
  _id: string;
  city: LocaleString;
  fee: number;
  minOrder: number;
  freeAbove?: number | null;
  active: boolean;
  order?: number;
}

export interface OpeningHoursDay {
  /** 0 = Sunday ... 6 = Saturday */
  day: number;
  closed: boolean;
  open?: string;
  close?: string;
}

export interface SiteSettings {
  name: LocaleString;
  slogan: LocaleString;
  logo?: SanityImage;
  phone: string;
  whatsapp: string;
  whatsappGroupUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  googleReviewsUrl?: string;
  email?: string;
  address: LocaleString;
  city: LocaleString;
  geo: { lat: number; lng: number };
  openingHours: OpeningHoursDay[];
  /** Minutes after Shabbat/Yom Tov ends before the store reopens. */
  openAfterShabbatMinutes: number;
  /** Closing time on Fridays and holiday eves, e.g. "14:00". */
  eveCloseTime: string;
  kashrut?: LocaleString;
  kashrutCertificate?: SanityImage;
  announcement?: { enabled: boolean; text?: LocaleString; href?: string };
  alcoholWarning: LocaleString;
  legal: {
    businessName?: string;
    businessId?: string;
    accessibilityCoordinatorName?: string;
    accessibilityCoordinatorPhone?: string;
    accessibilityCoordinatorEmail?: string;
    physicalAccessibility?: LocaleString;
  };
  modelCredit?: string;
}

export interface DeliverySettings {
  slotMinutes: number;
  sameDayBufferMinutes: number;
  defaultLeadTimeHours: number;
  preShabbatBufferMinutes: number;
  daysAhead: number;
  /** Latest delivery end time allowed by law for alcohol sales. */
  lastDeliveryTime: string;
  closedDates: string[];
  pickupEnabled: boolean;
}

export interface LegalPage {
  slug: string;
  title: LocaleString;
  body?: LocaleBlock;
  updatedAt?: string;
}
