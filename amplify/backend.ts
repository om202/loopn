import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';

import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { presenceCleanup } from './functions/presence-cleanup/resource';
import { openSearchClient } from './functions/opensearch-client/resource';
import { autoConfirm } from './functions/auto-confirm/resource';
import { defineOpenSearch } from './opensearch/resource';

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
