import type { SchemaTypeDefinition } from 'sanity';
import { localeBlock, localeString, localeText } from './objects/locale';
import { openingHoursDay } from './objects/openingHoursDay';
import { siteSettings } from './documents/siteSettings';
import { deliverySettings } from './documents/deliverySettings';
import { deliveryZone } from './documents/deliveryZone';
import { category } from './documents/category';
import { product } from './documents/product';
import { promotion } from './documents/promotion';
import { order } from './documents/order';
import { eventInquiry } from './documents/eventInquiry';
import { legalPage } from './documents/legalPage';

export const SINGLETON_TYPES = ['siteSettings', 'deliverySettings'] as const;

export const schemaTypes: SchemaTypeDefinition[] = [
  localeString,
  localeText,
  localeBlock,
  openingHoursDay,
  siteSettings,
  deliverySettings,
  deliveryZone,
  category,
  product,
  promotion,
  order,
  eventInquiry,
  legalPage,
];
