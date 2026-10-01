'use client';

import { defineConfig, type ConfigContext } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { apiVersion, dataset, projectId } from './src/sanity/env';
import { schemaTypes, SINGLETON_TYPES } from './src/sanity/schemaTypes';
import { structure } from './src/sanity/structure';
import { newProductSlug } from './src/sanity/schemaTypes/documents/product';

const singletons = new Set<string>(SINGLETON_TYPES);
const singletonActions = new Set(['publish', 'discardChanges', 'restore']);

export default defineConfig({
  name: 'tene-mashkaot',
  title: 'תנא משקאות – ניהול',
  basePath: '/studio',
  projectId: projectId || 'missing-project-id',
  dataset,
  schema: {
    types: schemaTypes,
    templates: (templates) => [
      ...templates.filter(({ schemaType }) => !singletons.has(schemaType)),
      {
        id: 'product-in-category',
        title: 'מוצר בקטגוריה',
        schemaType: 'product',
        parameters: [{ name: 'categoryId', type: 'string' }],
        value: async ({ categoryId }: { categoryId: string }, { getClient }: ConfigContext) => {
          const kind = await getClient({ apiVersion }).fetch<string | null>('*[_id == $id][0].kind', { id: categoryId });
          return {
            category: { _type: 'reference', _ref: categoryId },
            kind: kind ?? undefined,
            slug: newProductSlug(),
            inStock: true,
            featured: false,
          };
        },
      },
    ],
  },
  document: {
    actions: (input, context) =>
      singletons.has(context.schemaType) ? input.filter(({ action }) => action && singletonActions.has(action)) : input,
    newDocumentOptions: (prev, { creationContext }) =>
      creationContext.type === 'global'
        ? prev.filter(
            (item) =>
              !singletons.has(item.templateId) &&
              !['order', 'eventInquiry', 'product-in-category'].includes(item.templateId),
          )
        : prev,
  },
  plugins: [structureTool({ structure }), visionTool({ defaultApiVersion: apiVersion })],
});
