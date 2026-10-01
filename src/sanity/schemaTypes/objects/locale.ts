import { defineArrayMember, defineField, defineType } from 'sanity';

type LocaleValue = { he?: unknown; en?: unknown } | undefined;

export function requireHebrew(value: LocaleValue): true | string {
  const he = value?.he;
  if (typeof he === 'string' ? he.trim().length > 0 : Array.isArray(he) && he.length > 0) return true;
  return 'יש למלא לפחות את הטקסט בעברית';
}

/** The English half of every bilingual field sits folded away, so editors only see the Hebrew box. */
const englishFieldset = [{ name: 'english', title: 'תרגום לאנגלית (לא חובה)', options: { collapsible: true, collapsed: true } }];

export const localeString = defineType({
  name: 'localeString',
  title: 'טקסט דו-לשוני',
  type: 'object',
  fieldsets: englishFieldset,
  fields: [
    defineField({ name: 'he', title: 'עברית', type: 'string' }),
    defineField({ name: 'en', title: 'English', type: 'string', fieldset: 'english' }),
  ],
});

export const localeText = defineType({
  name: 'localeText',
  title: 'טקסט ארוך דו-לשוני',
  type: 'object',
  fieldsets: englishFieldset,
  fields: [
    defineField({ name: 'he', title: 'עברית', type: 'text', rows: 3 }),
    defineField({ name: 'en', title: 'English', type: 'text', rows: 3, fieldset: 'english' }),
  ],
});

const blockMember = defineArrayMember({
  type: 'block',
  styles: [
    { title: 'רגיל', value: 'normal' },
    { title: 'כותרת 2', value: 'h2' },
    { title: 'כותרת 3', value: 'h3' },
  ],
  lists: [
    { title: 'תבליטים', value: 'bullet' },
    { title: 'מספור', value: 'number' },
  ],
  marks: {
    decorators: [
      { title: 'מודגש', value: 'strong' },
      { title: 'נטוי', value: 'em' },
    ],
    annotations: [
      {
        name: 'link',
        type: 'object',
        title: 'קישור',
        fields: [
          defineField({
            name: 'href',
            type: 'url',
            title: 'כתובת',
            validation: (rule) => rule.uri({ scheme: ['http', 'https', 'mailto', 'tel'], allowRelative: true }),
          }),
        ],
      },
    ],
  },
});

export const localeBlock = defineType({
  name: 'localeBlock',
  title: 'תוכן עשיר דו-לשוני',
  type: 'object',
  fieldsets: englishFieldset,
  fields: [
    defineField({ name: 'he', title: 'עברית', type: 'array', of: [blockMember] }),
    defineField({ name: 'en', title: 'English', type: 'array', of: [blockMember], fieldset: 'english' }),
  ],
});
