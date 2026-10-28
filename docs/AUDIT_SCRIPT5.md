# סקריפט 5 — ביקורת איכות (מקומי, ללא push)

**תאריך התחלה:** 2026-10-28  
**אתר חי:** https://tene-mashkaot.vercel.app  
**כלל עבודה:** ביקורת + תיקונים מקומיים בלבד עד אישור מפורש ל־git push.  
**הקשר BRIEF:** סקריפט 1 סומן כהושלם; Tier 3 R3F; בלי Faceted/1+1/Lenis/Clerk; פורטל הזמנות קל.

---

## שלב 0 — חומרים שנאספו

| פריט | סטטוס | נתיב |
|------|--------|------|
| PROJECT_BRIEF.md | ✅ | `PROJECT_BRIEF.md` |
| next.config | ✅ | `next.config.ts` |
| Middleware / proxy | ✅ | `src/proxy.ts` (אין `middleware.ts` נפרד) |
| .env.example | ✅ | `.env.example` |
| Sanity schemas | ✅ | `src/sanity/schemaTypes/` |
| Hero / Cart / Footer | ✅ | `src/components/hero`, `cart`, `layout` |
| DEPLOYMENT | ✅ | `DEPLOYMENT.md` |
| `/docs/asset-licenses.md` | ❌ חסר קובץ ייעודי | רישוי ב־`src/lib/defaults.ts` (`MODEL_SOURCES`) + עמוד תנאים |
| מפת תנועה נפרדת | ⚠️ | אין מסמך; מיושם ב־Hero/Pour |
| מטריצת לוגיקה עסקית | ✅ | `PROJECT_BRIEF.md` §4 (P1–P12) |

---

## סקריפט 1 — מודול א׳ (Core)

| # | דרישה | סטטוס | ראיה | תיקון נדרש |
|---|--------|--------|------|------------|
| 1.1 | Tier מיושם | ✅ | BRIEF: Tier 3; `HeroCanvas.tsx` R3F; לא Sequence | — (פער Path C baked מתועד כמאושר־חלקי) |
| 1.2 | מותג עקבי | ✅ | `globals.css` wine/gold/cream; `fonts.ts` Suez One + Heebo | — |
| 1.3 | Product variants / מלאי אטומי | ⚠️ מכוון | BRIEF נעול: מוצר=מחיר אחד, `inStock` בוליאני; אין variants SKU; `product.ts` | לא לבנות variants בלי פתיחת נעילה |
| 1.4 | Faceted Search | ⚠️ מכוון | BRIEF: קטגוריה+חיפוש+מיון בלבד; `ShopView`/`ProductBrowser` | לא Faceted בלי אישור |
| 1.5 | מנוע מבצעים 1+1 | ⚠️ מכוון | BRIEF: percentOff/fixedPrice/giftThreshold/coupon; בלי 1+1; `pricing.ts` | — |
| 1.6 | Zustand cart | ⚠️ מכוון | BRIEF: CartProvider+localStorage; `CartProvider.tsx` — מזהים+כמויות+snapshot תצוגה; מחיר אמת בשרת | סטטוס: תואם החלטה; לא Zustand |
| 1.7 | נכסים מקומיים/Sanity | ✅ | `cdn.sanity.io` + `/public/models`, `/images` | — |
| 1.8 | אנימציות Tier | ⚠️ | motion + R3F; אין Lenis (נדחה BRIEF) | מדידת 60FPS במובייל נדרשת בשטח |
| 1.9 | עמודים משפטיים | ✅ | `src/content/legal.ts`, `legal/[slug]` | — |
| 1.10 | 18+ / מחיר ל־100 מ״ל | ✅ | AgeGate; `PriceTag` per100ml | — |
| 1.11 | שליחת הזמנות | ✅ | `notify.ts` Resend + WhatsApp | — |
| 1.12 | משלוח דינמי בשרת | ✅ | `computeCart` + zones ב־`checkout.ts` | — |
| 1.13 | SB1 מחירים בשרת | ✅ | `placeOrder`/`getQuote` → `computeCart` | — |
| 1.14 | SB2 ללא PII בעגלה | ✅ | `tene_cart_v1` — productId/qty/options/snapshot | — |
| 1.15 | SB3 server-only | ✅ | `src/lib/server/*`, `data.ts`, `secrets.ts` | ולידציית env Zod בעלייה — לבדוק בהמשך 3.9 |
| 1.16 | SB4 GROQ params | ✅ | `queries.ts` `$slug`, `$category` | — |
| 1.17 | SB5 Zod | ✅ | `validation.ts` + actions | — |
| 1.18 | SB6 XSS | ⚠️ | JSON-LD דרך `jsonLd()` עם `\u003c`; אין DOMPurify ל־RichText — לבדוק | סריקת RichText |
| 1.19 | SB7 Authorization | ⚠️ | אין Clerk; `/orders` לפי מספר+טלפון אחיד; IDOR מודל login לא רלוונטי | פורטל קל מאושר |
| 1.20 | SB8 lockfile / Next | ✅ | `package-lock.json`; next `16.3.7` | npm audit ב־CI — פתוח |
| 1.21 | מסמך ארכיטקטורה | ✅ | BRIEF שלב 2 | — |
| 1.22 | הוראות פריסה | ✅ | `DEPLOYMENT.md` | — |
| 1.23 | קוד נקי | ⚠️ | יש לבדוק TODO/FIXME בסריקה | סריקה בהמשך |
| 1.24 | Error boundaries | ✅ | `error.tsx`, `global-error.tsx` | — |

