import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';

import { auth } from './auth/resource';
import { data } from './data/resource';
import { presenceCleanup } from './functions/presence-cleanup/resource';
import { aiSummaryGenerator } from './functions/ai-summary-generator/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  presenceCleanup,
  aiSummaryGenerator,
});

// Grant the AI summary generator function permission to invoke Bedrock models
backend.aiSummaryGenerator.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['bedrock:InvokeModel'],
    resources: [
      'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0',
    ],
  })
);
