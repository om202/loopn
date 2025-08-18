import { defineFunction } from '@aws-amplify/backend';

export const vespaClient = defineFunction({
  name: 'vespa-client',
  entry: './handler.ts',
  environment: {
    STACK_HASH: process.env.STACK_HASH || 'default',
  },
  runtime: 18,
  timeoutSeconds: 30,
  memoryMB: 256, // Increased from OpenSearch client for better performance
});
