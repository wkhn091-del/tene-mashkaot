# סקריפט 2 מודול א׳ — ארכיטקטורת המרות (מול BRIEF)

## תחקיר (נענה מ־MCP/BRIEF — לא נשאל שוב)
| קבוצה | החלטה |
|--------|--------|
| חיפוש | פנימי: `normalizeSearch` + typo≤1 בעברית על קטלוג שנטען; בלי Algolia |
| Upsell | בעמוד סל (In-page) + QuickAdd; מחירים בשרת ב־quote |
| Social proof | Google Reviews חיצוני (Cold Start); **אין** מודל Review פנימי / Yotpo |

## מה קיים בקוד
- חיפוש+מיון מחיר: `ProductBrowser` + `lib/search.ts`
- Upsell: `CartView` suggestions
- מתנה: `computeGiftProgress` + progress bar בסל
- אותו־יום: `getSameDayInfo` בבאנר/סל/קופה
- OOS→WA: `AddToCartForm`
- Trust: משלוח חינם, כשרות, reviews strip בדף הבית

## מה לא נבנה (מידתיות)
- Faceted Search מלא
- ביקורות עם תמונות + תור אישור Sanity
- Cart drawer אימרסיבי נפרד (יש עמוד `/cart`)
- Predictive dropdown עם תמונה/מחיר בזמן הקלדה

## אלגוריתם Cross-sell (קיים)
`pickSuggestions`: מעדיף kind שעדיין לא בעגלה, אחר כך featured; מקסימום 3; QuickAdd בלחיצה אחת.