### מודול א׳־2

| # | דרישה | סטטוס | ראיה | תיקון |
|---|--------|--------|------|-------|
| 1.25 | לוגו/favicon/OG | ✅ | `Logo`, icons, og routes | — |
| 1.26 | Signature + פונטים | ✅ | LiquidFill / pour Hero; Suez+Heebo | — |
| 1.27 | Design tokens | ⚠️ | CSS variables ב־globals; יש ערכים שרירותיים אפשריים | ספירת `text-[` בהמשך |
| 1.28–1.30 | מיקרו־קופי / Anti-AI / מפת מסרים | ⚠️ | messages he/en + BRIEF; אין Copy Deck נפרד | תיעוד Copy Deck אופציונלי |

### מודול א׳־3

| # | דרישה | סטטוס | ראיה | תיקון |
|---|--------|--------|------|-------|
| 1.31 | Lenis | ⚠️ מכוון | BRIEF: לא נבנה | — |
| 1.32 | Magnetic cursor | ⚠️ מכוון | BRIEF: לא | — |
| 1.33 | SplitText מלא | ⚠️ מכוון | יש LiquidFillText חלקי | — |
| 1.34 | LCP Eager | ✅ | Hero Image `preload` / eager | — |
| 1.35 | reduced-motion | ✅ | `globals.css` + `A11yProvider` | — |

### מודול 3D

| # | דרישה | סטטוס | ראיה | תיקון |
|---|--------|--------|------|-------|
| 1.36 | נימוק מכירתי | ✅ | BRIEF קבוצה 3 | — |
| 1.37 | Poster → lazy canvas | ✅ | `HeroVisual` / `HeroPoster` | — |
| 1.38 | Image Sequence worker | ⚠️ מכוון | Path A לא נבחר | — |
| 1.39 | DRACO + baked + dispose | ❌/⚠️ | `useGLTF(..., false, true)` — לא DRACO מפורש; Environment/Lightformer דינמיים; dispose לא נמצא ב־grep | שיפור ביצועים אם ייפתח מודול |
| 1.40 | asset-licenses.md | ✅ תוקן מקומית | `docs/asset-licenses.md` נוצר (מ־MODEL_SOURCES) | ממתין לאישור commit |

### מודול ב׳/ג׳ (לפי נעילת BRIEF)

