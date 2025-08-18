import { Stack } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';

/**
 * Vespa AI Search Infrastructure
 *
 * This replaces the OpenSearch Serverless setup with Vespa AI.
 * We'll use Vespa Cloud for managed deployment and scaling.
 *
 * Setup Instructions:
 * 1. Sign up for Vespa Cloud at https://cloud.vespa.ai/
 * 2. Create a new application
 * 3. Get your application endpoint and API key
 * 4. Store them in AWS Systems Manager Parameter Store
 */

export function defineVespa(stack: Stack, lambdaRole?: iam.IRole) {
  // Generate unique resource names based on stack to avoid conflicts
  const stackHash = stack.stackName
    .slice(-8)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  // Store Vespa configuration in Parameter Store
  // These will need to be manually set after creating Vespa Cloud application
  const vespaEndpointParam = new ssm.StringParameter(
    stack,
    'VespaEndpointParameter',
    {
      parameterName: `/loopn/${stackHash}/vespa/endpoint`,
      stringValue: 'https://efae9912.af0cd1d2.z.vespa-app.cloud',
      description: 'Vespa Cloud application endpoint',
    }
  );

  const vespaTokenParam = new ssm.StringParameter(
    stack,
    'VespaTokenParameter',
    {
      parameterName: `/loopn/${stackHash}/vespa/token`,
      stringValue: 'vespa-token-placeholder',
      description: 'Vespa Cloud API token for authentication',
    }
  );

  // Grant Lambda function permission to read Vespa configuration
  if (lambdaRole) {
    const vespaPolicy = new iam.Policy(stack, 'VespaParameterPolicy', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['ssm:GetParameter', 'ssm:GetParameters'],
          resources: [
            vespaEndpointParam.parameterArn,
            vespaTokenParam.parameterArn,
          ],
        }),
      ],
    });

    vespaPolicy.attachToRole(lambdaRole);
  }

  return {
    endpointParameter: vespaEndpointParam,
    tokenParameter: vespaTokenParam,
    endpointParameterName: vespaEndpointParam.parameterName,
    tokenParameterName: vespaTokenParam.parameterName,
  };
}
