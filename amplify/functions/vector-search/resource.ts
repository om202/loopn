import { defineFunction } from '@aws-amplify/backend';

export const vectorSearch = defineFunction({
  name: 'vector-search',
  entry: './handler.ts',
  runtime: 'nodejs20.x',
  timeoutSeconds: 300,
  memoryMB: 512,
});
