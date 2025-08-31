import { getClient } from '../lib/amplify-config';
import { EmbeddingService } from './embedding.service';
import { EmbeddingManager } from './embedding-manager.service';
import { BM25SearchService } from './bm25-search.service';
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
   * Main search function - hybrid search using Vector + BM25
   * @param query - Natural language search query
   * @param options - Search options and parameters
   * @returns Promise<SearchResponse> - Search results with metrics
   */
  static async searchProfiles(
    query: string,
    options: Partial<SearchOptions> = {}
  ): Promise<SearchResponse> {
    let queryEmbeddingTimeMs = 0;
    let bm25SearchTimeMs = 0;
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
      const processingStart = Date.now();

      // Step 1: Run both searches in parallel
      console.log(`Starting hybrid search for: "${searchOptions.query}"`);

      const [queryEmbedding, bm25Results, embeddingChunks] = await Promise.all([
        // Vector search: Generate query embedding
        (async () => {
          const start = Date.now();
          const embedding = await EmbeddingService.generateEmbedding(
            searchOptions.query
          );
          queryEmbeddingTimeMs = Date.now() - start;
          return embedding;
        })(),

        // BM25 search: Get keyword-based results
        (async () => {
          const start = Date.now();
          const results = BM25SearchService.search(
            searchOptions.query,
            (searchOptions.limit || 20) * 2
          );
          bm25SearchTimeMs = Date.now() - start;
          return results;
        })(),

        // Get all embeddings for vector search
        EmbeddingManager.getAllEmbeddings(),
      ]);

      if (embeddingChunks.length === 0) {
        console.warn('No profile embeddings found in database');
        return RAGSearchService.createEmptyResponse(
          searchOptions.query,
          queryEmbeddingTimeMs
        );
      }

      // Step 2: Vector search - calculate similarities
      const parsedEmbeddings =
        RAGSearchService.parseEmbeddings(embeddingChunks);
      const vectorResults = RAGSearchService.calculateSimilarities(
        queryEmbedding,
        parsedEmbeddings,
        searchOptions
      );

      // Step 3: Combine and score results using hybrid approach
      const hybridResults = RAGSearchService.combineHybridResults(
        vectorResults,
        bm25Results,
        searchOptions.query,
        searchOptions
      );

      processingTimeMs = Date.now() - processingStart;

      if (hybridResults.length === 0) {
        console.log('No hybrid matches found');
        return RAGSearchService.createEmptyResponse(
          searchOptions.query,
          queryEmbeddingTimeMs,
          processingTimeMs
        );
      }

      // Step 4: Batch fetch real profile data for top matches
      const fetchStart = Date.now();
      const results = await RAGSearchService.fetchProfileResults(
        hybridResults.slice(0, searchOptions.limit),
        searchOptions
      );
      fetchTimeMs = Date.now() - fetchStart;

      // Step 5: Build response with hybrid metrics
      const metrics: SearchMetrics = {
        totalProcessed: embeddingChunks.length,
        totalMatched: hybridResults.length,
        queryEmbeddingTimeMs,
        processingTimeMs: processingTimeMs + bm25SearchTimeMs, // Include BM25 time
        fetchTimeMs,
      };

      const response: SearchResponse = {
        results,
        metrics,
        query: searchOptions.query,
        totalFound: hybridResults.length,
      };

      console.log(
        `Hybrid search completed: ${results.length} results in ${
          queryEmbeddingTimeMs +
          processingTimeMs +
          bm25SearchTimeMs +
          fetchTimeMs
        }ms`
      );

      return response;
    } catch (error) {
      console.error('Hybrid search failed:', error);
      throw RAGSearchService.createSearchError(
        'SERVICE_UNAVAILABLE',
        error instanceof Error ? error.message : 'Unknown hybrid search error',
        query
      );
    }
  }

  /**
   * Parse embedding vectors from database records
   */
  private static parseEmbeddings(
    embeddingChunks: Array<{
      userId: string;
      embeddingVector: string;
      embeddingText?: string | null;
      profileVersion?: string | null;
      createdAt?: string | null;
      updatedAt?: string | null;
    }>
  ): ParsedEmbedding[] {
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
    } as SearchError; // Properly typed search error
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
   * Combine vector and BM25 results with intelligent hybrid scoring
   * @param vectorResults - Results from vector similarity search
   * @param bm25Results - Results from BM25 keyword search
   * @param query - Original search query
   * @param options - Search options
   * @returns Combined and sorted hybrid results
   */
  private static combineHybridResults(
    vectorResults: Array<{
      userId: string;
      similarity: number;
      embeddingText?: string;
    }>,
    bm25Results: Array<{ userId: string; score: number }>,
    query: string,
    options: SearchOptions
  ): Array<{ userId: string; similarity: number; embeddingText?: string }> {
    // Determine if this is an exact term query
    const isExactQuery = BM25SearchService.isExactTermQuery(query);

    // Set weights based on query type
    const vectorWeight = isExactQuery ? 0.3 : 0.7;
    const bm25Weight = isExactQuery ? 0.7 : 0.3;

    console.log(
      `Query "${query}" classified as ${isExactQuery ? 'exact term' : 'semantic'} - using weights: vector=${vectorWeight}, BM25=${bm25Weight}`
    );

    // Normalize scores to 0-1 range
    const maxVectorScore = Math.max(
      ...vectorResults.map(r => r.similarity),
      0.001
    );
    const maxBM25Score = Math.max(...bm25Results.map(r => r.score), 0.001);

    // Create maps for fast lookup
    const vectorMap = new Map(
      vectorResults.map(r => [
        r.userId,
        {
          score: r.similarity / maxVectorScore,
          embeddingText: r.embeddingText,
        },
      ])
    );
    const bm25Map = new Map(
      bm25Results.map(r => [r.userId, r.score / maxBM25Score])
    );

    // Get all unique user IDs from both searches
    const allUserIds = new Set([
      ...vectorResults.map(r => r.userId),
      ...bm25Results.map(r => r.userId),
    ]);

    // Combine scores for each user
    const hybridResults: Array<{
      userId: string;
      similarity: number;
      embeddingText?: string;
    }> = [];

    for (const userId of allUserIds) {
      // Skip excluded users
      if (options.excludeUserIds?.includes(userId)) {
        continue;
      }

      const vectorScore = vectorMap.get(userId)?.score || 0;
      const bm25Score = bm25Map.get(userId) || 0;

      // Calculate hybrid score
      const hybridScore = vectorScore * vectorWeight + bm25Score * bm25Weight;

      // Apply minimum similarity threshold (based on vector component for semantic relevance)
      if (
        vectorScore >= options.minSimilarity! ||
        (isExactQuery && bm25Score > 0)
      ) {
        hybridResults.push({
          userId,
          similarity: hybridScore,
          embeddingText: vectorMap.get(userId)?.embeddingText,
        });
      }
    }

    // Sort by hybrid score (descending)
    hybridResults.sort((a, b) => b.similarity - a.similarity);

    console.log(
      `Hybrid scoring: ${hybridResults.length} combined results (vector: ${vectorResults.length}, BM25: ${bm25Results.length})`
    );

    return hybridResults;
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

      console.log('Hybrid search service test results:', {
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
      console.error('Hybrid search service test failed:', error);
      return false;
    }
  }

  /**
   * Initialize the hybrid search system (call on app startup)
   * Sets up both vector embeddings and BM25 index
   * @returns Promise<{ success: boolean; vectorCount: number; bm25Count: number; error?: string }>
   */
  static async initializeHybridSearch(): Promise<{
    success: boolean;
    vectorCount: number;
    bm25Count: number;
    error?: string;
  }> {
    try {
      console.log('Initializing hybrid search system...');

      // Initialize BM25 index from existing embeddings
      const bm25Result = await EmbeddingManager.initializeBM25Index();

      if (!bm25Result.success) {
        return {
          success: false,
          vectorCount: 0,
          bm25Count: 0,
          error: `BM25 initialization failed: ${bm25Result.error}`,
        };
      }

      // Get stats on vector embeddings
      const embeddings = await EmbeddingManager.getAllEmbeddings();
      const bm25Stats = BM25SearchService.getIndexStats();

      console.log('Hybrid search system initialized successfully:', {
        vectorEmbeddings: embeddings.length,
        bm25Documents: bm25Stats.totalDocuments,
        bm25Ready: bm25Stats.isReady,
      });

      return {
        success: true,
        vectorCount: embeddings.length,
        bm25Count: bm25Stats.totalDocuments,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown initialization error';
      console.error('Hybrid search initialization failed:', errorMessage);

      return {
        success: false,
        vectorCount: 0,
        bm25Count: 0,
        error: errorMessage,
      };
    }
  }
}
