import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';

import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { presenceCleanup } from './functions/presence-cleanup/resource';
import { vespaClient } from './functions/vespa-client/resource';
import { autoConfirm } from './functions/auto-confirm/resource';
import { defineVespa } from './vespa/resource';

/*
 * 📈 SCALING CONFIGURATION GUIDE
 *
 * Current setup is optimized for LOW USER COUNT (< 50 users)
 * Now using Vespa AI for enhanced search performance and scalability
 *
 * WHEN TO SCALE UP:
 *
 * 🔹 50-100 Users:
 *   - No changes needed
 *
 * 🔸 100-500 Users:
 *   - vespaClient: memoryMB: 256 → 512 (for better vector processing)
 *
 * 🔹 500-1000 Users:
 *   - vespaClient: memoryMB: 512 → 1024
 *   - presenceCleanup: memoryMB: 128 → 256, schedule: 'every 5m' → 'every 2m'
 *   - Consider Vespa Cloud scaling options
 *
 * 🔸 1000+ Users:
 *   - vespaClient: memoryMB: 1024 → 2048
 *   - presenceCleanup: schedule: 'every 2m' → 'every 1m'
 *   - Consider DynamoDB provisioned capacity
 *   - Add CloudWatch alarms for performance monitoring
 *
 * 💰 ESTIMATED MONTHLY COSTS:
 *   - Current (< 50 users): $20-40/month (Vespa Cloud + AWS)
 *   - 100 users: $35-60/month
 *   - 500 users: $60-120/month
 *   - 1000+ users: $120-250/month
 */

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  storage,
  presenceCleanup,
  vespaClient,
  autoConfirm,
});

// Set up Vespa AI search infrastructure
const vespaResources = defineVespa(
  backend.vespaClient.resources.cfnResources.cfnFunction.stack,
  backend.vespaClient.resources.lambda.role
);

// Pass stack hash for parameter store access
backend.vespaClient.addEnvironment(
  'STACK_HASH',
  backend.vespaClient.resources.cfnResources.cfnFunction.stack.stackName
    .slice(-8)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
);

// Add environment variable to control email verification
// Set to 'true' to disable email verification (for testing)
// Set to 'false' to enable normal email verification (for production)
backend.autoConfirm.addEnvironment(
  'DISABLE_EMAIL_VERIFICATION',
  'true' // Manually change this value as needed
);
