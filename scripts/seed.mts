/**
 * Populates a fresh Sanity dataset with the store's base content.
 *
 *   npm run seed                  -> settings, delivery, categories, legal pages (never overwrites existing docs)
 *   npm run seed -- --with-samples -> also adds sample products and (inactive) gift-tier promotions
 *   npm run seed -- --force        -> overwrites the documents above with the defaults
 *
 * Requires NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET and SANITY_API_WRITE_TOKEN
 * in .env.local (or the environment).
 */
import { randomUUID } from 'node:crypto';
import { createClient, type SanityDocumentStub } from '@sanity/client';
import dotenv from 'dotenv';
import { LEGAL_CONTENT, LEGAL_SLUG_LIST, type LegalDocument } from '../src/content/legal';
import { DEFAULT_CATEGORIES, DEFAULT_DELIVERY_SETTINGS, DEFAULT_DELIVERY_ZONES, DEFAULT_SITE_SETTINGS } from '../src/lib/defaults';

dotenv.config({ path: ['.env.local', '.env'], quiet: true });

const args = new Set(process.argv.slice(2));
const withSamples = args.has('--with-samples');
const force = args.has('--force');

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !token) {
  console.error('✗ Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_API_WRITE_TOKEN. Fill .env.local first (see DEPLOYMENT.md).');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-09-01',
  useCdn: false,
});

const key = () => randomUUID().replace(/-/g, '').slice(0, 12);

type Block = Record<string, unknown>;

function textBlock(text: string, style: 'normal' | 'h2' = 'normal', listItem?: 'bullet'): Block {
  return {
    _type: 'block',
    _key: key(),
    style,
    markDefs: [],
    children: [{ _type: 'span', _key: key(), text, marks: [] }],
    ...(listItem ? { listItem, level: 1 } : {}),
  };
}

