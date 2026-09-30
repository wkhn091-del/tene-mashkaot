# מדריך העלאה לאוויר – תנא משקאות

המדריך עובר צעד-אחר-צעד מהקוד שבתיקייה ועד אתר חי על הדומיין שלכם.
זמן משוער: 60–90 דקות (רוב הזמן הוא המתנה לאימות DNS).

**מה צריך:**
- Node.js 20.9 ומעלה (מומלץ 22).
- חשבון GitHub.
- חשבונות חינמיים ב־Sanity, ב־Vercel, ב־Upstash, ב־Resend וב־Cloudflare.
- גישה להגדרות ה־DNS של הדומיין.

> האתר עובד גם בלי חלק מהשירותים: בלי Sanity הוא מציג ברירות מחדל, בלי Resend ההזמנות נשמרות רק בסטודיו, ובלי Turnstile או Upstash אין הגנת בוטים או הגבלת קצב. לפרודקשן **חובה** להגדיר את כולם.

---

## 1. הרצה מקומית

```bash
npm install
cp .env.example .env.local      # ב-Windows PowerShell: Copy-Item .env.example .env.local
npm run dev
```

האתר רץ בכתובת http://localhost:3000. בשלב הזה הוא מציג תוכן ברירת מחדל ואין בו עדיין מוצרים.

---

## 2. Sanity (ניהול תוכן והזמנות)

### 2.1 יצירת פרויקט
1. נכנסים ל־https://www.sanity.io/manage ← **Create new project**.
2. שם הפרויקט: `tene-mashkaot`. יוצרים dataset בשם `production`.
3. מעתיקים את ה־**Project ID** שמופיע בראש העמוד ל־`.env.local`:
   ```
   NEXT_PUBLIC_SANITY_PROJECT_ID=xxxxxxxx
   NEXT_PUBLIC_SANITY_DATASET=production
   ```

### 2.2 הפיכת ה־dataset לפרטי (חשוב – יש בו פרטי לקוחות)
בפרויקט: **Datasets** ← `production` ← **Edit** ← Visibility: **Private**.

> תמונות שמעלים לסטודיו (מוצרים, לוגו) נגישות דרך `cdn.sanity.io` גם כשה־dataset פרטי, וזה המצב הרצוי. הזמנות ופניות נשארות פרטיות.

### 2.3 טוקנים
**API** ← **Tokens** ← **Add API token**. יוצרים שני טוקנים:

| שם | הרשאה | משתנה סביבה |
|---|---|---|
| `site-read` | **Viewer** | `SANITY_API_READ_TOKEN` |
| `site-write` | **Editor** | `SANITY_API_WRITE_TOKEN` |

מעתיקים כל טוקן מיד (הוא מוצג פעם אחת בלבד) ל־`.env.local`. **לעולם לא** מכניסים טוקן למשתנה שמתחיל ב־`NEXT_PUBLIC_`.

### 2.4 CORS (נדרש לסטודיו המוטמע ב־/studio)
**API** ← **CORS origins** ← **Add CORS origin**. מוסיפים כל אחת מהכתובות הבאות, ובכל אחת מסמנים **Allow credentials**:
- `http://localhost:3000`
- `https://<שם-הפרויקט>.vercel.app` (אחרי שלב 4)
- `https://www.הדומיין-שלכם.co.il` וגם `https://הדומיין-שלכם.co.il` (אחרי שלב 5)

### 2.5 טעינת תוכן בסיסי
```bash
npm run seed
```
הפקודה יוצרת:
- הגדרות אתר: טלפון, וואטסאפ, כתובת, שעות, כשרות ורכזת נגישות.
- הגדרות משלוחים ואזור משלוח לאלעד (חינם).
- שש קטגוריות.
- חמשת העמודים המשפטיים.

מסמכים שכבר קיימים לא נדרסים. `npm run seed -- --force` מחזיר אותם לברירת המחדל.

