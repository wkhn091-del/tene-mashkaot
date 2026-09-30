import { defineQuery } from 'next-sanity';

const CATEGORY_REF = `{ _id, title, "slug": slug.current, kind }`;

const PRODUCT_CARD_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  "kind": coalesce(kind, category->kind, "other"),
  "category": category->${CATEGORY_REF},
  price,
  images,
  shortDescription,
  "inStock": coalesce(inStock, true),
  featured,
  leadTimeHours,
  kashrut,
  volumeMl,
  abv,
  wine,
  spirits,
  gift,
  balloons`;

const PRODUCT_CARD = `{${PRODUCT_CARD_FIELDS}}`;

const PRODUCT_FULL = `{${PRODUCT_CARD_FIELDS},
  description}`;

export const SITE_SETTINGS_QUERY = defineQuery(`*[_id == "siteSettings"][0]`);

export const DELIVERY_SETTINGS_QUERY = defineQuery(`*[_id == "deliverySettings"][0]`);

export const DELIVERY_ZONES_QUERY = defineQuery(
  `*[_type == "deliveryZone" && active != false] | order(order asc, city.he asc) { _id, city, fee, minOrder, freeAbove, "active": coalesce(active, true), order }`,
);

export const CATEGORIES_QUERY = defineQuery(
  `*[_type == "category" && defined(slug.current)] | order(order asc, title.he asc) { _id, title, "slug": slug.current, kind, description, image, order }`,
);

export const PRODUCTS_QUERY = defineQuery(
  `*[_type == "product" && defined(slug.current) && (!defined($category) || category->slug.current == $category)] | order(inStock desc, featured desc, title.he asc) ${PRODUCT_CARD}`,
);

export const FEATURED_PRODUCTS_QUERY = defineQuery(
  `*[_type == "product" && defined(slug.current) && featured == true] | order(inStock desc, _updatedAt desc)[0...8] ${PRODUCT_CARD}`,
);

export const PRODUCT_BY_SLUG_QUERY = defineQuery(`*[_type == "product" && slug.current == $slug][0] ${PRODUCT_FULL}`);

export const RELATED_PRODUCTS_QUERY = defineQuery(
  `*[_type == "product" && defined(slug.current) && category._ref == $categoryId && _id != $id && inStock != false] | order(featured desc)[0...4] ${PRODUCT_CARD}`,
);

export const PRODUCTS_BY_IDS_QUERY = defineQuery(`*[_type == "product" && _id in $ids] ${PRODUCT_FULL}`);

export const PRODUCT_SLUGS_QUERY = defineQuery(`*[_type == "product" && defined(slug.current)]{ "slug": slug.current, _updatedAt }`);

export const PROMOTIONS_QUERY = defineQuery(
  `*[_type == "promotion" && active != false] {
    _id, title, badge, kind, "scope": coalesce(scope, "all"),
    "categoryIds": categories[]._ref,
    "productIds": products[]._ref,
    percent, fixedPrice, threshold, giftDescription,
    code, couponType, couponValue, minSubtotal, startsAt, endsAt,
    "active": coalesce(active, true)
  }`,
);

export const LEGAL_PAGE_QUERY = defineQuery(`*[_type == "legalPage" && slug == $slug] | order(_updatedAt desc)[0] { slug, title, body, updatedAt }`);
