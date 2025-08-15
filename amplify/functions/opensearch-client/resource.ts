import { defineFunction } from '@aws-amplify/backend';

export const openSearchClient = defineFunction({
  entry: './handler.ts',
  timeoutSeconds: 15, // Reduced from 30s - search should be fast
  memoryMB: 128,      // Reduced from 256MB - sufficient for search operations
  resourceGroupName: 'search',
});
