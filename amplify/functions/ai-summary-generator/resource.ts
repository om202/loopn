import { defineFunction } from '@aws-amplify/backend';

export const aiSummaryGenerator = defineFunction({
  name: 'ai-summary-generator',
  entry: './handler.ts',
  timeoutSeconds: 60,
  environment: {
    MODEL_ID: 'amazon.titan-text-lite-v1',
  },
});
