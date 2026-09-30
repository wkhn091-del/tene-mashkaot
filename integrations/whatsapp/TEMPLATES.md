# תבניות וואטסאפ (WhatsApp Cloud API)

הודעות שהעסק יוזם חייבות להיות מתבניות מאושרות. יוצרים אותן ב־**WhatsApp Manager ← Message templates ← Create template**.

- **קטגוריה:** Utility (עדכון תפעולי ולא שיווק).
- **שפה:** Hebrew.
- **שם התבנית:** בדיוק כמו בטבלה, או שמגדירים שם אחר ב־Vercel לפי המשתנה שבטבלה.

אלה המגבלות של Meta, והנוסחים למטה כבר עומדים בהן:
- משתנה לא יכול להיות בתחילת ההודעה או בסופה.
- בתוך ערך של משתנה אסור שיהיו מעברי שורה.

| תבנית | משתנה ב-Vercel (לא חובה) |
|---|---|
| `tene_new_order` | `WHATSAPP_TEMPLATE_NEW_ORDER` |
| `tene_order_paid` | `WHATSAPP_TEMPLATE_ORDER_PAID` |
| `tene_event_inquiry` | `WHATSAPP_TEMPLATE_EVENT` |

## tene_new_order

```
🛒 הזמנה חדשה באתר תנא משקאות
מספר הזמנה: {{1}}
לקוח: {{2}}
סכום: {{3}}
מועד: {{4}}
תשלום: {{5}}
הפרטים המלאים נשלחו למייל ונשמרו במערכת הניהול.
```
דוגמאות לאישור: `TN-261003-K7PQ` · `ישראל ישראלי` · `₪240.00` · `משלוח · יום שישי, 3.10 10:00–11:00` · `אשראי באתר (ממתין לאישור)`

## tene_order_paid

```
✅ התקבל תשלום עבור הזמנה {{1}} בסך {{2}}.
{{3}}
אפשר לראות את ההזמנה במערכת הניהול.
```
דוגמאות: `TN-261003-K7PQ` · `₪240.00` · `מסמך 10234 הופק ונשלח ללקוח`

## tene_event_inquiry

```
🎉 פנייה חדשה לאירוע
שם: {{1}}
טלפון: {{2}}
סוג אירוע: {{3}}
תאריך: {{4}}
פרטים נוספים נשלחו למייל.
```
דוגמאות: `ישראל ישראלי` · `053-0000000` · `בר מצווה` · `12.11.2026`

## הגדרה ב-Vercel

| משתנה | מאיפה |
|---|---|
| `WHATSAPP_ACCESS_TOKEN` | Business Settings ← System users ← Generate token (הרשאות `whatsapp_business_messaging`, `whatsapp_business_management`) |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp ← API Setup ← Phone number ID |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | WhatsApp ← API Setup ← WhatsApp Business Account ID |
| `WHATSAPP_ALERT_TO` | המספרים שיקבלו התראות, מופרדים בפסיק (למשל `0535467863`) |

ההתראות נשלחות **ממספר ה-API**, מספר נפרד, **אל** הוואטסאפ הרגיל של החנות. המספר הקיים של החנות ממשיך לעבוד באפליקציה כרגיל.
