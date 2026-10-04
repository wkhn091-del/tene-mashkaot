/**
 * Built-in legal texts, used until a matching `legalPage` document is published in Sanity
 * (the seed script copies them into Sanity so they can be edited there).
 * Tokens in {braces} are filled from the site settings at render time.
 */

export const LEGAL_SLUG_LIST = ['terms', 'privacy', 'accessibility', 'shipping-returns', 'cookies'] as const;
export type LegalSlug = (typeof LEGAL_SLUG_LIST)[number];

export interface LegalSection {
  heading?: string;
  paragraphs?: string[];
  list?: string[];
}

export interface LegalDocument {
  title: string;
  updatedAt: string;
  sections: LegalSection[];
}

export const LEGAL_UPDATED_AT = '2026-09-30';

export const LEGAL_CONTENT: Record<'he' | 'en', Record<LegalSlug, LegalDocument>> = {
  he: {
    terms: {
      title: 'תקנון ותנאי שימוש',
      updatedAt: LEGAL_UPDATED_AT,
      sections: [
        {
          paragraphs: [
            'ברוכים הבאים לאתר של {businessName} ("החנות"), {address}. השימוש באתר ורכישה באמצעותו כפופים לתנאים שלהלן. התקנון מנוסח בלשון זכר מטעמי נוחות בלבד והוא מיועד לכל המינים.',
          ],
        },
        {
          heading: 'גיל ומכירת משקאות אלכוהוליים',
          list: [
            'הזמנת משקאות אלכוהוליים מותרת לבני 18 ומעלה בלבד. בעת ביצוע ההזמנה המזמין מאשר כי מלאו לו 18 שנים.',
            'השליח או איש הצוות רשאים לבקש תעודה מזהה בעת המסירה או האיסוף, ולסרב למסור משקאות אלכוהוליים למי שלא הציג תעודה או שאינו בגיר.',
            'בהתאם לחוק, לא תתבצע מכירה או מסירה של משקאות אלכוהוליים בין השעות 23:00 ל-06:00.',
            'לא יימסרו משקאות אלכוהוליים לאדם שנראה שיכור.',
          ],
        },
        {
          heading: 'ביצוע הזמנה ותשלום',
          list: [
            'ההזמנה באתר מהווה בקשה לרכישה. ההזמנה תיחשב כמאושרת רק לאחר שנציג החנות יצור קשר עם המזמין ויאשר את פרטיה, המלאי והמועד.',
            'התשלום אינו מתבצע באתר. התשלום יתבצע בטלפון מול נציג החנות או בעת המסירה, באמצעי התשלום המקובלים בחנות.',
            'המחירים באתר כוללים מע"מ ומוצגים בשקלים חדשים. המחיר הקובע הוא המחיר שחושב באתר בעת שליחת ההזמנה.',
            'החנות רשאית לבטל הזמנה במקרה של טעות בולטת במחיר או בתיאור המוצר, חוסר במלאי, או חשש לשימוש לרעה, ותודיע על כך למזמין בהקדם.',
          ],
        },
        {
          heading: 'מבצעים, קופונים ומתנות',
          list: [
            'מבצעים וקופונים תקפים לתקופה ובתנאים המפורסמים, עד גמר המלאי, ואינם ניתנים להמרה בכסף.',
            'אין כפל מבצעים אלא אם צוין אחרת. מתנה לפי סכום קנייה ניתנת לפי המדרגה הגבוהה שאליה הגיע סכום ההזמנה.',
          ],
        },
        {
          heading: 'שבת ומועדים',
          paragraphs: ['האתר אינו מקבל הזמנות בשבתות ובחגים. הזמנות יתקבלו מחדש לאחר צאת השבת או החג.'],
        },
        {
          heading: 'תמונות ותיאורים',
          paragraphs: [
            'התמונות באתר הן להמחשה בלבד. ייתכנו הבדלים בין התמונה למוצר בפועל (למשל שנת בציר, עיצוב אריזה או צבע סרט), ובמארזים ייתכנו החלפות בפריטים שווי ערך.',
          ],
        },
        {
          heading: 'אחריות',
          paragraphs: [
            'החנות אינה אחראית לנזק עקיף שנגרם כתוצאה משימוש באתר או מתקלה טכנית. אחריות החנות בכל מקרה מוגבלת לסכום ששולם בפועל עבור המוצר.',
          ],
        },
        {
          heading: 'קניין רוחני',
          paragraphs: ['כל הזכויות בתכני האתר, לרבות הלוגו, העיצוב, הטקסטים והתמונות, שמורות לחנות. אין להעתיק או לעשות בהם שימוש מסחרי ללא אישור בכתב.'],
        },
        {
          heading: 'דין וסמכות שיפוט',
          paragraphs: ['על התקנון יחולו דיני מדינת ישראל. סמכות השיפוט הבלעדית נתונה לבתי המשפט המוסמכים במחוז המרכז.'],
        },
        {
          heading: 'יצירת קשר',
          paragraphs: ['לכל שאלה: טלפון {phone}, וואטסאפ {phone}, או בחנות – {address}.'],
        },
      ],
    },
    privacy: {
      title: 'מדיניות פרטיות',
      updatedAt: LEGAL_UPDATED_AT,
      sections: [
        {
          paragraphs: [
            '{businessName} מכבדת את פרטיות המשתמשים באתר. מדיניות זו מסבירה איזה מידע נאסף, למה הוא משמש וכיצד הוא נשמר, בהתאם לחוק הגנת הפרטיות, התשמ"א-1981 ותקנותיו.',
          ],
        },
        {
          heading: 'איזה מידע נאסף',
          list: [
            'פרטים שמסרתם בעת הזמנה או פנייה: שם, טלפון, מייל (אם נמסר), כתובת למשלוח, הערות ותוכן ההזמנה.',
            'מידע טכני בסיסי: כתובת IP (לצורכי אבטחה ומניעת הצפה), סוג דפדפן ונתוני שימוש מצטברים ואנונימיים.',
            'העדפות שנשמרות במכשיר שלכם בלבד: תכולת סל הקניות, הגדרות נגישות ואישור גיל.',
          ],
        },
        {
          heading: 'למה המידע משמש',
          list: [
            'טיפול בהזמנה: אישור, תיאום משלוח או איסוף, ויצירת קשר לתשלום.',
            'מענה לפניות, כולל הצעות מחיר לאירועים.',
            'אבטחת האתר, מניעת הונאות ושימוש לרעה.',
            'שיפור האתר על בסיס נתונים סטטיסטיים אנונימיים.',
          ],
        },
        {
          heading: 'מסירת מידע לצדדים שלישיים',
          paragraphs: [
            'איננו מוכרים את המידע שלכם. המידע נשמר ומעובד אצל ספקי שירות הפועלים עבורנו בלבד: מערכת ניהול התוכן וההזמנות (Sanity), שירות אחסון האתר (Vercel), שירות שליחת מיילים (Resend), שירות הגנה מפני רובוטים (Cloudflare Turnstile), שירות הגבלת קצב בקשות (Upstash), סליקת אשראי והפקת קבלות (Morning ו-Grow – פרטי הכרטיס מוזנים אצלם בלבד ואינם מגיעים אלינו), הודעות וואטסאפ תפעוליות לחנות (Meta), גיליון ההזמנות הפנימי של החנות (Google) וניטור תקלות טכניות (Sentry, ללא פרטים מזהים). באישורכם בלבד: מדידת שימוש (Google Analytics) ומדידת פרסום (Meta Pixel). חלק מהספקים מאחסנים מידע מחוץ לישראל, בהתאם להוראות הדין.',
            'מידע עשוי להימסר גם אם נידרש לכך על פי דין.',
          ],
        },
        {
          heading: 'שמירת מידע ואבטחה',
          paragraphs: [
            'אנו נוקטים אמצעי אבטחה מקובלים, לרבות הצפנת תעבורה (HTTPS), הרשאות גישה מוגבלות ושמירת פרטי ההזמנות במאגר פרטי. פרטי הזמנות נשמרים למשך הזמן הנדרש לטיפול בהן ולעמידה בחובות על פי דין.',
          ],
        },
        {
          heading: 'הזכויות שלכם',
          paragraphs: ['באפשרותכם לבקש לעיין במידע שנשמר עליכם, לתקנו או למחוק אותו. פנו אלינו בטלפון {phone} ונטפל בבקשה בהקדם.'],
        },
        {
          heading: 'דיוור',
          paragraphs: ['לא נשלח אליכם דברי פרסומת ללא הסכמתכם. ההצטרפות לקבוצת המבצעים בוואטסאפ היא לבחירתכם וניתן לעזוב אותה בכל עת.'],
        },
      ],
    },
    accessibility: {
      title: 'הצהרת נגישות',
      updatedAt: LEGAL_UPDATED_AT,
      sections: [
        {
          paragraphs: [
            '{businessName} רואה חשיבות רבה במתן שירות שוויוני לכלל הלקוחות, ופועלת להנגשת האתר והחנות בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות, התשנ"ח-1998, ותקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג-2013.',
          ],
        },
        {
          heading: 'רמת הנגישות באתר',
          paragraphs: ['האתר הונגש בהתאם לתקן הישראלי ת"י 5568, המבוסס על הנחיות WCAG 2.1 ברמה AA, ונבדק בדפדפנים הנפוצים ובמכשירים ניידים.'],
        },
        {
          heading: 'התאמות שבוצעו',
          list: [
            'ניווט מלא באמצעות מקלדת, כולל קישור "דילוג לתוכן הראשי" ומיקוד נראה לעין.',
            'תמיכה בקוראי מסך: מבנה כותרות היררכי, תיאורי תמונות, תוויות לשדות טפסים והודעות שגיאה מוקראות.',
            'תפריט נגישות: הגדלת טקסט, ניגודיות גבוהה, הדגשת קישורים, גופן קריא ועצירת אנימציות.',
            'כיבוד הגדרת "הפחתת תנועה" של מערכת ההפעלה. ההדמיה התלת-ממדית מוחלפת בתמונה סטטית כשהתנועה מופחתת.',
            'ניגודיות צבעים מספקת ותמיכה בתצוגה בשפה העברית (מימין לשמאל) ובאנגלית.',
          ],
        },
        {
          heading: 'נגישות החנות הפיזית',
          paragraphs: ['{physicalAccessibility}'],
        },
        {
          heading: 'מגבלות ידועות',
          paragraphs: ['ייתכן שחלק מהתכנים שמקורם בצד שלישי (כגון מפת Google המוטמעת) אינם נגישים במלואם. ניתן לקבל את כל המידע גם בטלפון.'],
        },
        {
          heading: 'רכזת הנגישות',
          paragraphs: [
            'נתקלתם בבעיית נגישות? נשמח לשמוע ולתקן. רכזת הנגישות: {coordinatorName}, טלפון {coordinatorPhone}{coordinatorEmail}. נשתדל להשיב לכל פנייה בתוך 5 ימי עסקים.',
          ],
        },
      ],
    },
    'shipping-returns': {
      title: 'משלוחים וביטולים',
      updatedAt: LEGAL_UPDATED_AT,
      sections: [
        {
          heading: 'אזורי משלוח ועלויות',
          list: [
            'משלוחים באלעד ללא עלות. משלוחים ליישובים נוספים באזור בתיאום ובתעריף המוצג בעמוד ההזמנה.',
            'ניתן לבחור איסוף עצמי מהחנות – {address}.',
          ],
        },
        {
          heading: 'מועדי משלוח',
          list: [
            'המשלוח מתבצע בחלון הזמן שנבחר בעת ההזמנה ואושר על ידי נציג החנות.',
            'מארזים בהתאמה אישית עשויים לדרוש זמן הכנה, כמצוין בעמוד המוצר.',
            'לא יתבצעו משלוחים בשבתות ובחגים, ולא תימסר אלכוהול בין השעות 23:00 ל-06:00.',
            'במסירה תידרש נוכחות של אדם בגיר (18+) עם תעודה מזהה.',
          ],
        },
        {
          heading: 'ביטול עסקה',
          list: [
            'ניתן לבטל הזמנה ללא עלות עד ליציאת המשלוח או עד תחילת הכנת מארז בהתאמה אישית, בפנייה טלפונית או בוואטסאפ.',
            'בהתאם לחוק הגנת הצרכן, התשמ"א-1981, ניתן לבטל עסקת מכר מרחוק בתוך 14 יום מקבלת המוצר, ובלבד שהמוצר מוחזר באריזתו המקורית, סגור ושלם. במקרה כזה ייגבו דמי ביטול בשיעור של 5% ממחיר העסקה או 100 ₪, לפי הנמוך מביניהם.',
            'לפי הדין, זכות הביטול אינה חלה על מוצרים פסידים (כגון פרלינים ומתוקים), על מוצרים שיוצרו או הותאמו במיוחד עבור הלקוח (כגון מארז עם הקדשה אישית או בלון עם טקסט) ועל בקבוקים שנפתחו.',
            'ההחזר הכספי יבוצע בתוך 14 יום מקבלת הודעת הביטול, באמצעי התשלום שבו בוצע התשלום.',
          ],
        },
        {
          heading: 'מוצר פגום',
          paragraphs: ['קיבלתם מוצר פגום או שבור? צרו קשר בתוך 48 שעות בטלפון {phone} ונחליף אותו או נזכה אתכם במלוא הסכום.'],
        },
      ],
    },
    cookies: {
      title: 'מדיניות עוגיות',
      updatedAt: LEGAL_UPDATED_AT,
      sections: [
        {
          paragraphs: ['האתר משתמש בעוגיות ובאחסון מקומי בדפדפן לצורך תפעולו. עוגיות סטטיסטיקה (Google Analytics) ועוגיות שיווק (Meta Pixel) מופעלות רק אם אישרתם אותן בבאנר העוגיות, וניתן לשנות את הבחירה בכל עת דרך "הגדרות עוגיות" בתחתית האתר.'],
        },
        {
          heading: 'מה נשמר',
          list: [
            'אישור גיל (עוגייה בשם tene_age_ok) – כדי שלא תתבקשו לאשר את גילכם בכל מעבר בין עמודים. נמחקת כשסוגרים את הדפדפן, ולכן נשאל שוב בכל כניסה חדשה.',
            'סל הקניות (אחסון מקומי) – כדי שהמוצרים יישמרו גם אם תסגרו את הדפדפן.',
            'הגדרות נגישות (אחסון מקומי) – כדי שההגדרות שבחרתם יישמרו.',
            'עוגיית שפה – לזכירת השפה המועדפת.',
            'אימות Cloudflare Turnstile בטפסים – להגנה מפני רובוטים.',
            'מדידת תנועה אנונימית של Vercel Analytics – ללא עוגיות וללא זיהוי אישי.',
            'בחירת העוגיות שלכם (עוגייה בשם tene_consent) – נשמרת עד 180 יום.',
            'שמירת עמודים ותמונות לגלישה גם בלי חיבור (Service Worker) – ללא פרטים אישיים, מחירים או סל.',
          ],
        },
        {
          heading: 'עוגיות שמופעלות רק באישורכם',
          list: [
            'סטטיסטיקה – Google Analytics 4: אילו עמודים ומוצרים נצפים, כדי לשפר את האתר. עוגיות שמתחילות ב-_ga. אותות פרסום של Google כבויים.',
            'שיווק – Meta Pixel: מדידת האפקטיביות של פרסום בפייסבוק ובאינסטגרם. עוגיית _fbp.',
          ],
        },
        {
          heading: 'ניהול העוגיות',
          paragraphs: ['ניתן לשנות או לבטל את ההסכמה בכל עת דרך "הגדרות עוגיות" בתחתית האתר. ביטול מוחק את עוגיות המדידה. אפשר גם למחוק עוגיות ונתוני אתרים דרך הגדרות הדפדפן; מחיקתם תאפס את סל הקניות, את הגדרות הנגישות ואת אישור הגיל.'],
        },
      ],
    },
  },
  en: {
    terms: {
      title: 'Terms of Use',
      updatedAt: LEGAL_UPDATED_AT,
      sections: [
        {
          paragraphs: ['Welcome to the website of {businessName} ("the Store"), {address}. Using the website and ordering through it are subject to the terms below.'],
        },
        {
          heading: 'Age and alcohol sales',
          list: [
            'Alcoholic beverages may only be ordered by persons aged 18 or over. By placing an order you confirm that you are at least 18.',
            'The courier or staff may ask for ID on delivery or pickup and may refuse to hand over alcohol to anyone who does not present ID or is under 18.',
            'By law, alcohol is not sold or delivered between 23:00 and 06:00.',
            'Alcohol will not be handed to a person who appears intoxicated.',
          ],
        },
        {
          heading: 'Orders and payment',
          list: [
            'An order on the website is a purchase request. It is confirmed only after a Store representative contacts you and confirms the details, stock and time.',
            'No payment is taken on the website. Payment is made by phone with a Store representative or upon delivery.',
            'Prices include VAT and are shown in Israeli shekels. The binding price is the one calculated when the order was submitted.',
            'The Store may cancel an order in case of an obvious pricing or description error, lack of stock or suspected abuse, and will notify you promptly.',
          ],
        },
        {
          heading: 'Promotions, coupons and gifts',
          list: [
            'Promotions and coupons are valid for the stated period and conditions, while stocks last, and cannot be exchanged for cash.',
            'Promotions cannot be combined unless stated otherwise. Spend-based gifts are given according to the highest tier reached.',
          ],
        },
        { heading: 'Shabbat and holidays', paragraphs: ['The website does not accept orders on Shabbat and Jewish holidays. Ordering reopens after Shabbat or the holiday ends.'] },
        {
          heading: 'Images and descriptions',
          paragraphs: ['Images are for illustration only. The actual product may differ (e.g. vintage, packaging or ribbon color), and gift packs may include equivalent substitutes.'],
        },
        {
          heading: 'Liability',
          paragraphs: ['The Store is not liable for indirect damage resulting from use of the website or technical faults. In any case, liability is limited to the amount actually paid for the product.'],
        },
        { heading: 'Intellectual property', paragraphs: ['All rights in the website content, including the logo, design, texts and images, are reserved by the Store.'] },
        { heading: 'Governing law', paragraphs: ['These terms are governed by the laws of the State of Israel. Exclusive jurisdiction lies with the competent courts of the Central District.'] },
        { heading: 'Contact', paragraphs: ['Questions? Call or WhatsApp {phone}, or visit us at {address}.'] },
      ],
    },
    privacy: {
      title: 'Privacy Policy',
      updatedAt: LEGAL_UPDATED_AT,
      sections: [
        { paragraphs: ['{businessName} respects your privacy. This policy explains what information is collected, how it is used and how it is stored, in accordance with the Israeli Protection of Privacy Law, 1981.'] },
        {
          heading: 'Information we collect',
          list: [
            'Details you provide when ordering or contacting us: name, phone, email (optional), delivery address, notes and order contents.',
            'Basic technical data: IP address (for security and abuse prevention), browser type and aggregated anonymous usage data.',
            'Preferences stored only on your device: cart contents, accessibility settings and age confirmation.',
          ],
        },
        {
          heading: 'How we use it',
          list: ['Handling your order: confirmation, delivery or pickup coordination and payment.', 'Responding to inquiries, including event quotes.', 'Securing the website and preventing fraud and abuse.', 'Improving the website using anonymous statistics.'],
        },
        {
          heading: 'Sharing with third parties',
          paragraphs: [
            'We never sell your information. It is stored and processed only by service providers acting on our behalf: the content and order management system (Sanity), hosting (Vercel), email delivery (Resend), bot protection (Cloudflare Turnstile), rate limiting (Upstash), card payments and receipts (Morning and Grow – card details are entered on their page only and never reach us), operational WhatsApp messages to the store (Meta), the store’s internal order sheet (Google) and technical error monitoring (Sentry, without identifying details). Only with your consent: usage statistics (Google Analytics) and ad measurement (Meta Pixel). Some providers store data outside Israel, as permitted by law.',
            'Information may also be disclosed when required by law.',
          ],
        },
        { heading: 'Retention and security', paragraphs: ['We use standard safeguards including HTTPS encryption, restricted access and a private order database. Order details are kept for as long as needed to handle them and meet legal obligations.'] },
        { heading: 'Your rights', paragraphs: ['You may request to review, correct or delete your information by calling {phone}.'] },
        { heading: 'Marketing', paragraphs: ['We will not send you advertising without your consent. Joining our WhatsApp deals group is optional and you can leave at any time.'] },
      ],
    },
    accessibility: {
      title: 'Accessibility Statement',
      updatedAt: LEGAL_UPDATED_AT,
      sections: [
        {
          paragraphs: [
            '{businessName} is committed to providing equal service to all customers and makes its website and store accessible in accordance with the Equal Rights for Persons with Disabilities Law, 1998, and the Accessibility Regulations for Services, 2013.',
          ],
        },
        { heading: 'Accessibility level', paragraphs: ['The website follows Israeli Standard 5568, based on WCAG 2.1 level AA, and was tested on common browsers and mobile devices.'] },
        {
          heading: 'Adjustments made',
          list: [
            'Full keyboard navigation, including a "skip to main content" link and visible focus.',
            'Screen reader support: hierarchical headings, image descriptions, labelled form fields and announced error messages.',
            'Accessibility menu: text resizing, high contrast, link highlighting, readable font and stopping animations.',
            'Respecting the operating system "reduce motion" setting; the 3D scene is replaced by a static image.',
            'Sufficient color contrast and support for Hebrew (right-to-left) and English.',
          ],
        },
        { heading: 'Physical store accessibility', paragraphs: ['{physicalAccessibility}'] },
        { heading: 'Known limitations', paragraphs: ['Some third-party content (such as the embedded Google map) may not be fully accessible. All information is also available by phone.'] },
        {
          heading: 'Accessibility coordinator',
          paragraphs: ['Found an accessibility issue? Please let us know. Accessibility coordinator: {coordinatorName}, phone {coordinatorPhone}{coordinatorEmail}. We aim to respond within 5 business days.'],
        },
      ],
    },
    'shipping-returns': {
      title: 'Delivery & Cancellations',
      updatedAt: LEGAL_UPDATED_AT,
      sections: [
        { heading: 'Delivery areas and fees', list: ['Free delivery within Elad. Other nearby towns by arrangement at the fee shown at checkout.', 'Free pickup from the store – {address}.'] },
        {
          heading: 'Delivery times',
          list: [
            'Delivery takes place in the time slot chosen at checkout and confirmed by the Store.',
            'Personalized gift packs may require preparation time, as stated on the product page.',
            'No deliveries on Shabbat and holidays, and no alcohol is delivered between 23:00 and 06:00.',
            'An adult (18+) with ID must be present to receive the delivery.',
          ],
        },
        {
          heading: 'Cancellation',
          list: [
            'You may cancel free of charge until the delivery leaves the store or preparation of a personalized pack begins, by phone or WhatsApp.',
            'Under the Consumer Protection Law, 1981, a distance sale may be cancelled within 14 days of receiving the product, provided it is returned sealed and complete in its original packaging. A cancellation fee of 5% of the price or ₪100, whichever is lower, applies.',
            'By law, the right to cancel does not apply to perishable goods (such as pralines and sweets), items made or personalized for you (such as a pack with a dedication or a balloon with text) or opened bottles.',
            'Refunds are made within 14 days of the cancellation notice, using the original payment method.',
          ],
        },
        { heading: 'Damaged items', paragraphs: ['Received a damaged or broken item? Contact us within 48 hours at {phone} and we will replace it or refund you in full.'] },
      ],
    },
    cookies: {
      title: 'Cookie Policy',
      updatedAt: LEGAL_UPDATED_AT,
      sections: [
        { paragraphs: ['The website uses cookies and local browser storage to work. Statistics cookies (Google Analytics) and marketing cookies (Meta Pixel) are only enabled if you accept them in the cookie banner, and you can change your choice at any time via "Cookie settings" at the bottom of the site.'] },
        {
          heading: 'What is stored',
          list: [
            'Age confirmation (cookie named tene_age_ok) – so you are not asked on every page. Deleted when you close the browser, so you are asked again on every new visit.',
            'Shopping cart (local storage) – so your items are kept if you close the browser.',
            'Accessibility settings (local storage) – so your chosen settings are remembered.',
            'Language cookie – to remember your preferred language.',
            'Cloudflare Turnstile verification on forms – for bot protection.',
            'Anonymous Vercel Analytics traffic measurement – cookie-free and without personal identification.',
            'Your cookie choice (tene_consent cookie) – kept for up to 180 days.',
            'Offline copies of pages and images (service worker) – no personal details, prices or cart.',
            'Only with your consent – Statistics: Google Analytics 4 (_ga cookies), with Google advertising signals off.',
            'Only with your consent – Marketing: Meta Pixel (_fbp cookie) to measure Facebook and Instagram ads.',
          ],
        },
        { heading: 'Managing cookies', paragraphs: ['You can delete cookies and site data in your browser settings. Doing so resets your cart, accessibility settings and age confirmation.'] },
      ],
    },
  },
};

export interface LegalTokens {
  businessName: string;
  address: string;
  phone: string;
  coordinatorName: string;
  coordinatorPhone: string;
  coordinatorEmail: string;
  physicalAccessibility: string;
}

export function fillTokens(text: string, tokens: LegalTokens): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => (key in tokens ? tokens[key as keyof LegalTokens] : match));
}