/** Tokens such as {phone} are kept as-is; the site fills them from Site Settings at render time. */
function toPortableText(doc: LegalDocument): Block[] {
  const blocks: Block[] = [];
  for (const section of doc.sections) {
    if (section.heading) blocks.push(textBlock(section.heading, 'h2'));
    for (const p of section.paragraphs ?? []) blocks.push(textBlock(p));
    for (const item of section.list ?? []) blocks.push(textBlock(item, 'normal', 'bullet'));
  }
  return blocks;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const docs: SanityDocumentStub[] = [];

const { geo, ...settingsRest } = DEFAULT_SITE_SETTINGS;
docs.push({
  _id: 'siteSettings',
  _type: 'siteSettings',
  ...settingsRest,
  geo: { _type: 'object', ...geo },
  openingHours: DEFAULT_SITE_SETTINGS.openingHours.map((d) => ({ _type: 'openingHoursDay', _key: `day-${d.day}`, ...d })),
});

docs.push({ _id: 'deliverySettings', _type: 'deliverySettings', ...DEFAULT_DELIVERY_SETTINGS });

for (const zone of DEFAULT_DELIVERY_ZONES) {
  const { _id, freeAbove, ...rest } = zone;
  docs.push({ _id: _id.replace('default-', ''), _type: 'deliveryZone', ...rest, ...(freeAbove ? { freeAbove } : {}) });
}

for (const cat of DEFAULT_CATEGORIES) {
  const { _id, slug, ...rest } = cat;
  docs.push({ _id: _id.replace('default-', ''), _type: 'category', ...rest, slug: { _type: 'slug', current: slug } });
}

for (const slug of LEGAL_SLUG_LIST) {
  const he = LEGAL_CONTENT.he[slug];
  const en = LEGAL_CONTENT.en[slug];
  docs.push({
    _id: `legal-${slug}`,
    _type: 'legalPage',
    slug,
    title: { he: he.title, en: en.title },
    updatedAt: he.updatedAt,
    body: {
      he: toPortableText(he),
      en: toPortableText(en),
    },
  });
}

if (withSamples) {
  const catRef = (slug: string) => ({ _type: 'reference', _ref: `cat-${slug === 'gift-baskets' ? 'gifts' : slug}` });
  const samples = [
    {
      title: { he: 'יין אדום יבש – קברנה סוביניון (דוגמה)', en: 'Dry Red – Cabernet Sauvignon (sample)' },
      kind: 'wine',
      category: catRef('wine'),
      price: 79.9,
      featured: true,
      volumeMl: 750,
      abv: 13.5,
      kashrut: { he: 'כשר למהדרין', en: 'Kosher Mehadrin' },
      wine: { grape: { he: 'קברנה סוביניון', en: 'Cabernet Sauvignon' }, sweetness: 'dry', mevushal: false },
    },
    {
      title: { he: 'יין לבן חצי יבש (דוגמה)', en: 'Semi-Dry White (sample)' },
      kind: 'wine',
      category: catRef('wine'),
      price: 49.9,
      featured: true,
      volumeMl: 750,
      abv: 11,
      wine: { sweetness: 'semiDry', mevushal: true },
    },
    {
      title: { he: 'וויסקי סינגל מאלט 12 (דוגמה)', en: 'Single Malt Whisky 12 (sample)' },
      kind: 'spirits',
      category: catRef('spirits'),
      price: 229,
      featured: true,
      volumeMl: 700,
      abv: 40,
      spirits: { spiritType: { he: 'וויסקי', en: 'Whisky' }, country: { he: 'סקוטלנד', en: 'Scotland' }, ageYears: 12 },
    },
    {
      title: { he: 'מארז יין ופרלינים (דוגמה)', en: 'Wine & Pralines Gift Box (sample)' },
      kind: 'gift',
      category: catRef('gift-baskets'),
      price: 189,
      featured: true,
      leadTimeHours: 24,
      gift: {
        includes: [
          { _key: key(), _type: 'localeString', he: 'בקבוק יין אדום', en: 'A bottle of red wine' },
          { _key: key(), _type: 'localeString', he: 'קופסת פרלינים', en: 'A box of pralines' },
          { _key: key(), _type: 'localeString', he: 'עטיפה וסרט', en: 'Wrapping and ribbon' },
        ],
        allowDedication: true,
        ribbonColors: ['gold', 'burgundy', 'silver'],
      },
    },
    {
      title: { he: 'בלון הליום עם כיתוב (דוגמה)', en: 'Helium Balloon with Text (sample)' },
      kind: 'balloons',
      category: catRef('balloons'),
      price: 35,
      balloons: { colors: ['gold', 'silver', 'pink', 'blue'], allowText: true },
    },
  ];
  for (const sample of samples) {
    const slug = slugify(sample.title.en.replace('(sample)', 'sample'));
    docs.push({ _id: `sample-${slug}`, _type: 'product', inStock: true, slug: { _type: 'slug', current: slug }, ...sample });
  }

  const tiers = [
    { amount: 300, he: 'סט הבדלה', en: 'Havdalah set' },
    { amount: 500, he: 'סט אביזרי יין', en: 'Wine accessories set' },
    { amount: 1000, he: 'דקנטר', en: 'Decanter' },
  ];
  for (const tier of tiers) {
    docs.push({
      _id: `promo-gift-${tier.amount}`,
      _type: 'promotion',
      title: { he: `מתנה בקנייה מעל ${tier.amount} ₪`, en: `Gift over ₪${tier.amount}` },
      kind: 'giftThreshold',
      threshold: tier.amount,
      giftDescription: { he: tier.he, en: tier.en },
      active: false,
    });
  }
}

async function main() {
  const tx = client.transaction();
  for (const doc of docs) {
    if (force) tx.createOrReplace(doc as SanityDocumentStub & { _id: string });
    else tx.createIfNotExists(doc as SanityDocumentStub & { _id: string });
  }
  await tx.commit({ visibility: 'sync' });
  console.log(`✓ Seeded ${docs.length} documents into ${projectId}/${dataset}${force ? ' (overwritten)' : ' (existing documents kept)'}.`);
  if (withSamples) console.log('  Sample products end with "(דוגמה)" – delete them before launch. Gift-tier promotions were created inactive.');
}

main().catch((error: unknown) => {
  console.error('✗ Seed failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
