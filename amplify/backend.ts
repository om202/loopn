import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';

import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { presenceCleanup } from './functions/presence-cleanup/resource';
import { vectorSearch } from './functions/vector-search/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  storage,
  presenceCleanup,
  vectorSearch,
});

// Add IAM permissions for Bedrock access
backend.vectorSearch.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
    resources: [
      'arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0',
      'arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v1',
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