רוצים לראות את החנות עם מוצרים לדוגמה?
```bash
npm run seed -- --with-samples
```
הפקודה מוסיפה חמישה מוצרים שהשם שלהם מסתיים ב־"(דוגמה)", ושלושה מבצעי "מתנה מעל סכום" (300, 500 ו־1000 ₪) במצב **כבוי**. **מוחקים את מוצרי הדוגמה לפני העלייה לאוויר.**

### 2.6 כניסה לסטודיו
1. פותחים http://localhost:3000/studio ומתחברים עם חשבון ה־Sanity.
2. מזמינים את בעלי החנות: sanity.io/manage ← **Members** ← **Invite**, עם תפקיד **Editor**.

---

## 3. שירותים חיצוניים

### 3.1 Resend – מיילים על הזמנות חדשות
1. נכנסים ל־https://resend.com ← **Domains** ← **Add Domain** ומזינים את הדומיין, למשל `tene-mashkaot.co.il`.
2. מוסיפים ב־DNS את הרשומות שמוצגות (SPF, DKIM, ו־MX אם מבוקש) ולוחצים **Verify**. האימות לוקח בין כמה דקות לכמה שעות.
3. **API Keys** ← **Create API Key**, עם הרשאת Sending access.
4. ממלאים ב־`.env.local`:
   ```
   RESEND_API_KEY=re_...
   ORDERS_TO_EMAIL=owner@gmail.com,second@gmail.com
   ORDERS_FROM_EMAIL=תנא משקאות <orders@tene-mashkaot.co.il>
   ```
   כתובת השולח חייבת להיות על הדומיין המאומת.

### 3.2 Cloudflare Turnstile – הגנה מבוטים בטפסים
1. נכנסים ל־https://dash.cloudflare.com ← **Turnstile** ← **Add widget**.
2. בשדה Domains מזינים את הדומיין, את `<project>.vercel.app` ואת `localhost`. Widget mode: **Managed**.
3. ממלאים:
   ```
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x...
   TURNSTILE_SECRET_KEY=0x...
   ```

### 3.3 Upstash Redis – הגבלת קצב (מניעת הצפת הזמנות)
1. נכנסים ל־https://console.upstash.com ← **Create Database**. אזור: `eu-central-1` (Frankfurt), הקרוב לישראל.
2. בלשונית **REST API** מעתיקים:
   ```
   UPSTASH_REDIS_REST_URL=https://...upstash.io
   UPSTASH_REDIS_REST_TOKEN=...
   ```

### 3.4 סוד ל־Webhook
יוצרים מחרוזת אקראית:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
ושומרים אותה כ־`SANITY_REVALIDATE_SECRET`.

---

## 4. Vercel – העלאה

1. דוחפים את הקוד למאגר **פרטי** ב־GitHub:
   ```bash
   git init && git add . && git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<user>/tene-mashkaot.git
   git push -u origin main
   ```
   הקובץ `.env.local` לא נדחף, כי הוא מוחרג ב־`.gitignore`.
2. נכנסים ל־https://vercel.com/new ← **Import** של המאגר. Framework: Next.js (מזוהה אוטומטית). אין צורך לשנות את פקודות ה־Build.
3. לפני הלחיצה על Deploy פותחים את **Environment Variables** ומדביקים את כל התוכן של `.env.local`. אפשר להדביק את כל הקובץ בבת אחת. שני שינויים:
   - `NEXT_PUBLIC_SITE_URL` = הכתובת הסופית, למשל `https://www.tene-mashkaot.co.il`. עד שהדומיין מחובר משתמשים בכתובת ה־vercel.app.
   - מסמנים Production וגם Preview.
4. לוחצים **Deploy**.
5. מפעילים סטטיסטיקות: בפרויקט ב־Vercel ← **Analytics** ← **Enable**. הן אנונימיות וללא עוגיות.
6. מוסיפים את כתובת ה־vercel.app ל־CORS ב־Sanity (סעיף 2.4).