| # | דרישה | סטטוס | ראיה | תיקון |
|---|--------|--------|------|-------|
| 1.41 | Guest checkout | ✅ | אין חובת login ב־checkout | — |
| 1.42 | Protected /account | ⚠️ מכוון | אין Clerk/`/account`; יש `/orders` | — |
| 1.43 | Reorder | ✅ | `order-lookup.ts` + מחירים חיים | — |
| 1.44 | IDOR userId | ⚠️ מכוון | lookup מספר+טלפון; כישלון אחיד | — |
| 1.45 | מספרי הזמנה אקראיים | ✅ | `TN-` + randomInt alphabet ב־`checkout.ts` | — |
| 1.46 | Cache-Control private | ✅ תוקן מקומית | `next.config.ts` headers ל־`/orders`, `/order/*`, `/cart`, `/checkout` | ממתין לאישור commit |
| 1.47 | Svix Clerk | ⚠️ מכוון | אין Clerk | — |
| 1.48 | Session cookies | ⚠️ | Age/consent cookies — לבדוק flags | בדיקה |
| 1.49 | OTP | ⚠️ מכוון | אין OTP | — |
| 1.50 | Open Redirect allowlist | ⚠️ | לבדוק returnUrl | סריקה |

### סיכום כמותי — סקריפט 1 עד כאן (מודול א׳+ב׳/ג׳ מול BRIEF)

- ✅ תקין מול יישום או נעילה מכוונת עם נימוק: רוב הליבה  
- ⚠️ חלקי / מכוון / דורש תיקון קטן: ~20  
- ❌ פער אמיתי ללא נעילה מפורשת: בעיקר 1.39 (dispose/DRACO/baked), 1.40 קובץ ייעודי, 1.46 כותרת cache

**המלצה:** לא לפתוח מחדש Lenis/Faceted/Clerk. לתקן מקומית: `asset-licenses.md`, Cache-Control ל־`/orders`, ואז להמשיך ביקורת סקריפט 2.

---

## שאלות שמורות לסוף (המשתמש ביקש לא לעצור באמצע)

1. האם לפתוח מחדש Path C (baked lightmaps + dispose) לשיפור 1.39, או להשאיר כמאושר־חלקי?
2. ~~asset-licenses.md~~ — נוצר מקומית; לאשר commit?
3. Clarity / GA / Pixel ב־Vercel — אילו מזהים כבר בפרודקשן?
4. מייל Contact אמיתי ל־`security.txt` (כרגע placeholder על דומיין Vercel)?
5. האם MFA פעיל ב־GitHub / Vercel / Sanity / Morning לכל מי שיש גישה?
6. האם להמשיך ביקורת סקריפט 4 (Handoff) או לתקן קודם את כל ה־⚠️ של 1–3?
7. אישור מתי מותר `git commit` / `git push` שוב.

---

## סקריפט 2 — מודול א׳ (CRO) — טיוטה

| # | דרישה | סטטוס | ראיה | תיקון |
|---|--------|--------|------|-------|
| 2.1 | Predictive Smart Search | ⚠️ | `search.ts` typo ≤1 + עברית; חיפוש ב־`ProductBrowser` בלי dropdown תמונה/מחיר | שיפור UI חיפוש — לשאול |
| 2.2 | אבטחת חיפוש | ⚠️ | חיפוש קליינטי על קטלוג שנטען; אין GROQ חי; debounce ב־memory | מספיק לקטלוג קטן; Algolia לא נדרש |
| 2.3 | Upsell | ✅ | `CartView` suggestions + QuickAdd | — |
| 2.4 | One-click + בר משלוח חינם | ⚠️ | QuickAdd כן; בר giftThreshold כן; בר freeAbove בעיקר בקופה | אופציונלי בסל |
| 2.5 | מחירי upsell בשרת | ✅ | quote/server | — |
| 2.6–2.8 | ביקורות פנימיות + העלאת תמונות | ❌/מכוון | אין מודל Review ב־Sanity; יש קישור Google Reviews (Cold Start) | לא לבנות Yotpo בלי אישור |
| 2.9 | Cold Start trust | ✅ | GMB link + כשרות + משלוח חינם + באנרים | — |

**תחקיר סקריפט 2 שנענה מ־BRIEF (לא לשאול שוב):** חיפוש פנימי; upsell בעגלה; ביקורות = Google חיצוני לא CMS פנימי.

---

## סקריפט 3 — מודול א׳ רמה א׳ (חומת אבטחה) — טיוטה

