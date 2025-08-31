import { getClient } from '../lib/amplify-config';
import { EmbeddingService } from './embedding.service';
import { EmbeddingManager } from './embedding-manager.service';
import type {
  SearchOptions,
  SearchResponse,
  SearchResult,
  SearchMetrics,
  SearchError,
  SearchErrorType,
  ParsedEmbedding,
} from '../types/search.types';

// type UserProfile = Schema['UserProfile']['type'];

/**
 * RAG (Retrieval-Augmented Generation) Search Service
 * Provides semantic search across user profiles using embedding similarity
 */
export class RAGSearchService {
  /**
   * Main search function - searches profiles using natural language queries
   * @param query - Natural language search query
   * @param options - Search options and parameters
   * @returns Promise<SearchResponse> - Search results with metrics
   */
  static async searchProfiles(
    query: string,
    options: Partial<SearchOptions> = {}
  ): Promise<SearchResponse> {
    const startTime = Date.now();
    let queryEmbeddingTimeMs = 0;
    let processingTimeMs = 0;
    let fetchTimeMs = 0;

    // Validate and normalize options
    const searchOptions: SearchOptions = {
      query: query.trim(),
      limit: options.limit || 20,
      minSimilarity: options.minSimilarity || 0.3,
      includeEmbeddingText: options.includeEmbeddingText || false,
      excludeUserIds: options.excludeUserIds || [],
    };

    // Validate query
    if (!searchOptions.query || searchOptions.query.length < 3) {
      throw RAGSearchService.createSearchError(
        'INVALID_QUERY',
        'Search query must be at least 3 characters long',
        query
      );
    }

    try {
      console.log('Starting RAG search:', {
        query: searchOptions.query,
        limit: searchOptions.limit,
        minSimilarity: searchOptions.minSimilarity,
      });

      // Step 1: Convert query to embedding vector
      const embeddingStart = Date.now();
      const queryEmbedding = await EmbeddingService.generateEmbedding(
        searchOptions.query
      );
      queryEmbeddingTimeMs = Date.now() - embeddingStart;

      console.log(`Generated query embedding in ${queryEmbeddingTimeMs}ms`);

      // Step 2: Fetch all embedding chunks (lightweight operation)
      const processingStart = Date.now();
      const embeddingChunks = await EmbeddingManager.getAllEmbeddings();

      if (embeddingChunks.length === 0) {
        console.warn('No profile embeddings found in database');
        return RAGSearchService.createEmptyResponse(
          searchOptions.query,
          queryEmbeddingTimeMs
        );
      }

      console.log(`Fetched ${embeddingChunks.length} embedding chunks`);

      // Step 3: Parse embeddings and calculate similarities
      const parsedEmbeddings =
        RAGSearchService.parseEmbeddings(embeddingChunks);
      const matchedChunks = RAGSearchService.calculateSimilarities(
        queryEmbedding,
        parsedEmbeddings,
        searchOptions
      );

      processingTimeMs = Date.now() - processingStart;
      console.log(
        `Processed similarities in ${processingTimeMs}ms, found ${matchedChunks.length} matches`
      );

      // Step 4: Sort by similarity and apply limit
      const topChunks = matchedChunks
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, searchOptions.limit);

      if (topChunks.length === 0) {
        console.log('No matches found above similarity threshold');
        return RAGSearchService.createEmptyResponse(
          searchOptions.query,
          queryEmbeddingTimeMs,
          processingTimeMs
        );
      }

      // Step 5: Batch fetch real profile data for top matches only
      const fetchStart = Date.now();
      const results = await RAGSearchService.fetchProfileResults(
        topChunks,
        searchOptions
      );
      fetchTimeMs = Date.now() - fetchStart;

      console.log(
        `Fetched ${results.length} profile results in ${fetchTimeMs}ms`
      );

      // Step 6: Build response with metrics
      const metrics: SearchMetrics = {
        totalProcessed: embeddingChunks.length,
        totalMatched: matchedChunks.length,
        queryEmbeddingTimeMs,
        processingTimeMs,
        fetchTimeMs,
      };

      const response: SearchResponse = {
        results,
        metrics,
        query: searchOptions.query,
        totalFound: matchedChunks.length,
      };

      console.log('RAG search completed:', {
        query: searchOptions.query,
        resultsReturned: results.length,
        totalMatched: matchedChunks.length,
        totalTime: Date.now() - startTime,
        metrics,
      });

      return response;
    } catch (error) {
      console.error('RAG search failed:', error);
      throw RAGSearchService.createSearchError(
        'SERVICE_UNAVAILABLE',
        error instanceof Error ? error.message : 'Unknown search error',
        query
      );
    }
  }

  /**
   * Parse embedding vectors from database records
   */
  private static parseEmbeddings(embeddingChunks: any[]): ParsedEmbedding[] {
    const parsedEmbeddings: ParsedEmbedding[] = [];

    for (const chunk of embeddingChunks) {
      try {
        const vector = JSON.parse(chunk.embeddingVector);

        if (!Array.isArray(vector) || vector.length !== 1024) {
          console.warn(
            `Invalid embedding vector for user ${chunk.userId}: expected 1024 dimensions, got ${vector?.length}`
          );
          continue;
        }

        parsedEmbeddings.push({
          userId: chunk.userId,
          vector: vector,
          text: chunk.embeddingText || '',
          version: chunk.profileVersion || '',
        });
      } catch (parseError) {
        console.error(
          `Failed to parse embedding for user ${chunk.userId}:`,
          parseError
        );
        // Skip corrupted embeddings gracefully
      }
    }

    return parsedEmbeddings;
  }

  /**
   * Calculate cosine similarities between query and all profile embeddings
   */
  private static calculateSimilarities(
    queryEmbedding: number[],
    parsedEmbeddings: ParsedEmbedding[],
    options: SearchOptions
  ): Array<{ userId: string; similarity: number; embeddingText?: string }> {
    const matchedChunks: Array<{
      userId: string;
      similarity: number;
      embeddingText?: string;
    }> = [];

    for (const embedding of parsedEmbeddings) {
      // Skip excluded users
      if (options.excludeUserIds?.includes(embedding.userId)) {
        continue;
      }

      try {
        const similarity = EmbeddingService.calculateCosineSimilarity(
          queryEmbedding,
          embedding.vector
        );

        // Only include results above similarity threshold
        if (similarity >= options.minSimilarity!) {
          const match: {
            userId: string;
            similarity: number;
            embeddingText?: string;
          } = {
            userId: embedding.userId,
            similarity: similarity,
          };

          if (options.includeEmbeddingText) {
            match.embeddingText = embedding.text;
          }

          matchedChunks.push(match);
        }
      } catch (similarityError) {
        console.error(
          `Similarity calculation failed for user ${embedding.userId}:`,
          similarityError
        );
        // Skip this embedding and continue
      }
    }

    return matchedChunks;
  }

  /**
   * Fetch full profile data for matched results
   */
  private static async fetchProfileResults(
    topChunks: Array<{
      userId: string;
      similarity: number;
      embeddingText?: string;
    }>,
    options: SearchOptions
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const client = getClient();

    // Batch fetch all profile data in parallel
    const profilePromises = topChunks.map(chunk =>
      client.models.UserProfile.get({ userId: chunk.userId }).catch(error => {
        console.error(
          `Failed to fetch profile for user ${chunk.userId}:`,
          error
        );
        return { data: null, error: error.message };
      })
    );

    const profiles = await Promise.all(profilePromises);

    // Combine similarity scores with profile data
    for (let i = 0; i < profiles.length; i++) {
      if (profiles[i].data) {
        const result: SearchResult = {
          userId: topChunks[i].userId,
          profile: profiles[i].data!,
          similarity: topChunks[i].similarity,
        };

        if (options.includeEmbeddingText && topChunks[i].embeddingText) {
          result.embeddingText = topChunks[i].embeddingText;
        }

        results.push(result);
      }
    }

    return results;
  }

  /**
   * Create empty search response
   */
  private static createEmptyResponse(
    query: string,
    queryEmbeddingTimeMs: number = 0,
    processingTimeMs: number = 0
  ): SearchResponse {
    return {
      results: [],
      metrics: {
        totalProcessed: 0,
        totalMatched: 0,
        queryEmbeddingTimeMs,
        processingTimeMs,
        fetchTimeMs: 0,
      },
      query,
      totalFound: 0,
    };
  }

  /**
   * Create standardized search error
   */
  private static createSearchError(
    type: SearchErrorType,
    message: string,
    query?: string,
    userId?: string
  ): SearchError {
    return {
      type,
      message,
      query,
      userId,
      timestamp: new Date().toISOString(),
      details: null,
    } as any; // Cast to bypass Promise return type issue
  }

  /**
   * Get search suggestions based on common queries or profile content
   * @param partial - Partial query to suggest completions for
   * @returns Promise<string[]> - Array of suggested queries
   */
  static async getSearchSuggestions(partial: string): Promise<string[]> {
    // Basic suggestions - could be enhanced with ML later
    const commonQueries = [
      'React developers',
      'Python engineers',
      'UX designers',
      'Product managers',
      'Data scientists',
      'Full stack developers',
      'Frontend engineers',
      'Backend developers',
      'Mobile developers',
      'DevOps engineers',
      'Machine learning engineers',
      'Software architects',
    ];

    const filtered = commonQueries
      .filter(query => query.toLowerCase().includes(partial.toLowerCase()))
      .slice(0, 5);

    return filtered;
  }

  /**
   * Test the search service with a sample query
   * @param testQuery - Optional test query
   * @returns Promise<boolean> - True if search is working
   */
  static async testSearch(
    testQuery: string = 'software engineer'
  ): Promise<boolean> {
    try {
      const response = await RAGSearchService.searchProfiles(testQuery, {
        limit: 5,
      });

      console.log('Search service test results:', {
        query: testQuery,
        resultsCount: response.results.length,
        totalProcessed: response.metrics.totalProcessed,
        totalTime:
          response.metrics.queryEmbeddingTimeMs +
          response.metrics.processingTimeMs +
          response.metrics.fetchTimeMs,
      });

      return true;
    } catch (error) {
      console.error('Search service test failed:', error);
      return false;
    }
  }
}
