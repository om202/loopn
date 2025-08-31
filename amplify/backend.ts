import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';

import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { presenceCleanup } from './functions/presence-cleanup/resource';
import { autoConfirm } from './functions/auto-confirm/resource';
import { resumeParser } from './functions/resume-parser/resource';

/*
 * 📈 SCALING CONFIGURATION GUIDE
 *
 * Current setup is optimized for LOW USER COUNT (< 50 users)
 *
 * WHEN TO SCALE UP:
 *
 * 🔹 50-100 Users:
 *   - No changes needed
 *
 * 🔸 100-500 Users:
 *   - presenceCleanup: memoryMB: 128 → 256, schedule: 'every 5m' → 'every 2m'
 *
 * 🔹 500-1000 Users:
 *   - presenceCleanup: schedule: 'every 2m' → 'every 1m'
 *   - Consider DynamoDB provisioned capacity
 *   - Add CloudWatch alarms for performance monitoring
 *
 * 💰 ESTIMATED MONTHLY COSTS:
 *   - Current (< 50 users): $15-30/month
 *   - 100 users: $25-50/month
 *   - 500 users: $50-100/month
 *   - 1000+ users: $100-200/month
 */

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  storage,
  presenceCleanup,
  autoConfirm,
  resumeParser,
});

// Add Bedrock permissions to resume parser
backend.resumeParser.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['bedrock:InvokeModel'],
    resources: [
      'arn:aws:bedrock:*:*:foundation-model/anthropic.claude-3-5-haiku-20241022-v1:0',
      'arn:aws:bedrock:*:*:inference-profile/us.anthropic.claude-3-5-haiku-20241022-v1:0',
    ],
  })
);

// Add environment variable to control email verification
// Set to 'true' to disable email verification (for testing)
// Set to 'false' to enable normal email verification (for production)
backend.autoConfirm.addEnvironment(
  'DISABLE_EMAIL_VERIFICATION',
  'true' // Manually change this value as needed
);