### 4.1 Webhook לעדכון מיידי של האתר
כך כל שינוי בסטודיו מופיע באתר תוך שניות.

בוחרים ב־sanity.io/manage ← **API** ← **Webhooks** ← **Create webhook** וממלאים:

| שדה | ערך |
|---|---|
| Name | `revalidate-site` |
| URL | `https://www.הדומיין-שלכם.co.il/api/revalidate` |
| Dataset | `production` |
| Trigger on | Create, Update, Delete |
| Filter | `_type in ["siteSettings","deliverySettings","deliveryZone","category","product","promotion","legalPage"]` |
| Projection | `{_type}` |
| HTTP method | POST |
| API version | `v2025-02-19` |
| Secret | הערך של `SANITY_REVALIDATE_SECRET` |

גם בלי ה־Webhook האתר מתרענן לבד: הגדרות ומוצרים בתוך שעה, ומבצעים בתוך 5 דקות.

---

## 5. דומיין

1. ב־Vercel בוחרים את הפרויקט ← **Settings** ← **Domains** ← **Add**, ומזינים גם `tene-mashkaot.co.il` וגם `www.tene-mashkaot.co.il`. מגדירים את www כראשי וה־apex מפנה אליו.
2. ב־DNS אצל רשם הדומיין מוסיפים את הרשומות ש־Vercel מציג: בדרך כלל `A` ל־`76.76.21.21` ו־`CNAME` של www ל־`cname.vercel-dns.com`.
3. אחרי האימות מעדכנים ב־Vercel את `NEXT_PUBLIC_SITE_URL` לכתובת הסופית ← **Deployments** ← **Redeploy**.
4. מוסיפים את הדומיין ל־CORS ב־Sanity, לווידג'ט ב־Turnstile ולכתובת ה־URL של ה־Webhook.
5. מגישים את מפת האתר ל־Google Search Console: `https://www.הדומיין/sitemap.xml`.

---

## 6. בדיקות אחרי העלייה

- [ ] חלון אימות הגיל מופיע בכניסה הראשונה, ולא מופיע שוב אחרי אישור.
- [ ] ההדמיה התלת-ממדית נטענת במחשב. בנייד חלש או במצב "הפחתת תנועה" מוצגת תמונה סטטית.
- [ ] מוסיפים מוצר לסל ← קופה ← שולחים הזמנת בדיקה. ההזמנה מופיעה בסטודיו תחת **הזמנות חדשות**, מגיע מייל, וכפתור הוואטסאפ פותח הודעה מסודרת.
- [ ] פנייה לאירוע מגיעה לסטודיו תחת **פניות לאירועים** וגם למייל.
- [ ] שינוי מחיר בסטודיו מופיע באתר תוך שניות (בודק את ה־Webhook).
- [ ] בשבת האתר מציג באנר ולא מאפשר הזמנות.
- [ ] `/en` עובד, והמעבר בין השפות שומר על אותו עמוד.
- [ ] מוחקים את מוצרי הדוגמה ואת הזמנות הבדיקה.

---

## 7. ניהול שוטף בסטודיו (לבעלי החנות)

| מה | איפה |
|---|---|
| מוצר חדש, מחיר, מלאי ותמונות | **מוצרים**. מומלץ בקבוק על רקע שקוף, לפחות 1200px גובה |
| מבצע: אחוז הנחה, מחיר קבוע, מתנה מעל סכום או קופון | **מבצעים**. אפשר לתזמן תאריכי התחלה וסיום |
| שעות פתיחה ושעת סגירה בערב שבת | **הגדרות אתר** ← שעות פתיחה. ⚠️ שעת הסגירה בשישי משתנה עונתית (14:00 בחורף, 15:00 בקיץ), ומעדכנים אותה בשדה "שעת סגירה בערב שבת/חג" |
| הודעה בראש האתר (למשל "סגור לרגל…") | **הגדרות אתר** ← פס הודעות עליון |
| ימי סגירה חריגים | **הגדרות משלוחים** ← תאריכים סגורים נוספים |
| יישובים, דמי משלוח ומינימום הזמנה | **אזורי משלוח** |
| טיפול בהזמנה | **הזמנות חדשות** ← משנים סטטוס ל"אושרה" או ל"נמסרה" |

