import { defineFunction } from '@aws-amplify/backend';

export const embeddingGenerator = defineFunction({
  name: 'embedding-generator',
  entry: './handler.ts',
  runtime: 20,
  timeoutSeconds: 60, // Allow up to 60 seconds for embedding generation
  memoryMB: 512,
  environment: {
    // AWS SDK will use the function's execution role automatically
  },
});
