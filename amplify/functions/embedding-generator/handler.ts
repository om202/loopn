import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

const client = new BedrockRuntimeClient({ region: 'us-east-1' });

interface EmbeddingRequest {
  text: string;
  action: string;
}

interface EmbeddingResponse {
  success: boolean;
  data?: {
    embedding?: number[];
    dimensions?: number;
    inputLength?: number;
    sampleValues?: number[];
    vectorNorm?: number;
  };
  error?: string;
}

// GraphQL resolver handler for Amplify (following resume parser pattern)
export const handler = async (event: {
  arguments: EmbeddingRequest;
}): Promise<EmbeddingResponse> => {
  try {
    console.log('Lambda event received:', JSON.stringify(event, null, 2));

    const request = event.arguments as EmbeddingRequest;
    const { text, action } = request;

    if (action === 'generate') {
      // Generate embedding for text
      if (!text || typeof text !== 'string') {
        return {
          success: false,
          error: 'Text is required and must be a string',
        };
      }

      // Clean and prepare text
      const cleanText = text.replace(/\s+/g, ' ').trim().substring(0, 8000);

      if (cleanText.length < 10) {
        return {
          success: false,
          error: 'Text too short for meaningful embedding',
        };
      }

      console.log('Generating embedding for text length:', cleanText.length);

      const command = new InvokeModelCommand({
        modelId: 'amazon.titan-embed-text-v2:0',
        body: JSON.stringify({
          inputText: cleanText,
          dimensions: 1024,
          normalize: true,
        }),
      });

      const response = await client.send(command);

      if (!response.body) {
        return {
          success: false,
          error: 'Empty response from Bedrock',
        };
      }

      const result = JSON.parse(new TextDecoder().decode(response.body));

      if (!result.embedding || !Array.isArray(result.embedding)) {
        return {
          success: false,
          error: 'Invalid embedding response format',
        };
      }

      if (result.embedding.length !== 1024) {
        return {
          success: false,
          error: `Expected 1024 dimensions, got ${result.embedding.length}`,
        };
      }

      console.log(
        'Successfully generated embedding with',
        result.embedding.length,
        'dimensions'
      );

      return {
        success: true,
        data: {
          embedding: result.embedding,
          dimensions: result.embedding.length,
          inputLength: cleanText.length,
        },
      };
    } else if (action === 'test') {
      // Test the service
      const testText = 'Software engineer with React and Node.js experience';

      console.log('Testing embedding service...');

      const command = new InvokeModelCommand({
        modelId: 'amazon.titan-embed-text-v2:0',
        body: JSON.stringify({
          inputText: testText,
          dimensions: 1024,
          normalize: true,
        }),
      });

      const response = await client.send(command);

      if (!response.body) {
        return {
          success: false,
          error: 'Empty response from Bedrock during test',
        };
      }

      const result = JSON.parse(new TextDecoder().decode(response.body));

      if (!result.embedding || !Array.isArray(result.embedding)) {
        return {
          success: false,
          error: 'Invalid embedding response format during test',
        };
      }

      console.log(
        'Test successful with',
        result.embedding.length,
        'dimensions'
      );

      return {
        success: true,
        data: {
          dimensions: result.embedding.length,
          sampleValues: result.embedding.slice(0, 5),
          vectorNorm: Math.sqrt(
            result.embedding.reduce(
              (sum: number, val: number) => sum + val * val,
              0
            )
          ),
        },
      };
    } else {
      return {
        success: false,
        error: 'Invalid action. Use "generate" or "test"',
      };
    }
  } catch (error) {
    console.error('Embedding generation error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      error: `Embedding generation failed: ${errorMessage}`,
    };
  }
};