המחירים באתר מחושבים תמיד בשרת לפי הנתונים בסטודיו, כך שלקוח לא יכול לשנות מחיר.
זמני שבת וחג מחושבים אוטומטית לפי הקואורדינטות של אלעד.

---

## 8. לפני השקה – חובה

1. **ייעוץ משפטי:** התקנון, מדיניות הפרטיות, מדיניות המשלוחים והביטולים והצהרת הנגישות נכתבו כבסיס מקצועי, אבל **חייבים לעבור אצל עו"ד**. זה חשוב במיוחד בגלל מכירת אלכוהול, חוק הגנת הצרכן ותיקון 13 לחוק הגנת הפרטיות. עורכים אותם בסטודיו ב**עמודים משפטיים**.
2. **נגישות:** ממלאים ב**הגדרות אתר** ← משפטי ונגישות את התיאור של נגישות החנות הפיזית (חניה, מדרגות, רוחב מעברים) ואת מייל רכזת הנגישות. מומלץ לבצע בדיקת נגישות על ידי מורשה נגישות שירות.
3. **ע.מ / ח.פ:** ממלאים ב**הגדרות אתר** ← משפטי ונגישות. המספר יופיע בתחתית האתר.
4. **רישיון המודל התלת-ממדי:** אם הרישיון של קובץ ה־GLB דורש קרדיט, ממלאים אותו ב**הגדרות אתר** ← "קרדיט למודל התלת-ממד".
5. **לוגו:** אפשר להעלות לוגו רשמי (SVG או PNG שקוף) ב**הגדרות אתר** ← לוגו. בלי לוגו מוצג לוגו טקסטואלי.

---

## 9. תקלות נפוצות

| תסמין | פתרון |
|---|---|
| הסטודיו מציג שגיאת CORS | הכתובת לא נוספה ב־CORS origins, או ש־Allow credentials לא סומן |
| האתר לא מציג מוצרים מ־Sanity | בודקים את `NEXT_PUBLIC_SANITY_PROJECT_ID` ואת `SANITY_API_READ_TOKEN` (dataset פרטי דורש טוקן) |
| הזמנה נכשלת עם "תקלה בשמירה" | `SANITY_API_WRITE_TOKEN` חסר או בהרשאת Viewer. הלקוח מקבל כפתור לשליחת ההזמנה בוואטסאפ |
| לא מגיעים מיילים | הדומיין לא אומת ב־Resend, או ש־`ORDERS_FROM_EMAIL` לא על הדומיין המאומת. הלוגים נמצאים ב־Vercel ← Logs |
| "האימות נכשל" בטפסים | הדומיין לא נוסף לווידג'ט ב־Turnstile |
| שינוי בסטודיו לא מופיע | בודקים ב־Sanity ← Webhooks ← Attempts שהתשובה 200. תשובה 401 אומרת שהסוד לא תואם |

כל שינוי משתני סביבה ב־Vercel דורש **Redeploy**.

## עדכון המודלים התלת־ממדיים והתמונות