| # | דרישה | סטטוס | ראיה | תיקון |
|---|--------|--------|------|-------|
| 3.1 | Cart Integrity | ✅ | `placeOrder` → `computeCart` מול Sanity | — |
| 3.2 | Webhook signatures | ✅ | Morning `safeEqual` token + אימות מסמך; Sanity `parseBody` signature; idempotency ב־paid route | Timestamp window על Morning — לבדוק העמקה |
| 3.3 | CSP + nonce | ⚠️ | `proxy.ts` CSP+nonce+XFO; HSTS ב־next.config; חסרים COOP/CORP מפורשים ברשימת הסקריפט | הוספת כותרות אם יידרש |
| 3.4 | poweredBy / sourceMaps | ✅ תוקן מקומית | `poweredByHeader: false` + `productionBrowserSourceMaps: false` | ממתין לאישור commit |
| 3.5 | Rate limit Upstash | ✅ | `rate-limit.ts` על quote/order/events/webhook/orders | — |
| 3.6 | Secure Server Actions | ✅ | Zod + origin + Turnstile + honeypot `website`/`startedAt` ב־checkout | — |
| 3.7 | IDOR / order ids | ✅/⚠️ | מספרי TN אקראיים; lookup טלפון+מספר; אין userId (מכוון) | — |
| 3.8 | OTP | ⚠️ מכוון | אין OTP/Clerk | — |
| 3.9 | Secrets server-only | ✅ | קבצי server + `.env.example`; Zod env בעלייה — חלקי | חיזוק boot validation |
| 3.10 | Sanity hardening | ✅ | dataset פרטי לפי BRIEF; GROQ params; CORS — לבדוק בקונסולת Sanity | שאלה ללקוח על MFA Studio |
| 3.11 | Payment integrity | ✅ | Morning redirect; מלאי בוליאני (לא אטומי מספרי — מכוון) | — |
| 3.12 | Cache safety | ✅ תוקן | headers ב־next.config לסל/קופה/הזמנות | — |
| 3.13 | XSS / redirects | ✅/⚠️ | jsonLd escape; RichText לבדיקה; returnUrl allowlist — לבדוק | — |
| 3.14 | Bot Turnstile + honeypot | ✅ | Turnstile + website/startedAt | — |
| 3.15 | revalidate / health | ✅ | `api/revalidate` חתימה; `api/health` OK | — |
| 3.16 | 2FA accounts | ⚠️ תהליך | לא ניתן לאמת מהקוד | שאלה ללקוח |

### רמה ב׳ (דגימה)

| # | סטטוס | ראיה |
|---|--------|------|
| 3.21 CSV injection | ✅ | `csv.ts` LRM + FORMULA_START |
| 3.22 remotePatterns | ✅ | cdn.sanity.io בלבד |
| 3.34 security.txt | ✅ תוקן מקומית | `public/.well-known/security.txt` | לעדכן Contact למייל אמיתי כשיהיה |

---

## סקריפט 3 — מודול ב׳ השקה (דגימה)

| # | סטטוס | ראיה |
|---|--------|------|
| 3.35 JSON-LD | ✅ | Product, Breadcrumb, LocalBusiness |
| 3.37 /api/health | ✅ | קיים |
| 3.38 revalidate | ✅ | קיים |
| 3.41 GA4/Pixel/Clarity | ⚠️ | קוד קיים אחרי consent; דורש env בפרוד |
| 3.42 sitemap/OG | ✅ | `sitemap.ts`, opengraph-image routes |

---

## שינויים מקומיים שלא הועלו ל־GitHub

1. `docs/AUDIT_SCRIPT5.md` (מסמך זה)
2. `docs/asset-licenses.md`
3. `next.config.ts` — Cache-Control פרטי + `productionBrowserSourceMaps: false`
4. `public/.well-known/security.txt`

---

## יומן התקדמות

| מתי | מה |
|-----|-----|
| 2026-10-28 | שלב 0 + סקריפט 1–3 טיוטה; תיקונים מקומיים (licenses, cache, sourceMaps, security.txt); **אין commit/push** |
