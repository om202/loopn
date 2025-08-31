import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

const client = new BedrockRuntimeClient({ region: 'us-east-1' });

interface EmbeddingRequest {
  text: string;
}

interface EmbeddingResult {
  embedding: number[];
  dimensions: number;
  inputLength: number;
}

// Simple handler like resume parser - no success/error wrapping
export const handler = async (event: {
  arguments: EmbeddingRequest;
}): Promise<EmbeddingResult> => {
  console.log('Embedding generator called with:', event.arguments);

  const { text } = event.arguments;

  if (!text || typeof text !== 'string') {
    throw new Error('Text is required and must be a string');
  }

  // Clean and prepare text
  const cleanText = text.replace(/\s+/g, ' ').trim().substring(0, 8000);

  if (cleanText.length < 10) {
    throw new Error('Text too short for meaningful embedding');
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
    throw new Error('Empty response from Bedrock');
  }

  const result = JSON.parse(new TextDecoder().decode(response.body));

  if (!result.embedding || !Array.isArray(result.embedding)) {
    throw new Error('Invalid embedding response format');
  }

  if (result.embedding.length !== 1024) {
    throw new Error(`Expected 1024 dimensions, got ${result.embedding.length}`);
  }

  console.log(
    'Successfully generated embedding with',
    result.embedding.length,
    'dimensions'
  );

  // Return data directly like resume parser
  return {
    embedding: result.embedding,
    dimensions: result.embedding.length,
    inputLength: cleanText.length,
  };
};
