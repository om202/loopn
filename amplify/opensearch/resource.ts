import * as opensearch from 'aws-cdk-lib/aws-opensearchserverless';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Stack, RemovalPolicy } from 'aws-cdk-lib';

export function defineOpenSearch(stack: Stack, lambdaRole?: iam.IRole) {
  // Generate unique resource names based on stack to avoid conflicts
  const stackHash = stack.stackName.slice(-8).toLowerCase();
  const collectionName = `user-search-${stackHash}`;
  
  // Create security policy for the collection
  const securityPolicy = new opensearch.CfnSecurityPolicy(
    stack,
    'UserSearchSecurityPolicy',
    {
      name: `user-search-security-policy-${stackHash}`,
      type: 'encryption',
      policy: JSON.stringify({
        ResourceType: 'collection',
        Resource: [`collection/${collectionName}`],
        AWSOwnedKey: true
      }),
    }
  );

  // Network policy for VPC access
  const networkPolicy = new opensearch.CfnSecurityPolicy(
    stack,
    'UserSearchNetworkPolicy',
    {
      name: `user-search-network-policy-${stackHash}`,
      type: 'network',
      policy: JSON.stringify([
        {
          Rules: [
            {
              ResourceType: 'collection',
              Resource: [`collection/${collectionName}`],
            },
            {
              ResourceType: 'dashboard',
              Resource: [`collection/${collectionName}`],
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
      name: `user-search-data-access-policy-${stackHash}`,
      type: 'data',
      policy: JSON.stringify([
        {
          Rules: [
            {
              ResourceType: 'collection',
              Resource: [`collection/${collectionName}`],
              Permission: [
                'aoss:CreateCollectionItems',
                'aoss:DeleteCollectionItems',
                'aoss:UpdateCollectionItems',
                'aoss:DescribeCollectionItems',
              ],
            },
            {
              ResourceType: 'index',
              Resource: [`index/${collectionName}/*`],
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

  // Create OpenSearch Serverless collection for auto-scaling
  const userSearchCollection = new opensearch.CfnCollection(
    stack,
    'UserSearchCollection',
    {
      name: collectionName,
      type: 'VECTORSEARCH',
      description: 'Vector search collection for user profiles',
    }
  );

  // Apply removal policy to handle resource replacement
  userSearchCollection.applyRemovalPolicy(RemovalPolicy.DESTROY);
  
  // Dependencies
  userSearchCollection.addDependency(securityPolicy);
  userSearchCollection.addDependency(networkPolicy);
  userSearchCollection.addDependency(dataAccessPolicy);

  return {
    collection: userSearchCollection,
    endpoint: userSearchCollection.attrCollectionEndpoint,
  };
}
