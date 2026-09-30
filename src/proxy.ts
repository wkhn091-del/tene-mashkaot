import { NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const handleI18nRouting = createIntlMiddleware(routing);

/** Sentry CSP report endpoint derived from the public DSN (https://<key>@<host>/<project>). */
function sentryReportUri(): string | null {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return null;
  try {
    const url = new URL(dsn);
    const project = url.pathname.replace(/\//g, '');
    return `https://${url.host}/api/${project}/security/?sentry_key=${url.username}`;
  } catch {
    return null;
  }
}

const GA = 'https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com';
const META = 'https://connect.facebook.net https://www.facebook.com';

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV !== 'production';
  const directives = [
    "default-src 'self'",
    // 'wasm-unsafe-eval' is required by the Meshopt decoder used for the 3D model.
    // Host sources are the CSP2 fallback; CSP3 browsers rely on the nonce + 'strict-dynamic'.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval' https://www.googletagmanager.com https://connect.facebook.net${isDev ? " 'unsafe-eval'" : ''}`,
    // React renders style attributes (motion, layout); inline <style> injection is not user-controlled.
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https://cdn.sanity.io ${GA} https://www.facebook.com`,
    "font-src 'self'",
    // blob:/data: let GLTFLoader decode the model's embedded textures.
    `connect-src 'self' blob: data: https://challenges.cloudflare.com ${GA} ${META}`,
    'frame-src https://challenges.cloudflare.com https://www.google.com',
    "worker-src 'self' blob:",
    "media-src 'self' https://cdn.sanity.io",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  if (!isDev) directives.push('upgrade-insecure-requests');
  const reportUri = sentryReportUri();
  if (reportUri) directives.push(`report-uri ${reportUri}`);
  return directives.join('; ');
}

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = buildCsp(nonce);

  const headers = new Headers(request.headers);
  headers.set('x-nonce', nonce);
  headers.set('Content-Security-Policy', csp);

  const response = handleI18nRouting(new NextRequest(request, { headers })) ?? NextResponse.next({ request: { headers } });

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Frame-Options', 'DENY');
  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!api|studio|monitoring|_next/static|_next/image|_vercel|models|images|favicon.ico|icon.svg|apple-icon.png|robots.txt|sitemap.xml|manifest.webmanifest|og.png|.*\\..*).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
