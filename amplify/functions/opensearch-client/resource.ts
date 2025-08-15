import { defineFunction } from '@aws-amplify/backend';

export const openSearchClient = defineFunction({
  entry: './handler.ts',
  timeoutSeconds: 30,
  memoryMB: 256,
  resourceGroupName: 'search',
});
