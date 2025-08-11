import { defineFunction } from '@aws-amplify/backend';

export const vectorSearch = defineFunction({
  entry: './handler.ts',
  timeoutSeconds: 300,
  memoryMB: 512,
});