- **גופנים:** Heebo ו־Suez One נמצאים בתוך הפרויקט (`src/app/fonts/`). הבנייה לא תלויה ב־Google Fonts ולא תיכשל אם אין אליו גישה.
- **תווית הבקבוק:** העיצוב נמצא ב־`scripts/label/label.html` והתמונה המוכנה ב־`scripts/label/label.webp`. אחרי שינוי מריצים `npm run label`.
- **מודלים חדשים:** מריצים `node scripts/build-pour-model.mjs <בקבוק> <כוס>`, אחר כך `npm run optimize:hero` ואז `npm run label`.
- **ריענון מטמון:** אחרי כל שינוי במודל מעלים את מספר הגרסה (`?v=`) ב־`MODEL_URL` שבקובץ `src/lib/defaults.ts`, או ב־`ROOM_URL` / `ROSE_URL` שבקובץ `HeroCanvas.tsx`. כך דפדפנים לא יציגו עותק ישן.
- **תמונות החנות:** מפותחות מהצילומים המקוריים עם `scripts/enhance-photos.py`: איזון בהירות, תיקון צבע עדין, חדות.

## 11. שלב ההשקה – אינטגרציות

כל אינטגרציה נדלקת רק כשהמשתנים שלה מוגדרים ב־Vercel. אפשר להעלות את האתר לפני שכל החשבונות מוכנים. מפתחות סודיים מזינים ישירות ב־Vercel, תחת Settings ← Environment Variables, ולא שולחים אותם בצ'אט או במייל.

### 11.1 ניטור זמינות – `/api/health`
1. פותחים חשבון חינמי ב־cron-job.org.
2. יוצרים משימה חדשה (Create cronjob):
   - **URL:** `https://<כתובת האתר>/api/health?deep=1`
   - **Schedule:** כל 10 דקות.
3. בלשונית Notifications מסמנים **Notify on failure** ו־**Notify on recovery**.
4. `deep=1` בודק גם את Sanity. אם מערכת הניהול לא עונה, מתקבלת התראה.

### 11.2 רענון לפי עמוד – Webhook ראשון של Sanity
ב־sanity.io/manage ← API ← Webhooks מעדכנים את ה־webhook הקיים (סעיף 4.1):
- **URL:** `https://<כתובת האתר>/api/revalidate`
- **Trigger on:** Create, Update, Delete
- **Filter:** `_type in ["product", "category", "promotion", "siteSettings", "deliverySettings", "deliveryZone", "legalPage"]`
- **Projection:** `{_type, "slug": slug.current, "previousSlug": before().slug.current}`
- **Secret:** הערך של `SANITY_REVALIDATE_SECRET`

התוצאה: עריכת מוצר מרעננת רק את עמוד המוצר ואת רשימות המוצרים, ולא את כל האתר.

### 11.3 מאגר Sanity בתוכנית החינמית
בתוכנית החינמית המאגר הוא ציבורי, ולא ניתן להפוך אותו לפרטי. לכן **מדלגים על סעיף 2.2**.

הזמנות ופניות נשמרות עם מזהה שיש בו נקודה (`order.…`, `eventInquiry.…`). מסמכים כאלה פרטיים גם במאגר ציבורי: רק בקשה עם טוקן יכולה לקרוא אותם.

### 11.4 סליקה וקבלות – Morning
1. **מסלול:** לוודא שהעסק במסלול **Best** ומעלה, כי ה־API זמין רק ממנו.
2. **תוסף תשלומים:** להפעיל את תוסף התשלומים הדיגיטליים, ולוודא מול Morning שמכירת אלכוהול מאושרת.
3. **חשבון בדיקות:** לפתוח חשבון sandbox, להגדיר בו עסק לדוגמה ולבצע בו רכישה פיקטיבית של מינוי Best.
4. **מפתחות:** ליצור מפתח API בנתיב: אזור אישי ← כלים למפתחים ← מפתחות API. המפתח הסודי מוצג פעם אחת בלבד.
5. **משתנים ב־Vercel:**

   | משתנה | Production | Preview (בדיקות) |
   |---|---|---|
   | `MORNING_API_KEY_ID` / `MORNING_API_KEY_SECRET` | מפתחות אמיתיים | מפתחות sandbox |
   | `MORNING_ENV` | `production` | `sandbox` |
   | `MORNING_DOCUMENT_TYPE` | `320` לעוסק מורשה · `400` לעוסק פטור | כנ"ל |
   | `MORNING_WEBHOOK_SECRET` | מחרוזת אקראית | מחרוזת אקראית |

