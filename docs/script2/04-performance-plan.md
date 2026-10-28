# סקריפט 2 מודול ב׳ — תכנון ביצועים

## תחקיר (מ־BRIEF)
| קבוצה | ערך |
|--------|-----|
| Payload כבד | R3F Hero GLB (תקציב ~2MB); poster SSR; lazy canvas |
| State | CartProvider + quote server; לא React Query |
| a11y | Native + AccessibilityMenu; skip link; reduced-motion |

## יעדים
| מדד | יעד |
|-----|-----|
| LCP | < 1.5s (מובייל) — למדוד ב־PSI על פרוד |
| INP | < 100ms |
| CLS | < 0.05 |
| JS ראשוני | שאיפה < 150KB gzip ל־above-the-fold (R3F ב־lazy) |

## מה קיים
- Poster → lazy Canvas; Meshopt/`wasm-unsafe-eval` ב־CSP
- `optimizePackageImports` ל־drei/motion
- Cache למודלים; ISR/tags למוצרים; private לסל/קופה/הזמנות
- SW לא אמור לקאש׳ דפים פרטיים (לבדוק `public/sw.js`)

## פערים מתועדים
- אין DRACO מפורש + אין dispose ב־unmount (1.39)
- אין Lenis (נדחה)
- מדידת Lighthouse בפועל — דורשת הרצה על הפרוד אחרי deploy
