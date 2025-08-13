import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';

import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { presenceCleanup } from './functions/presence-cleanup/resource';
import { vectorSearch } from './functions/vector-search/resource';
import { autoConfirm } from './functions/auto-confirm/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  storage,
  presenceCleanup,
  vectorSearch,
  autoConfirm,
});

// Add IAM permissions for Bedrock access
backend.vectorSearch.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'bedrock:InvokeModel',
      'bedrock:InvokeModelWithResponseStream',
      'bedrock:ListFoundationModels',
      'bedrock:GetModelInvocationLoggingConfiguration',
    ],
    resources: [
      // Allow all Bedrock foundation models across regions
      'arn:aws:bedrock:*::foundation-model/*',
      '*',
    ],
  })
);

// Grant permissions to interact with data models
backend.vectorSearch.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'dynamodb:Query',
      'dynamodb:GetItem',
      'dynamodb:Scan',
      'dynamodb:UpdateItem',
    ],
    resources: [
      backend.data.resources.tables['UserProfile'].tableArn,
      `${backend.data.resources.tables['UserProfile'].tableArn}/index/*`,
    ],
  })
);

// Pass the table name as environment variable
backend.vectorSearch.addEnvironment(
  'USER_PROFILE_TABLE',
  backend.data.resources.tables['UserProfile'].tableName
);

// Add environment variable to control email verification
// Set to 'true' to disable email verification (for testing)
// Set to 'false' to enable normal email verification (for production)
backend.autoConfirm.addEnvironment(
  'DISABLE_EMAIL_VERIFICATION',
  'true' // Manually change this value as needed
);