6. **בדיקה בסביבת Preview:**
   1. מבצעים הזמנה עם "אשראי באתר" ומשלמים בכרטיס בדיקה של ה־sandbox.
   2. אחרי החזרה לאתר, העמוד אמור להציג "התשלום התקבל".
   3. בסטודיו, ההזמנה אמורה להיות מסומנת "✅ שולם", עם מספר מסמך.
7. **אם ההזמנה מסומנת "⚠️ לבדיקה":** זה סימן שמבנה הודעת התשלום של Morning שונה ממה שהקוד מצפה לו.
   - שדה "קבלה ב־Morning" בהזמנה מראה אילו שדות התקבלו.
   - שלחו אותם למפתח, והוא יעדכן את הקוד.
   - עד אז שום הזמנה לא מסומנת כשולמה בלי אימות מול Morning.

אבטחה: פרטי הכרטיס מוזנים בדף התשלום של Morning, ולא עוברים דרך האתר. כל הודעת תשלום נבדקת מול ה־API של Morning: המסמך צריך להתקיים, והסכום צריך להיות זהה לסכום ההזמנה.

### 11.5 קבלה על תשלום במסירה – Webhook שני של Sanity
יוצרים webhook חדש ב־sanity.io/manage ← API ← Webhooks:
- **URL:** `https://<כתובת האתר>/api/orders/paid`
- **Trigger on:** Update
- **Filter:** `_type == "order" && paymentStatus == "paid" && paymentMethod != "card" && !defined(receipt.documentId)`
- **Projection:** `{_id}`
- **Secret:** הערך של `SANITY_ORDER_WEBHOOK_SECRET`

השימוש בסטודיו:
1. פותחים את ההזמנה ועוברים ללשונית "תשלום".
2. בוחרים **שולם** ואת אמצעי התשלום, ולוחצים Publish.
3. הקבלה מופקת ב־Morning ונשלחת ללקוח במייל, אם יש לו כתובת.
4. מספר המסמך מופיע בהזמנה.

אם הופיעה שגיאה בשדה "קבלה ב־Morning", מתקנים את הסיבה ושומרים שוב. השמירה מפעילה ניסיון נוסף.

התוכנית החינמית של Sanity מאפשרת 2 webhooks, בדיוק מה שצריך.

### 11.6 מיילים – Resend (בלי דומיין)
- עד שיהיה דומיין מאומת, Resend שולח **רק לכתובת שאיתה נפתח החשבון**. לכן `ORDERS_TO_EMAIL` חייב להיות הכתובת הזו.
- משאירים את `ORDERS_FROM_EMAIL` ריק. ההודעות יישלחו מ־`onboarding@resend.dev`.
- התבניות בנויות לתצוגה נכונה בכל תוכנת מייל:
  - טבלאות מבניות (Ghost Tables) ל־Outlook, וכפתורים ב־VML.
  - כל מספר, טלפון, מחיר ותאריך עטוף בכיווניות LTR מבודדת, כדי שלא יתהפך במובייל.

### 11.7 וואטסאפ אוטומטי – WhatsApp Cloud API
הוראות מלאות ונוסחי התבניות לאישור: `integrations/whatsapp/TEMPLATES.md`.

תקציר:
1. פותחים Meta Business ואפליקציה עם מוצר WhatsApp.
2. מחברים מספר שולח חדש.
3. מאשרים 3 תבניות Utility.
4. מזינים ב־Vercel את `WHATSAPP_ACCESS_TOKEN`, ‏`WHATSAPP_PHONE_NUMBER_ID` ו־`WHATSAPP_ALERT_TO`.

