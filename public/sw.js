/*
 * תנא משקאות – service worker for offline browsing.
 *
 * - Pages: network first (always fresh when online). A saved copy is used only when the network
 *   fails, and is marked as offline: prices and live "open now" badges are hidden, so a stale price
 *   or a wrong opening status is never shown.
 * - Never cached: cart, checkout and order pages (offline they show the offline page), APIs, the
 *   Studio and Sentry's tunnel.
 * - Hashed build assets: cache first. Images: stale-while-revalidate, bounded.
 * Bump VERSION to drop every old cache on the next visit.
 */
const VERSION = 'v1';
const PAGES = `tene-pages-${VERSION}`;
const ASSETS = `tene-assets-${VERSION}`;
const IMAGES = `tene-images-${VERSION}`;
const OFFLINE_URL = '/offline.html';
const MAX_PAGES = 40;
const MAX_ASSETS = 250;
const MAX_IMAGES = 150;
const NETWORK_TIMEOUT_MS = 8000;

const BYPASS = [/^\/api\//, /^\/studio/, /^\/monitoring/, /^\/_vercel/];
// Live pages: always from the network and never stored – offline they get the offline page instead.
const LIVE_PAGES = /\/(cart|checkout|order)(\/|$)/;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((cache) => cache.addAll([OFFLINE_URL, '/icons/icon-192.png']))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = [PAGES, ASSETS, IMAGES];
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith('tene-') && !keep.includes(key)).map((key) => caches.delete(key)));
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      await self.clients.claim();
    })(),
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i += 1) await cache.delete(keys[i]);
}

function cacheable(response) {
  return response && response.ok && response.type === 'basic';
}

const OFFLINE_TEXT = {
  he: 'אין חיבור לאינטרנט – זה עותק שמור. מחירים ומלאי יוצגו כשהחיבור יחזור, וההזמנה מתאפשרת רק עם חיבור.',
  en: "You're offline – this is a saved copy. Prices and availability return when you're back online; ordering needs a connection.",
};

/** CSS-only marker (no DOM changes, so React hydration is unaffected). */
async function markOffline(response, pathname) {
  const text = OFFLINE_TEXT[pathname.startsWith('/en') ? 'en' : 'he'];
  const style =
    '<style id="tene-offline">[data-price],[data-live-status]{visibility:hidden!important}' +
    `body::before{content:"${text}";position:sticky;top:0;z-index:1000;display:block;padding:10px 16px;` +
    'background:#cfa669;color:#140508;font:600 14px/1.5 Arial,sans-serif;text-align:center}</style>';
  const html = (await response.text()).replace('</head>', `${style}</head>`);
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  return new Response(html, { status: 200, statusText: 'OK', headers });
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function networkFirstPage(event, url) {
  const cache = await caches.open(PAGES);
  const cached = await cache.match(event.request, { ignoreVary: true });
  try {
    const network = (async () => (await event.preloadResponse) || fetch(event.request))();
    // With a saved copy available, don't let a hanging connection block the visitor forever.
    const response = cached ? await withTimeout(network, NETWORK_TIMEOUT_MS) : await network;
    if (cacheable(response) && /^\/(he|en)(\/|$)/.test(url.pathname)) {
      const copy = response.clone();
      event.waitUntil(cache.put(event.request, copy).then(() => trim(PAGES, MAX_PAGES)));
    }
    return response;
  } catch {
    if (cached) return markOffline(cached, url.pathname);
    return (await cache.match(OFFLINE_URL)) || Response.error();
  }
}

async function cacheFirst(event, cacheName, max) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(event.request);
  if (hit) return hit;
  const response = await fetch(event.request);
  if (cacheable(response)) {
    const copy = response.clone();
    event.waitUntil(cache.put(event.request, copy).then(() => trim(cacheName, max)));
  }
  return response;
}

async function staleWhileRevalidate(event, cacheName, max) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(event.request);
  const refresh = fetch(event.request)
    .then((response) => {
      if (cacheable(response)) {
        const copy = response.clone();
        event.waitUntil(cache.put(event.request, copy).then(() => trim(cacheName, max)));
      }
      return response;
    })
    .catch(() => hit || Response.error());
  return hit || refresh;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (BYPASS.some((pattern) => pattern.test(url.pathname))) return;
  // Next.js client-side navigations fetch RSC payloads; let them go straight to the network.
  if (request.headers.get('RSC') || url.searchParams.has('_rsc')) return;

  if (request.mode === 'navigate' && LIVE_PAGES.test(url.pathname)) {
    event.respondWith(fetch(request).catch(async () => (await caches.match(OFFLINE_URL)) || Response.error()));
  } else if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(event, url));
  } else if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/models/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(cacheFirst(event, ASSETS, MAX_ASSETS));
  } else if (url.pathname.startsWith('/_next/image') || url.pathname.startsWith('/images/')) {
    event.respondWith(staleWhileRevalidate(event, IMAGES, MAX_IMAGES));
  }
});
