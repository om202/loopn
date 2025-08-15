import { defineFunction } from '@aws-amplify/backend';

export const openSearchClient = defineFunction({
  entry: './handler.ts',
  timeoutSeconds: 15, // Reduced from 30s - search should be fast
  memoryMB: 64,       // Minimal for low user count - increase to 128MB when users > 100, 256MB when users > 1000
  resourceGroupName: 'search',
});
