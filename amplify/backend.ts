import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';

import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { presenceCleanup } from './functions/presence-cleanup/resource';
import { openSearchClient } from './functions/opensearch-client/resource';
import { autoConfirm } from './functions/auto-confirm/resource';
import { defineOpenSearch } from './opensearch/resource';

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
 *   - No changes needed (already at AWS minimum 128MB)
 * 
 * 🔹 500-1000 Users:
 *   - openSearchClient: memoryMB: 128 → 256
 *   - presenceCleanup: memoryMB: 128 → 256, schedule: 'every 5m' → 'every 2m'
 *   - OpenSearch replicas: 0 → 1 (for production reliability)
 * 
 * 🔸 1000+ Users:
 *   - openSearchClient: memoryMB: 256 → 512
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
  openSearchClient,
  autoConfirm,
});

// Set up OpenSearch Serverless in the search stack to avoid circular dependency
const openSearchResources = defineOpenSearch(
  backend.openSearchClient.resources.cfnResources.cfnFunction.stack,
  backend.openSearchClient.resources.lambda.role
);

// Add IAM permissions for OpenSearch Serverless access
backend.openSearchClient.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['aoss:APIAccessAll', 'aoss:DashboardsAccessAll'],
    resources: [openSearchResources.collection.attrArn],
  })
);

// Pass OpenSearch endpoint as environment variable
backend.openSearchClient.addEnvironment(
  'OPENSEARCH_ENDPOINT',
  openSearchResources.endpoint
);

// Add environment variable to control email verification
// Set to 'true' to disable email verification (for testing)
// Set to 'false' to enable normal email verification (for production)
backend.autoConfirm.addEnvironment(
  'DISABLE_EMAIL_VERIFICATION',
  'true' // Manually change this value as needed
);
