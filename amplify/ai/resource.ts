import { defineFunction } from '@aws-amplify/backend';
import {
  Role,
  ServicePrincipal,
  PolicyStatement,
  Effect,
} from 'aws-cdk-lib/aws-iam';
import {
  CfnCollection,
  CfnSecurityPolicy,
  CfnAccessPolicy,
} from 'aws-cdk-lib/aws-opensearchserverless';
import { Construct } from 'constructs';
import { Stack } from 'aws-cdk-lib';

export const vectorSearchFunction = defineFunction({
  name: 'vector-search',
  entry: './functions/vector-search/handler.ts',
  runtime: 'nodejs20.x',
  timeoutSeconds: 300,
  memoryMB: 512,
});

export class VectorSearchResources extends Construct {
  public readonly collectionEndpoint: string;
  public readonly collectionArn: string;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const stack = Stack.of(this);
    const region = stack.region;
    const account = stack.account;

    // Create security policy for the OpenSearch Serverless collection
    const securityPolicy = new CfnSecurityPolicy(
      this,
      'VectorSearchSecurityPolicy',
      {
        name: 'loopn-vector-search-security-policy',
        type: 'security',
        policy: JSON.stringify({
          Rules: [
            {
              ResourceType: 'collection',
              Resource: ['collection/loopn-vector-search'],
              SAML: {
                UserAttribute: '',
                GroupAttribute: '',
              },
            },
          ],
          AWSOIDCIdentityProvider: {
            Enabled: true,
          },
        }),
      }
    );

    // Create network policy for the OpenSearch Serverless collection
    const networkPolicy = new CfnSecurityPolicy(
      this,
      'VectorSearchNetworkPolicy',
      {
        name: 'loopn-vector-search-network-policy',
        type: 'network',
        policy: JSON.stringify([
          {
            Rules: [
              {
                ResourceType: 'collection',
                Resource: ['collection/loopn-vector-search'],
              },
              {
                ResourceType: 'dashboard',
                Resource: ['collection/loopn-vector-search'],
              },
            ],
            AllowFromPublic: true,
          },
        ]),
      }
    );

    // Create the OpenSearch Serverless collection
    const collection = new CfnCollection(this, 'VectorSearchCollection', {
      name: 'loopn-vector-search',
      type: 'VECTORSEARCH',
      description:
        'Vector search collection for Loopn natural language user search',
    });

    collection.addDependency(securityPolicy);
    collection.addDependency(networkPolicy);

    // Create access policy for the collection
    const accessPolicy = new CfnAccessPolicy(this, 'VectorSearchAccessPolicy', {
      name: 'loopn-vector-search-access-policy',
      type: 'data',
      policy: JSON.stringify([
        {
          Rules: [
            {
              Resource: [`collection/loopn-vector-search`],
              Permission: [
                'aoss:CreateCollectionItems',
                'aoss:DeleteCollectionItems',
                'aoss:UpdateCollectionItems',
                'aoss:DescribeCollectionItems',
              ],
              ResourceType: 'collection',
            },
            {
              Resource: [`index/loopn-vector-search/*`],
              Permission: [
                'aoss:CreateIndex',
                'aoss:DeleteIndex',
                'aoss:UpdateIndex',
                'aoss:DescribeIndex',
                'aoss:ReadDocument',
                'aoss:WriteDocument',
              ],
              ResourceType: 'index',
            },
          ],
          Principal: [
            `arn:aws:iam::${account}:root`,
            vectorSearchFunction.resources.lambda.role?.roleArn || '',
          ],
        },
      ]),
    });

    accessPolicy.addDependency(collection);

    this.collectionEndpoint = collection.attrCollectionEndpoint;
    this.collectionArn = collection.attrArn;

    // Grant the Lambda function permissions to access Bedrock
    vectorSearchFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
        ],
        resources: [
          `arn:aws:bedrock:${region}::foundation-model/amazon.titan-embed-text-v2:0`,
          `arn:aws:bedrock:${region}::foundation-model/amazon.titan-embed-text-v1`,
        ],
      })
    );

    // Grant the Lambda function permissions to access OpenSearch Serverless
    vectorSearchFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['aoss:APIAccessAll'],
        resources: [collection.attrArn],
      })
    );
  }
}