### 11.8 Google Sheets
הוראות מלאות: `integrations/google-sheets/README.md`. מגדירים ב־Vercel את `SHEETS_EXPORT_TOKEN`, ומדביקים את `Code.gs` ב־Apps Script של הגיליון.

### 11.9 הגבלת קצב ואבטחה בנתיבי ה־API
| נתיב | הגנה |
|---|---|
| `/api/health` | 30 בקשות לדקה לכתובת IP |
| `/api/export/*` | טוקן בכותרת Authorization, השוואה בזמן קבוע, 60 בקשות לשעה |
| `/api/revalidate`, `/api/orders/paid` | חתימת Sanity, 120 בקשות לדקה |
| `/api/payments/morning/notify` | סוד ב־URL ואימות מול ה־API של Morning, 120 בקשות לדקה |
| הזמנה, מחיר ופנייה (Server Actions) | בדיקת מקור הבקשה, Turnstile, מלכודת בוטים, הגבלת קצב |

## 12. שלב ההשקה – PWA, מדידה, ניטור שגיאות ושיתוף

### 12.1 אפליקציה למסך הבית ועבודה בלי אינטרנט (PWA)
- **התקנה:** אנדרואיד (Chrome) מציע "התקנת אפליקציה". באייפון (Safari) מתקינים דרך שיתוף ← "הוספה למסך הבית".
- **קבצים:** הגדרות האפליקציה ב־`src/app/manifest.ts`, אייקונים ב־`public/icons/`, וה־Service Worker ב־`public/sw.js`.
- **עמודים:** תמיד נטענים קודם מהרשת. עותק שמור מוצג רק כשאין חיבור, ובעותק כזה:
  - המחירים וסטטוס "פתוח עכשיו" מוסתרים.
  - מופיע פס שמודיע שזה עותק שמור.
  - כך אף פעם לא מוצג מחיר ישן או "פתוח" בשבת.
- **לא נשמרים לעולם:** סל, קופה, עמודי הזמנה, נתיבי API והסטודיו.
- **עדכון גדול:** מעלים את `VERSION` בראש `public/sw.js`, וכל המטמון הישן נמחק בביקור הבא.
- **בדיקה:**
  1. Chrome DevTools ← Application ← Service Workers: מוודאים שהוא רשום.
  2. בלשונית Network מסמנים Offline ומרעננים עמוד שכבר ביקרתם בו.

### 12.2 GA4 ו־Meta Pixel – רק בהסכמה
1. **GA4:** ב־analytics.google.com ← Admin ← Create property ← Web stream לכתובת האתר. מעתיקים את ה־Measurement ID ל־`NEXT_PUBLIC_GA_MEASUREMENT_ID`.
2. **Meta:** ב־Events Manager יוצרים Pixel ומעתיקים את המזהה ל־`NEXT_PUBLIC_META_PIXEL_ID`.
3. **Redeploy:** משתנים שמתחילים ב־`NEXT_PUBLIC_` נכנסים לקוד בזמן הבנייה, ולכן חייבים לבנות מחדש.

איך זה עובד:
- **באנר העוגיות:** מופיע רק כשאחד המזהים מוגדר. כלום לא נטען לפני לחיצה על "אישור". "רק הכרחיות" לא טוען אף כלי מדידה.
- **שינוי בחירה:** "הגדרות עוגיות" בתחתית האתר פותח את הבאנר מחדש. ביטול הסכמה מוחק את עוגיות `_ga` ו־`_fb`.
- **הגדרות פרטיות:** ב־GA4 אותות הפרסום (Google signals) כבויים. Consent Mode v2 מוגדר כך: פרסום כבוי, מדידה פעילה רק באישור.
- **אירועי מסחר:**

  | GA4 | Meta | מתי |
  |---|---|---|
  | `view_item` | `ViewContent` | צפייה במוצר |
  | `add_to_cart` | `AddToCart` | הוספה לסל |
  | `begin_checkout` | `InitiateCheckout` | כניסה לקופה |
  | `purchase` | `Purchase` | הזמנה עם תשלום במסירה, או אחרי אישור תשלום באשראי |
  | `generate_lead` | `Lead` | פנייה לאירוע |

