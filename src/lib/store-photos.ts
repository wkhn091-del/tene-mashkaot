import type { CategoryKind } from './types';

export interface StorePhoto {
  src: string;
  width: number;
  height: number;
  alt: { he: string; en: string };
}

export const STORE_PHOTOS = {
  wineAisle: {
    src: '/images/store/store-wine-aisle.webp',
    width: 576,
    height: 1024,
    alt: { he: 'מעבר היינות בחנות תנא משקאות באלעד', en: 'The wine aisle at Tene Mashkaot in Elad' },
  },
  wineCounter: {
    src: '/images/store/store-wine-counter.webp',
    width: 1024,
    height: 576,
    alt: {
      he: 'דלפק עם כוס יין ובקבוקים במעמדי אקריליק מול מדפי היינות',
      en: 'A counter with a wine glass and bottles in acrylic holders in front of the wine shelves',
    },
  },
  dolmenBarrel: {
    src: '/images/store/store-dolmen-barrel.webp',
    width: 576,
    height: 1024,
    alt: { he: 'חבית יין עם בקבוקי דולמן בכניסה לחנות', en: 'A wine barrel with Dolmen bottles at the store entrance' },
  },
  turaBarrel: {
    src: '/images/store/store-tura-barrel.webp',
    width: 576,
    height: 1024,
    alt: { he: 'יינות יקב טורא על חבית במרכז החנות', en: 'Tura winery wines on a barrel in the middle of the store' },
  },
  bartenura: {
    src: '/images/store/store-bartenura.webp',
    width: 576,
    height: 1024,
    alt: { he: 'תצוגת ברטנורה מוסקטו ורוזטו על חבית', en: 'A Bartenura Moscato and Rosato display on a barrel' },
  },
  daatZkenim: {
    src: '/images/store/store-daat-zkenim.webp',
    width: 576,
    height: 1024,
    alt: { he: 'בקבוק יין דעת זקנים וכוס יין על הדלפק', en: 'A bottle of Daat Zkenim wine and a wine glass on the counter' },
  },
  wineryFair: {
    src: '/images/store/store-winery-fair.webp',
    width: 576,
    height: 1024,
    alt: { he: 'עמדת טעימות ביריד היקבים בתנא משקאות', en: 'A tasting station at the Tene Mashkaot winery fair' },
  },
  balloons: {
    src: '/images/store/store-balloons.webp',
    width: 768,
    height: 1024,
    alt: { he: 'זר בלוני הליום ליום הולדת בחנות', en: 'A bouquet of birthday helium balloons in the store' },
  },
  barrel: {
    src: '/images/store/store-barrel.webp',
    width: 576,
    height: 1024,
    alt: { he: 'חבית יין עם בקבוקי יין נבחרים במרכז החנות', en: 'A wine barrel with selected bottles in the middle of the store' },
  },
  wineIsland: {
    src: '/images/store/store-wine-island.webp',
    width: 576,
    height: 1024,
    alt: { he: 'אי תצוגה עמוס בקבוקי יין', en: 'A display island stacked with wine bottles' },
  },
  kiddush: {
    src: '/images/store/store-kiddush.webp',
    width: 576,
    height: 1024,
    alt: { he: 'מזרקות קידוש מזכוכית על רקע מדפי היין', en: 'Glass kiddush fountains in front of the wine shelves' },
  },
  wineWall: {
    src: '/images/store/store-wine-wall.webp',
    width: 576,
    height: 1024,
    alt: { he: 'קיר יינות כשרים מיקבים מובחרים', en: 'A wall of kosher wines from leading wineries' },
  },
  spirits: {
    src: '/images/store/store-spirits-wall.webp',
    width: 576,
    height: 1024,
    alt: { he: 'קיר משקאות חריפים: וויסקי, רום, וודקה וליקרים', en: 'A wall of spirits: whisky, rum, vodka and liqueurs' },
  },
  giftBasket: {
    src: '/images/store/store-gift-basket.webp',
    width: 576,
    height: 1024,
    alt: { he: 'סלסלת מתנה לבן-זהב עם יין, שוקולד ושושנים', en: 'A white-and-gold gift basket with wine, chocolate and roses' },
  },
  giftBasketRed: {
    src: '/images/store/store-gift-basket-red.webp',
    width: 576,
    height: 1024,
    alt: { he: 'סלסלת מתנה עם מוסקטו, כוסות ושוקולדים וסרט אדום', en: 'A gift basket with Moscato, glasses and chocolates and a red ribbon' },
  },
  pralines: {
    src: '/images/store/store-pralines.webp',
    width: 576,
    height: 1024,
    alt: {
      he: 'מארזי פרלינים, עוגות שוקולד על מקל וממתקים עטופים',
      en: 'Praline boxes, chocolate cake pops and wrapped sweets',
    },
  },
  giftWhisky: {
    src: '/images/store/store-gift-whisky.webp',
    width: 576,
    height: 1024,
    alt: { he: 'מארז מתנה: בקבוק וויסקי עם פרלינים וסרט זהב', en: 'Gift pack: a bottle of whisky with pralines and a gold ribbon' },
  },
  giftWine: {
    src: '/images/store/store-gift-wine.webp',
    width: 576,
    height: 1024,
    alt: { he: 'מארז מתנה: יין, בקבוקון ושוקולד עם סרט סגול', en: 'Gift pack: wine, a miniature and chocolate with a purple ribbon' },
  },
  judaica: {
    src: '/images/store/store-judaica-shelf.webp',
    width: 1024,
    height: 576,
    alt: { he: 'מדף יודאיקה: גביעי קידוש, קנקנים ומתנות', en: 'Judaica shelf: kiddush cups, decanters and gifts' },
  },
} satisfies Record<string, StorePhoto>;

export const GALLERY: StorePhoto[] = [
  STORE_PHOTOS.wineAisle,
  STORE_PHOTOS.giftBasket,
  STORE_PHOTOS.dolmenBarrel,
  STORE_PHOTOS.wineCounter,
  STORE_PHOTOS.spirits,
  STORE_PHOTOS.balloons,
  STORE_PHOTOS.pralines,
  STORE_PHOTOS.kiddush,
  STORE_PHOTOS.turaBarrel,
  STORE_PHOTOS.judaica,
  STORE_PHOTOS.daatZkenim,
  STORE_PHOTOS.giftBasketRed,
  STORE_PHOTOS.bartenura,
  STORE_PHOTOS.wineryFair,
  STORE_PHOTOS.wineIsland,
  STORE_PHOTOS.giftWhisky,
  STORE_PHOTOS.wineWall,
];

/** Store photos used as category artwork until category images are uploaded. */
export const CATEGORY_PHOTOS: Partial<Record<CategoryKind, StorePhoto>> = {
  wine: STORE_PHOTOS.wineAisle,
  spirits: STORE_PHOTOS.spirits,
  gift: STORE_PHOTOS.giftBasket,
  balloons: STORE_PHOTOS.balloons,
  sweets: STORE_PHOTOS.pralines,
  judaica: STORE_PHOTOS.judaica,
};
