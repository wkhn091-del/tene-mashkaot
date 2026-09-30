import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { requestIp } from '@/lib/server/secrets';
import { getReadClient } from '@/sanity/lib/client';

/**
 * Uptime endpoint for an external monitor (cron-job.org every 10 minutes). On sleeping free hosts it
 * also keeps the server warm. `?deep=1` additionally checks Sanity, so a CMS outage is reported too.
 */
export const dynamic = 'force-dynamic';

const HEADERS = { 'Cache-Control': 'no-store, max-age=0', 'X-Robots-Tag': 'noindex' };

async function checkSanity(): Promise<'ok' | 'error' | 'skipped'> {
  const client = getReadClient();
  if (!client) return 'skipped';
  try {
    await Promise.race([
      client.fetch('count(*[_id == "siteSettings"])', {}, { cache: 'no-store' }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000)),
    ]);
    return 'ok';
  } catch {
    return 'error';
  }
}

async function handle(request: NextRequest, withBody: boolean) {
  if (!(await checkRateLimit('health', requestIp(request)))) {
    return new NextResponse(null, { status: 429, headers: { ...HEADERS, 'Retry-After': '60' } });
  }
  const deep = request.nextUrl.searchParams.get('deep') === '1';
  const checks = { app: 'ok', sanity: deep ? await checkSanity() : 'skipped' };
  const healthy = checks.sanity !== 'error';
  const status = healthy ? 200 : 503;
  if (!withBody) return new NextResponse(null, { status, headers: HEADERS });
  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      time: new Date().toISOString(),
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      region: process.env.VERCEL_REGION ?? null,
      checks,
    },
    { status, headers: HEADERS },
  );
}

export function GET(request: NextRequest) {
  return handle(request, true);
}

export function HEAD(request: NextRequest) {
  return handle(request, false);
}
