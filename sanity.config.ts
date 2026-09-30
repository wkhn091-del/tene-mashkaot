'use client';

import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { apiVersion, dataset, projectId } from './src/sanity/env';
import { schemaTypes, SINGLETON_TYPES } from './src/sanity/schemaTypes';
import { structure } from './src/sanity/structure';

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
    templates: (templates) => templates.filter(({ schemaType }) => !singletons.has(schemaType)),
  },
  document: {
    actions: (input, context) =>
      singletons.has(context.schemaType) ? input.filter(({ action }) => action && singletonActions.has(action)) : input,
    newDocumentOptions: (prev, { creationContext }) =>
      creationContext.type === 'global'
        ? prev.filter((item) => !singletons.has(item.templateId) && item.templateId !== 'order' && item.templateId !== 'eventInquiry')
        : prev,
  },
  plugins: [structureTool({ structure }), visionTool({ defaultApiVersion: apiVersion })],
});
