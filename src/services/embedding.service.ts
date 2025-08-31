import { getClient } from '../lib/amplify-config';

/**
 * Service for generating embeddings using AWS Bedrock Titan Text v2 via Lambda
 * Used for semantic search (RAG) functionality across user profiles
 */
export class EmbeddingService {
  /**
   * Generate embedding vector from profile text using AWS Lambda + Bedrock Titan Text v2
   * @param profileText - The text content to embed
   * @returns Promise<number[]> - Array of 1024 floating point numbers
   * @throws Error if embedding generation fails
   */
  static async generateEmbedding(profileText: string): Promise<number[]> {
    try {
      // Clean and prepare text for embedding
      const cleanText = profileText
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()
        .substring(0, 8000); // Cap at 8K characters (Titan v2 limit)

      if (!cleanText || cleanText.length < 2) {
        throw new Error(
          'Text too short for meaningful embedding (minimum 2 characters)'
        );
      }

      const client = getClient();
      const response = await client.queries.generateEmbedding({
        text: cleanText,
      });

      if (!response.data) {
        throw new Error('No response data from embedding service');
      }

      // Handle different response structures
      let result: {
        embedding: number[];
        dimensions: number;
        inputLength: number;
      };

      // Check if response.data is already parsed
      if (
        typeof response.data === 'object' &&
        response.data &&
        'embedding' in response.data
      ) {
        result = response.data as {
          embedding: number[];
          dimensions: number;
          inputLength: number;
        };
      } else if (typeof response.data === 'string') {
        // If it's a string, try to parse it
        try {
          result = JSON.parse(response.data);
        } catch (e) {
          throw new Error(
            `Failed to parse response data: ${response.data}. Error: ${e}`
          );
        }
      } else {
        // Direct access as the response structure might be different
        result = response.data as {
          embedding: number[];
          dimensions: number;
          inputLength: number;
        };
      }

      if (!result.embedding || !Array.isArray(result.embedding)) {
        throw new Error('Invalid embedding response format');
      }

      if (result.embedding.length !== 1024) {
        throw new Error(
          `Expected 1024 dimensions, got ${result.embedding.length}`
        );
      }

      return result.embedding; // Array of 1024 floating point numbers
    } catch (error) {
      console.error('Error generating embedding:', error);

      if (error instanceof Error) {
        throw new Error(`Embedding generation failed: ${error.message}`);
      } else {
        throw new Error('Unknown error during embedding generation');
      }
    }
  }

  /**
   * Batch generate embeddings for multiple profile texts
   * @param profileTexts - Array of text contents to embed
   * @returns Promise<number[][]> - Array of embedding vectors
   */
  static async generateEmbeddings(profileTexts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    // Process sequentially to avoid rate limits
    for (const text of profileTexts) {
      try {
        const embedding = await EmbeddingService.generateEmbedding(text);
        embeddings.push(embedding);

        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(
          `Failed to generate embedding for text: ${text.substring(0, 100)}...`,
          error
        );
        throw error; // Re-throw to fail fast
      }
    }

    return embeddings;
  }

  /**
   * Calculate cosine similarity between two embedding vectors
   * @param vectorA - First embedding vector (1024 dimensions)
   * @param vectorB - Second embedding vector (1024 dimensions)
   * @returns number - Cosine similarity score between -1 and 1
   * @throws Error if vectors have different lengths
   */
  static calculateCosineSimilarity(
    vectorA: number[],
    vectorB: number[]
  ): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error(
        `Vector dimension mismatch: ${vectorA.length} vs ${vectorB.length}`
      );
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0; // Handle zero vectors
    }

    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));

    // Clamp to valid range [-1, 1] to handle floating point precision issues
    return Math.max(-1, Math.min(1, similarity));
  }

  /**
   * Test the embedding service with a sample text
   * @param testText - Optional test text
   * @returns Promise<boolean> - True if service is working
   */
  static async testService(
    testText: string = 'Software engineer with React and Node.js experience'
  ): Promise<boolean> {
    try {
      // Simple test - just try to generate an embedding
      const embedding = await EmbeddingService.generateEmbedding(testText);

      console.log('Embedding service test successful:', {
        dimensions: embedding.length,
        sampleValues: embedding.slice(0, 5),
        vectorNorm: Math.sqrt(
          embedding.reduce((sum, val) => sum + val * val, 0)
        ),
      });

      return true;
    } catch (error) {
      console.error('Embedding service test failed:', error);
      return false;
    }
  }
}
