# תנא משקאות – Tene Mashkaot

Online store for Tene Mashkaot, a drinks boutique at 4 Shimon Ben Shetach St., Elad.
Hebrew-first (RTL) with an English version, a scroll-driven 3D pouring hero, and orders fulfilled via Sanity, e-mail and WhatsApp.

**Deployment guide (Hebrew, step by step): [DEPLOYMENT.md](./DEPLOYMENT.md)**

## Stack

- **Next.js 16** (App Router, Turbopack, `proxy.ts` with a nonce-based CSP) + **React 19** + **TypeScript**
- **Tailwind CSS 4**, **motion** for UI animation
- **React Three Fiber / drei / three** – the single 3D element (hero), lazy-loaded only on capable devices with an SVG poster fallback
- **Sanity** – catalog, promotions, settings, legal pages, and storage for orders and event inquiries (embedded Studio at `/studio`)
- **next-intl** – `he` (default) and `en`
- **Resend** (order e-mails), **Cloudflare Turnstile** (bot protection), **Upstash** (rate limiting), **Vercel Analytics**
- **@hebcal/core** – Shabbat and Yom Tov times for Elad (ordering is blocked during Shabbat and holidays)

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server on http://localhost:3000 |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` / `npm run typecheck` | ESLint and TypeScript checks |
| `npm run seed` | Seeds Sanity with settings, delivery, categories and legal pages (`--with-samples`, `--force`) |

## Structure

```
src/
  app/[locale]/        pages: home, shop, product, cart, checkout, order, events, visit, legal
  app/studio/          embedded Sanity Studio
  app/api/revalidate/  Sanity webhook → cache-tag revalidation
  actions/             server actions: price quote, order placement, event inquiry
  components/          UI (hero/ = 3D + poster, motion/, shop/, checkout/, layout/ …)
  content/legal.ts     built-in legal texts (fallback when Sanity has none)
  lib/                 pricing, schedule (hours/Shabbat/slots), validation, data access
  sanity/              schemas, Studio structure, clients
messages/              he.json, en.json
public/models/         optimized GLB (Meshopt) of the bottle and glass
scripts/               seed, 3D model optimization helpers
```

## Key design decisions

- **Prices are computed only on the server** (`actions/checkout.ts`): the client sends product IDs, quantities and options; totals, promotions, coupons and delivery fees are recalculated from fresh Sanity data.
- **Every CMS value has a built-in default** (`lib/defaults.ts`), so the site renders before Sanity is populated and stays up if Sanity is unreachable.
- **Order resilience:** an order is saved to Sanity *and* e-mailed. If either fails the other still delivers it, and the customer always gets a one-tap WhatsApp copy of the order.
- **Accessibility:** WCAG 2.1 AA / IS 5568 – skip link, focus management, reduced-motion support (the 3D scene is replaced by a static poster), and an accessibility menu (text size, contrast, underlined links, readable font, stop animations).
- **Legal compliance:** age gate (18+), alcohol warning on every page, no ordering during Shabbat or Yom Tov, and delivery slots only within store hours and never after 23:00 (alcohol sales are prohibited 23:00–06:00).

## 3D hero: asset pipeline and performance

The pour scene (`src/components/hero/HeroCanvas.tsx`) is built to stay smooth on mid-range phones:

- **On-demand rendering** – frames are drawn only while something moves (scroll, the damped camera glide, the pour itself). An idle page costs the GPU nothing, and nothing renders while the section is off screen.
- **Warm-up before reveal** – every shader is compiled (`compileAsync`) and every texture uploaded, one per frame, while the SVG poster is still showing, so the reveal and the first scroll never hitch.
- **Quality tiers** – desktop-class machines get refractive glass (transmission pass at half resolution); phones, tablets and smaller laptops get a reflective glass without the extra pass. DPR is capped (1.6 / 1.35), and a one-way guard drops to the light tier once if real frames average below ~38 fps (no oscillation).
- **Budget** – ~160K triangles and ~2.2MB of models in total (from ~494K / 6.9MB), four lights, a one-time environment map.

Rebuilding the models from the Sketchfab sources:

```bash
node scripts/build-pour-model.mjs <bottle_of_red_wine.glb> <wine_glass.glb>   # bottle + glass + wine volume
npm run optimize:hero   # error-bounded simplification of the room, side table and bottle
npm run label           # applies scripts/label/label.webp (source: scripts/label/label.html) to the bottle
```

After changing a model, bump the `?v=` query in `MODEL_URL` (`src/lib/defaults.ts`) or `ROOM_URL` / `ROSE_URL` (`HeroCanvas.tsx`) so browsers don't keep a cached copy.

Store photos are developed from the original captures with `python3 scripts/enhance-photos.py <mapping.json> <originals-dir> public/images/store` (luminance levels, gentle white balance, clarity, sharpening). Fonts (Heebo, Suez One) are self-hosted in `src/app/fonts/`, so builds never depend on Google Fonts.