- **ספירה אחת לכל הזמנה:** `purchase` נשלח פעם אחת בלבד, גם אם מרעננים את עמוד ההזמנה. ב־Meta הוא נושא את מספר ההזמנה כ־`eventID`, כך שאפשר להוסיף בעתיד Conversions API בלי ספירה כפולה.
- **פרסום:** פרסום משקאות משכרים מוגבל גם בחוק וגם במדיניות של Meta. כדאי לבדוק את ההגבלות לפני שמריצים קמפיין.

### 12.3 Sentry – ניטור שגיאות
1. **חשבון:** פותחים חשבון חינמי ב־sentry.io ← Create project ← Next.js. מעתיקים את ה־DSN ל־`NEXT_PUBLIC_SENTRY_DSN`.
2. **Source maps:** כדי ששגיאות יצביעו על השורה המדויקת בקוד:
   1. ב־Settings ← Auth Tokens יוצרים טוקן עם הרשאה `project:releases`.
   2. מזינים ב־Vercel את `SENTRY_AUTH_TOKEN`, ‏`SENTRY_ORG` ו־`SENTRY_PROJECT`.
   3. אחרי ההעלאה ל־Sentry, ה־source maps נמחקים מהשרת.

איך זה עובד:
- **נתיב דיווח:** הדיווחים מהדפדפן עוברים דרך `/monitoring` באתר עצמו, ולכן חוסמי פרסומות ו־CSP לא חוסמים אותם.
- **הפרות CSP:** מדווחות גם הן ל־Sentry (`report-uri`).
- **פרטיות:** לא נשלחים פרטי משתמש, עוגיות, כותרות או גוף בקשה. טופסי ההזמנה מכילים שמות וכתובות. הסוד שבכתובת אישור התשלום מוסר מהדיווח.
- **התראות תשלום:** תשלום שלא ניתן היה לאמת, או קבלה שנכשלה, יוצרים התראה ב־Sentry עם תגית `integration:morning`.

### 12.4 תמונות שיתוף (וואטסאפ, פייסבוק)
- **מה נוצר:** לכל מוצר ולכל קטגוריה נוצרת תמונת שיתוף ממותגת בגודל 1200×630: שם, קטגוריה, תמונה ומסגרת זהב.
- **מחיר:** לא מופיע בתמונה, כי וואטסאפ שומר תצוגות מקדימות לזמן רב.
- **קבצים:** `src/app/[locale]/product/[slug]/opengraph-image.tsx` ו־`src/app/[locale]/shop/[category]/opengraph-image.tsx`.
- **פורמט:** התמונה נשמרת כ־JPEG של כ־60KB. וואטסאפ לא מציג תמונות כבדות.
- **מטמון:** התמונה נשמרת ליום. אחרי שינוי שם או תמונה של מוצר, היא מתעדכנת תוך עד 24 שעות.
- **בדיקה:** מדביקים קישור למוצר בכלי Facebook Sharing Debugger ולוחצים "Scrape Again".

### 12.5 Google Search Console ו־Google Business Profile
1. **Search Console:**
   1. ב־search.google.com/search-console ← Add property ← URL prefix ← כתובת האתר.
   2. בוחרים אימות מסוג HTML tag, מעתיקים רק את הערך של `content` ל־`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, ומבצעים Redeploy.
   3. מאמתים ב־Search Console, ואז מגישים את `sitemap.xml` בלשונית Sitemaps.
2. **Google Business Profile:** פותחים ב־business.google.com.
   - שם, כתובת, טלפון ושעות זהים בדיוק לאתר.
   - קטגוריה: חנות משקאות.
   - קישור לאתר, ותמונות החנות.
   - האימות של גוגל יכול לקחת כמה ימים.
