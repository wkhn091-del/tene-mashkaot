import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/he',
    name: 'תנא משקאות – אלעד',
    short_name: 'תנא משקאות',
    description: 'חנות המשקאות של אלעד: יינות, אלכוהול ומארזי מתנה במשלוח.',
    start_url: '/he?source=pwa',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    dir: 'rtl',
    lang: 'he',
    background_color: '#140508',
    theme_color: '#140508',
    categories: ['shopping', 'food'],
    icons: [
      { src: '/icons/icon-192.png', type: 'image/png', sizes: '192x192', purpose: 'any' },
      { src: '/icons/icon-512.png', type: 'image/png', sizes: '512x512', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', type: 'image/png', sizes: '512x512', purpose: 'maskable' },
      { src: '/icon.svg', type: 'image/svg+xml', sizes: 'any' },
    ],
    shortcuts: [
      { name: 'לחנות', short_name: 'חנות', url: '/he/shop', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'הסל שלי', short_name: 'סל', url: '/he/cart', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'שעות וכתובת', short_name: 'ביקור', url: '/he/visit', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
  };
}
