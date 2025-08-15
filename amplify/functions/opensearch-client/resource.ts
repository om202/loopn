import { defineFunction } from '@aws-amplify/backend';

export const openSearchClient = defineFunction({
  entry: './handler.ts',
  timeoutSeconds: 15, // Reduced from 30s - search should be fast
  memoryMB: 128, // AWS minimum - increase to 256MB when users > 500, 512MB when users > 1000
  resourceGroupName: 'search',
});
