import { defineFunction } from '@aws-amplify/backend';

export const aiSummaryGenerator = defineFunction({
  name: 'ai-summary-generator',
  entry: './handler.ts',
  timeoutSeconds: 60,
  environment: {
    MODEL_ID: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  },
});
