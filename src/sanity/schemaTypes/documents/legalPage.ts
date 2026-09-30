import { defineField, defineType } from 'sanity';
import { requireHebrew } from '../objects/locale';

export const LEGAL_SLUGS = [
  { title: 'תקנון ותנאי שימוש', value: 'terms' },
  { title: 'מדיניות פרטיות', value: 'privacy' },
  { title: 'הצהרת נגישות', value: 'accessibility' },
  { title: 'משלוחים וביטולים', value: 'shipping-returns' },
  { title: 'מדיניות עוגיות', value: 'cookies' },
];

export const legalPage = defineType({
  name: 'legalPage',
  title: 'עמוד משפטי',
  type: 'document',
  fields: [
    defineField({
      name: 'slug',
      title: 'עמוד',
      type: 'string',
      options: { list: LEGAL_SLUGS },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'title', title: 'כותרת', type: 'localeString', validation: (r) => r.custom(requireHebrew) }),
    defineField({
      name: 'body',
      title: 'תוכן',
      description:
        'ריק = הטקסט המובנה באתר. ניתן לשלב משתנים שמתמלאים אוטומטית מהגדרות האתר: {businessName} {address} {phone} {coordinatorName} {coordinatorPhone} {coordinatorEmail} {physicalAccessibility}',
      type: 'localeBlock',
    }),
    defineField({ name: 'updatedAt', title: 'עודכן לאחרונה', type: 'date' }),
  ],
  preview: { select: { title: 'title.he', subtitle: 'slug' } },
});
