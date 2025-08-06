import { defineFunction } from '@aws-amplify/backend';

export const aiSummaryGenerator = defineFunction({
  name: 'ai-summary-generator',
  entry: './handler.ts',
  timeoutSeconds: 60,
  environment: {
    MODEL_ID: 'anthropic.claude-3-haiku-20240307-v1:0',
  },
});
