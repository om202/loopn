import { defineFunction } from '@aws-amplify/backend';

export const vespaClient = defineFunction({
  name: 'vespa-client',
  entry: './handler.ts',
  runtime: 18,
  timeoutSeconds: 30,
  memoryMB: 256, // Increased from OpenSearch client for better performance
});
