import { revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { parseBody } from 'next-sanity/webhook';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { requestIp } from '@/lib/server/secrets';
import { CACHE_TAGS, legalTag, productTag } from '@/sanity/lib/fetch';

/**
 * On-demand revalidation from the Sanity webhook. Configure the webhook projection as:
 *   {_type, "slug": slug.current, "previousSlug": before().slug.current}
 * so a product edit refreshes only that product's page plus the listings that show it.
 */
interface WebhookBody {
  _type?: string;
  slug?: string | null;
  previousSlug?: string | null;
}

function tagsFor(body: WebhookBody): string[] {
  const slugs = [body.slug, body.previousSlug].filter((s): s is string => Boolean(s));
  switch (body._type) {
    case 'product':
      return [CACHE_TAGS.products, ...slugs.map(productTag)];
    case 'category':
      // Navigation, category pages and product listings; individual product pages refresh on their own schedule.
      return [CACHE_TAGS.categories, CACHE_TAGS.products];
    case 'promotion':
      return [CACHE_TAGS.promotions];
    case 'siteSettings':
      return [CACHE_TAGS.settings];
    case 'deliverySettings':
    case 'deliveryZone':
      return [CACHE_TAGS.delivery];
    case 'legalPage':
      return slugs.length ? slugs.map(legalTag) : [CACHE_TAGS.legal];
    default:
      return [];
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) {
    console.error('[revalidate] SANITY_REVALIDATE_SECRET is not set');
    return NextResponse.json({ message: 'Not configured' }, { status: 500 });
  }
  if (!(await checkRateLimit('webhook', requestIp(request)))) {
    return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
  }

  try {
    const { isValidSignature, body } = await parseBody<WebhookBody>(request, secret, true);
    if (!isValidSignature) return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
    const tags = body ? [...new Set(tagsFor(body))] : [];
    if (!tags.length) return NextResponse.json({ message: 'Ignored', type: body?._type ?? null });
    for (const tag of tags) revalidateTag(tag, { expire: 0 });
    return NextResponse.json({ revalidated: tags, now: Date.now() });
  } catch (error) {
    console.error('[revalidate] failed', error);
    return NextResponse.json({ message: 'Bad request' }, { status: 400 });
  }
}
