import * as opensearch from 'aws-cdk-lib/aws-opensearchserverless';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Stack } from 'aws-cdk-lib';

export function defineOpenSearch(stack: Stack, lambdaRole?: iam.IRole) {
  // Create OpenSearch Serverless collection for auto-scaling
  const userSearchCollection = new opensearch.CfnCollection(
    stack,
    'UserSearchCollection',
    {
      name: 'user-search',
      type: 'VECTORSEARCH',
      description: 'Vector search collection for user profiles',
    }
  );

  // Create security policy for the collection
  const securityPolicy = new opensearch.CfnSecurityPolicy(
    stack,
    'UserSearchSecurityPolicy',
    {
      name: 'user-search-security-policy',
      type: 'encryption',
      policy: JSON.stringify({
        Rules: [
          {
            ResourceType: 'collection',
            Resource: [`collection/user-search`],
          },
        ],
        AWSOwnedKey: true,
      }),
    }
  );

  // Network policy for VPC access
  const networkPolicy = new opensearch.CfnSecurityPolicy(
    stack,
    'UserSearchNetworkPolicy',
    {
      name: 'user-search-network-policy',
      type: 'network',
      policy: JSON.stringify([
        {
          Rules: [
            {
              ResourceType: 'collection',
              Resource: [`collection/user-search`],
            },
            {
              ResourceType: 'dashboard',
              Resource: [`collection/user-search`],
            },
          ],
          AllowFromPublic: true,
        },
      ]),
    }
  );

  // Data access policy
  const dataAccessPolicy = new opensearch.CfnAccessPolicy(
    stack,
    'UserSearchDataAccessPolicy',
    {
      name: 'user-search-data-access-policy',
      type: 'data',
      policy: JSON.stringify([
        {
          Rules: [
            {
              ResourceType: 'collection',
              Resource: [`collection/user-search`],
              Permission: [
                'aoss:CreateCollectionItems',
                'aoss:DeleteCollectionItems',
                'aoss:UpdateCollectionItems',
                'aoss:DescribeCollectionItems',
              ],
            },
            {
              ResourceType: 'index',
              Resource: [`index/user-search/*`],
              Permission: [
                'aoss:CreateIndex',
                'aoss:DeleteIndex',
                'aoss:UpdateIndex',
                'aoss:DescribeIndex',
                'aoss:ReadDocument',
                'aoss:WriteDocument',
              ],
            },
          ],
          Principal: lambdaRole ? [lambdaRole.roleArn] : ['*'],
        },
      ]),
    }
  );

  // Dependencies
  userSearchCollection.addDependency(securityPolicy);
  userSearchCollection.addDependency(networkPolicy);
  userSearchCollection.addDependency(dataAccessPolicy);

  return {
    collection: userSearchCollection,
    endpoint: userSearchCollection.attrCollectionEndpoint,
  };
}
