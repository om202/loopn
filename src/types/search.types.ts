/**
 * TypeScript types and interfaces for RAG search functionality
 */

/**
 * Embedding vector data stored in ProfileEmbedding table
 */
export interface ProfileEmbedding {
  userId: string;
  embeddingVector: string; // JSON stringified array of 1024 numbers
  embeddingText: string;   // Raw text that was embedded
  profileVersion: string;  // Version for cache invalidation
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Parsed embedding vector for similarity calculations
 */
export interface ParsedEmbedding {
  userId: string;
  vector: number[]; // Parsed 1024-dimension array
  text: string;
  version: string;
}

/**
 * Search result combining similarity score with profile data
 */
export interface SearchResult {
  userId: string;
  profile: any; // UserProfile data - keeping flexible since profile structure may vary
  similarity: number; // Cosine similarity score (0-1)
  embeddingText?: string; // Optional: the text that was matched
}

/**
 * Search query parameters and options
 */
export interface SearchOptions {
  query: string;
  limit?: number; // Default 20
  minSimilarity?: number; // Default 0.3 (30%)
  includeEmbeddingText?: boolean; // Include matched text in results
  excludeUserIds?: string[]; // Exclude specific users from results
}

/**
 * Search performance metrics and metadata
 */
export interface SearchMetrics {
  totalProcessed: number; // Total embeddings processed
  totalMatched: number; // Embeddings above similarity threshold
  processingTimeMs: number; // Time to calculate similarities
  fetchTimeMs: number; // Time to fetch profile data
  queryEmbeddingTimeMs: number; // Time to generate query embedding
}

/**
 * Complete search response with results and metadata
 */
export interface SearchResponse {
  results: SearchResult[];
  metrics: SearchMetrics;
  query: string;
  totalFound: number;
}

/**
 * Embedding generation job for batch processing
 */
export interface EmbeddingJob {
  userId: string;
  profileData: any;
  priority: 'high' | 'normal' | 'low';
  createdAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

/**
 * Batch embedding operation result
 */
export interface BatchEmbeddingResult {
  successful: string[]; // UserIds successfully processed
  failed: Array<{ userId: string; error: string }>; // Failed operations
  metrics: {
    totalProcessed: number;
    successCount: number;
    failCount: number;
    avgProcessingTime: number;
    totalTimeMs: number;
  };
}

/**
 * Embedding health check result
 */
export interface EmbeddingHealthCheck {
  serviceAvailable: boolean;
  totalEmbeddings: number;
  lastUpdated: string | null;
  avgSimilarityRange: { min: number; max: number } | null;
  sampleQuery: {
    query: string;
    resultCount: number;
    processingTime: number;
  } | null;
  errors: string[];
}

/**
 * Profile text validation result
 */
export interface ProfileTextValidation {
  isValid: boolean;
  warnings: string[];
  wordCount: number;
  charCount: number;
  suggestedImprovements?: string[];
}

/**
 * Cosine similarity calculation result
 */
export interface SimilarityResult {
  similarity: number;
  confidence: 'high' | 'medium' | 'low'; // Based on similarity score
  isMatch: boolean; // Above threshold
}

/**
 * Search analytics for performance monitoring
 */
export interface SearchAnalytics {
  totalSearches: number;
  avgResultsPerSearch: number;
  avgProcessingTime: number;
  popularQueries: Array<{ query: string; count: number }>;
  performanceBreakdown: {
    embeddingGeneration: number; // % of total time
    similarityCalculation: number; // % of total time
    profileFetching: number; // % of total time
  };
}

/**
 * Error types specific to RAG search operations
 */
export type SearchErrorType = 
  | 'EMBEDDING_GENERATION_FAILED'
  | 'SIMILARITY_CALCULATION_FAILED' 
  | 'PROFILE_FETCH_FAILED'
  | 'INVALID_QUERY'
  | 'SERVICE_UNAVAILABLE'
  | 'RATE_LIMIT_EXCEEDED';

/**
 * Search error with context
 */
export interface SearchError {
  type: SearchErrorType;
  message: string;
  userId?: string;
  query?: string;
  timestamp: string;
  details?: any;
}

/**
 * Utility type for search result filtering
 */
export type SearchResultFilter = (result: SearchResult) => boolean;

/**
 * Utility type for search result sorting
 */
export type SearchResultSorter = (a: SearchResult, b: SearchResult) => number;

/**
 * Configuration for the search service
 */
export interface SearchConfig {
  bedrock: {
    region: string;
    modelId: string;
    dimensions: number;
  };
  similarity: {
    threshold: number;
    maxResults: number;
  };
  performance: {
    batchSize: number;
    maxRetries: number;
    timeoutMs: number;
  };
}

/**
 * Default search configuration
 */
export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  bedrock: {
    region: 'us-east-1',
    modelId: 'amazon.titan-embed-text-v2:0',
    dimensions: 1024,
  },
  similarity: {
    threshold: 0.3, // 30% similarity
    maxResults: 20,
  },
  performance: {
    batchSize: 10,
    maxRetries: 3,
    timeoutMs: 30000, // 30 seconds
  },
};
