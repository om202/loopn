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
 * RRF Hybrid Search Service
 * Combines semantic vector search with text-based keyword matching using
 * Reciprocal Rank Fusion (RRF) - the industry standard hybrid search approach
 */
export class RAGSearchService {
  /**
   * Main search function - RRF hybrid search using Vector + Text Search
   * Uses Reciprocal Rank Fusion to combine rankings from both search methods
   * @param query - Natural language search query
   * @param options - Search options and parameters
   * @returns Promise<SearchResponse> - Search results with metrics
   */
  static async searchProfiles(
    query: string,
    options: Partial<SearchOptions> = {}
  ): Promise<SearchResponse> {
    let queryEmbeddingTimeMs = 0;
    let textSearchTimeMs = 0;
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

      // Step 1: Get embedding chunks first
      console.log(`Starting RRF hybrid search for: "${searchOptions.query}"`);
      const embeddingChunks = await EmbeddingManager.getAllEmbeddings();

      if (embeddingChunks.length === 0) {
        console.warn('No profile embeddings found in database');
        return RAGSearchService.createEmptyResponse(
          searchOptions.query,
          queryEmbeddingTimeMs
        );
      }

      // Step 2: Try vector search, fallback to text-only if it fails
      let queryEmbedding: number[] | null = null;
      let vectorResults: Array<{
        userId: string;
        similarity: number;
        embeddingText?: string;
      }> = [];
      let isVectorSearchAvailable = true;

      try {
        const embeddingStart = Date.now();
        queryEmbedding = await EmbeddingService.generateEmbedding(
          searchOptions.query
        );
        queryEmbeddingTimeMs = Date.now() - embeddingStart;

        // Vector search - calculate similarities
        const parsedEmbeddings =
          RAGSearchService.parseEmbeddings(embeddingChunks);
        vectorResults = RAGSearchService.calculateSimilarities(
          queryEmbedding,
          parsedEmbeddings,
          searchOptions
        );

        console.log(
          `✅ Vector search successful: ${vectorResults.length} results`
        );
      } catch (embeddingError) {
        isVectorSearchAvailable = false;
        console.warn(
          '⚠️ Vector search failed, falling back to text-only search'
        );
        console.warn('Embedding error:', embeddingError);
      }

      // Step 3: Text search (always run)
      const textSearchStart = Date.now();
      const textResults = RAGSearchService.performTextSearch(
        searchOptions.query,
        embeddingChunks,
        (searchOptions.limit || 20) * 2
      );
      textSearchTimeMs = Date.now() - textSearchStart;

      // Step 4: Combine results using RRF or use text-only
      const hybridResults = RAGSearchService.combineHybridResults(
        vectorResults,
        textResults,
        searchOptions.query,
        searchOptions,
        isVectorSearchAvailable
      );

      processingTimeMs = Date.now() - processingStart;

      if (hybridResults.length === 0) {
        console.log('No RRF hybrid matches found');
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

      // Step 5: Build response with RRF hybrid metrics
      const metrics: SearchMetrics = {
        totalProcessed: embeddingChunks.length,
        totalMatched: hybridResults.length,
        queryEmbeddingTimeMs,
        processingTimeMs: processingTimeMs + textSearchTimeMs, // Include text search time
        fetchTimeMs,
      };

      const response: SearchResponse = {
        results,
        metrics,
        query: searchOptions.query,
        totalFound: hybridResults.length,
      };

      const mode = isVectorSearchAvailable
        ? 'RRF Hybrid'
        : 'Text-only fallback';
      console.log(
        `${mode} search completed: ${results.length} results in ${
          queryEmbeddingTimeMs +
          processingTimeMs +
          textSearchTimeMs +
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
   * Perform simple text-based keyword search on profile texts
   */
  private static performTextSearch(
    query: string,
    embeddings: Array<{ userId: string; embeddingText?: string | null }>,
    limit: number = 20
  ): Array<{ userId: string; score: number }> {
    console.log('🔍 TEXT SEARCH START');
    console.log(`Query: "${query}"`);

    const queryTerms = query
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(term => term.length > 2);

    console.log(`Search terms: [${queryTerms.join(', ')}]`);
    console.log(`Processing ${embeddings.length} profile texts...`);

    if (queryTerms.length === 0) {
      console.log('❌ No valid search terms found');
      return [];
    }

    const results: Array<{ userId: string; score: number }> = [];
    let processedCount = 0;
    let matchedCount = 0;

    for (const embedding of embeddings) {
      processedCount++;

      if (!embedding.embeddingText) {
        console.log(`⚠️  Profile ${embedding.userId}: No text available`);
        continue;
      }

      const text = embedding.embeddingText.toLowerCase();
      let totalScore = 0;
      const matchDetails: string[] = [];

      for (const term of queryTerms) {
        // Count exact matches (word boundaries)
        const exactMatches = (
          text.match(new RegExp(`\\b${term}\\b`, 'g')) || []
        ).length;

        // Count partial matches (less weight)
        const partialMatches =
          (text.match(new RegExp(term, 'g')) || []).length - exactMatches;

        // Score calculation: exact matches worth more
        const termScore = exactMatches * 2 + partialMatches * 1;
        totalScore += termScore;

        if (termScore > 0) {
          matchDetails.push(
            `"${term}": ${exactMatches} exact + ${partialMatches} partial = ${termScore} pts`
          );
        }
      }

      if (totalScore > 0) {
        matchedCount++;
        console.log(`✅ ${embedding.userId}: Score ${totalScore}`);
        console.log(`   Matches: ${matchDetails.join(', ')}`);
        console.log(`   Text preview: "${text.substring(0, 100)}..."`);

        results.push({
          userId: embedding.userId,
          score: totalScore,
        });
      }
    }

    // Sort by score and limit results
    const sortedResults = results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    console.log(`📊 TEXT SEARCH RESULTS:`);
    console.log(`   Processed: ${processedCount} profiles`);
    console.log(`   Matched: ${matchedCount} profiles`);
    console.log(`   Returned: ${sortedResults.length} top results`);

    if (sortedResults.length > 0) {
      console.log(
        `   Top scores: ${sortedResults
          .slice(0, 3)
          .map(r => `${r.userId}(${r.score})`)
          .join(', ')}`
      );
    }

    console.log('🔍 TEXT SEARCH END\n');
    return sortedResults;
  }

  /**
   * Calculate RRF (Reciprocal Rank Fusion) score
   * Formula: score = 1 / (k + rank) where k=60 typically
   * @param rank - 1-based rank position (1 = best)
   * @param k - RRF constant (default 60)
   * @returns RRF score
   */
  private static calculateRRFScore(rank: number, k: number = 60): number {
    return 1 / (k + rank);
  }

  /**
   * Combine vector and text search results using Reciprocal Rank Fusion (RRF)
   * RRF is the industry standard for hybrid search used by Elasticsearch, OpenSearch, etc.
   */
  private static combineHybridResults(
    vectorResults: Array<{
      userId: string;
      similarity: number;
      embeddingText?: string;
    }>,
    textResults: Array<{ userId: string; score: number }>,
    query: string,
    options: SearchOptions,
    _isVectorSearchAvailable: boolean = true
  ): Array<{ userId: string; similarity: number; embeddingText?: string }> {
    console.log(`🔄 RRF HYBRID FUSION START`);
    console.log(`Query: "${query}" | Method: Reciprocal Rank Fusion (k=60)`);
    console.log(
      `Vector results: ${vectorResults.length} | Text results: ${textResults.length}`
    );

    // Sort results by their respective scores (best first)
    const sortedVectorResults = vectorResults
      .filter(r => r.similarity >= options.minSimilarity!) // Apply min similarity filter
      .sort((a, b) => b.similarity - a.similarity);

    const sortedTextResults = textResults.sort((a, b) => b.score - a.score);

    console.log(
      `After filtering: ${sortedVectorResults.length} vector | ${sortedTextResults.length} text`
    );

    // Create ranking maps: userId -> rank (1-based)
    const vectorRanks = new Map<string, number>();
    const textRanks = new Map<string, number>();
    const vectorEmbeddings = new Map<string, string>();

    // Vector rankings
    sortedVectorResults.forEach((result, index) => {
      vectorRanks.set(result.userId, index + 1); // 1-based ranking
      if (result.embeddingText) {
        vectorEmbeddings.set(result.userId, result.embeddingText);
      }
    });

    // Text rankings
    sortedTextResults.forEach((result, index) => {
      textRanks.set(result.userId, index + 1); // 1-based ranking
    });

    // Get all unique users from both searches
    const allUserIds = new Set([...vectorRanks.keys(), ...textRanks.keys()]);

    // Calculate RRF scores for each user
    const rrfResults: Array<{
      userId: string;
      similarity: number;
      embeddingText?: string;
      rrfDetails?: {
        vectorRank?: number;
        textRank?: number;
        vectorScore: number;
        textScore: number;
      };
    }> = [];

    console.log(`\n🎯 RRF SCORING:`);
    let debugCount = 0;

    for (const userId of allUserIds) {
      // Skip excluded users
      if (options.excludeUserIds?.includes(userId)) {
        continue;
      }

      const vectorRank = vectorRanks.get(userId);
      const textRank = textRanks.get(userId);

      // Calculate RRF scores (0 if not present in that search)
      const vectorRrfScore = vectorRank
        ? RAGSearchService.calculateRRFScore(vectorRank)
        : 0;
      const textRrfScore = textRank
        ? RAGSearchService.calculateRRFScore(textRank)
        : 0;

      // Combined RRF score is sum of individual RRF scores
      const combinedRrfScore = vectorRrfScore + textRrfScore;

      // Only include if user appears in at least one search
      if (combinedRrfScore > 0) {
        debugCount++;

        if (debugCount <= 5) {
          // Show first 5 for debugging
          console.log(`${userId}:`);
          console.log(
            `   Vector rank: ${vectorRank || 'N/A'} -> RRF: ${vectorRrfScore.toFixed(6)}`
          );
          console.log(
            `   Text rank:   ${textRank || 'N/A'} -> RRF: ${textRrfScore.toFixed(6)}`
          );
          console.log(`   Combined:    ${combinedRrfScore.toFixed(6)}`);
        }

        rrfResults.push({
          userId,
          similarity: combinedRrfScore, // Using RRF score as similarity
          embeddingText: vectorEmbeddings.get(userId),
          rrfDetails: {
            vectorRank,
            textRank,
            vectorScore: vectorRrfScore,
            textScore: textRrfScore,
          },
        });
      }
    }

    // Sort by combined RRF score (descending - higher is better)
    rrfResults.sort((a, b) => b.similarity - a.similarity);

    console.log(`\n📈 RRF FUSION RESULTS:`);
    console.log(`   Total candidates: ${allUserIds.size}`);
    console.log(`   Final results: ${rrfResults.length}`);
    console.log(`   Fusion method: RRF with k=60`);

    if (rrfResults.length > 0) {
      const topResults = rrfResults.slice(0, 3);
      console.log(
        `   Top 3 RRF scores: ${topResults
          .map(r => `${r.userId}(${r.similarity.toFixed(6)})`)
          .join(', ')}`
      );
    }

    console.log(`🔄 RRF HYBRID FUSION END\n`);
    return rrfResults;
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
   * Sets up vector embeddings (text search requires no setup)
   * @returns Promise<{ success: boolean; vectorCount: number; error?: string }>
   */
  static async initializeHybridSearch(): Promise<{
    success: boolean;
    vectorCount: number;
    error?: string;
  }> {
    try {
      console.log('Initializing hybrid search system...');

      // Get stats on vector embeddings (text search needs no initialization)
      const embeddings = await EmbeddingManager.getAllEmbeddings();

      console.log('Hybrid search system initialized successfully:', {
        vectorEmbeddings: embeddings.length,
        textSearchReady: true, // Text search is always ready
      });

      return {
        success: true,
        vectorCount: embeddings.length,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown initialization error';
      console.error('Hybrid search initialization failed:', errorMessage);

      return {
        success: false,
        vectorCount: 0,
        error: errorMessage,
      };
    }
  }
}
