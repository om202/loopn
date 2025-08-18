import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

// Lazy client generation to avoid Amplify configuration issues
let client: ReturnType<typeof generateClient<Schema>> | null = null;

function getClient() {
  if (!client) {
    client = generateClient<Schema>();
  }
  return client;
}

export interface SearchFilters {
  industry?: string;
  minExperience?: number;
  maxExperience?: number;
  skills?: string[];
}

export interface UserProfile {
  userId: string;
  fullName?: string;
  jobRole?: string;
  companyName?: string;
  industry?: string;
  yearsOfExperience?: number;
  education?: string;
  about?: string;
  interests?: string[];
  skills?: string[];
  profilePictureUrl?: string;
  isOnboardingComplete?: boolean;
  profileVector?: number[]; // 1024-dimensional vector for semantic search
}

export interface SearchResult {
  userId: string;
  score: number;
  profile: UserProfile;
}

export interface SearchResponse {
  success: boolean;
  results?: SearchResult[];
  total?: number;
  error?: string;
}

// Ranking profiles available in Vespa
export type RankingProfile =
  | 'default'
  | 'semantic'
  | 'hybrid'
  | 'experience_focused'
  | 'skills_focused';

export class VespaService {
  /**
   * Search users using Vespa's intelligent text search
   * This handles all the complexity - just pass a natural language query!
   */
  static async searchUsers(
    query: string,
    limit: number = 10,
    filters?: SearchFilters,
    rankingProfile: RankingProfile = 'default'
  ): Promise<SearchResponse> {
    try {
      const response = await getClient().queries.searchUsers({
        action: 'search_users',
        query: query.trim(),
        limit,
        filters: filters ? JSON.stringify(filters) : undefined,
        rankingProfile,
      });

      // Parse the JSON string response
      const parsedData =
        typeof response.data === 'string'
          ? JSON.parse(response.data)
          : response.data;

      return parsedData as SearchResponse;
    } catch (error) {
      console.error('Search failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
      };
    }
  }

  /**
   * Semantic search using vector similarity
   * Requires a 1024-dimensional query vector
   */
  static async semanticSearch(
    queryVector: number[],
    limit: number = 10,
    filters?: SearchFilters
  ): Promise<SearchResponse> {
    try {
      if (queryVector.length !== 1024) {
        throw new Error('Query vector must be 1024-dimensional');
      }

      const response = await getClient().queries.searchUsers({
        action: 'semantic_search',
        limit,
        filters: filters ? JSON.stringify(filters) : undefined,
        queryVector: JSON.stringify(queryVector),
      });

      const parsedData =
        typeof response.data === 'string'
          ? JSON.parse(response.data)
          : response.data;

      return parsedData as SearchResponse;
    } catch (error) {
      console.error('Semantic search failed:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Semantic search failed',
      };
    }
  }

  /**
   * Hybrid search combining text and vector similarity
   * Best of both worlds - semantic understanding + keyword matching
   */
  static async hybridSearch(
    query: string,
    queryVector: number[],
    limit: number = 10,
    filters?: SearchFilters
  ): Promise<SearchResponse> {
    try {
      if (queryVector.length !== 1024) {
        throw new Error('Query vector must be 1024-dimensional');
      }

      const response = await getClient().queries.searchUsers({
        action: 'hybrid_search',
        query: query.trim(),
        limit,
        filters: filters ? JSON.stringify(filters) : undefined,
        queryVector: JSON.stringify(queryVector),
      });

      const parsedData =
        typeof response.data === 'string'
          ? JSON.parse(response.data)
          : response.data;

      return parsedData as SearchResponse;
    } catch (error) {
      console.error('Hybrid search failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Hybrid search failed',
      };
    }
  }

  /**
   * Index a user profile for search
   * Call this when a user completes onboarding or updates their profile
   */
  static async indexUser(
    userId: string,
    userProfile: UserProfile
  ): Promise<SearchResponse> {
    try {
      const response = await getClient().queries.searchUsers({
        action: 'index_user',
        userId,
        userProfile: JSON.stringify(userProfile),
      });

      const parsedData =
        typeof response.data === 'string'
          ? JSON.parse(response.data)
          : response.data;

      return parsedData as SearchResponse;
    } catch (error) {
      console.error('Indexing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Indexing failed',
      };
    }
  }

  /**
   * Update a user profile in the search index
   */
  static async updateUser(
    userId: string,
    userProfile: UserProfile
  ): Promise<SearchResponse> {
    try {
      const response = await getClient().queries.searchUsers({
        action: 'update_user',
        userId,
        userProfile: JSON.stringify(userProfile),
      });

      const parsedData =
        typeof response.data === 'string'
          ? JSON.parse(response.data)
          : response.data;

      return parsedData as SearchResponse;
    } catch (error) {
      console.error('Update failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed',
      };
    }
  }

  /**
   * Get a specific user from search index
   */
  static async getUser(userId: string): Promise<SearchResponse> {
    try {
      const response = await getClient().queries.searchUsers({
        action: 'get_user',
        userId,
      });

      const parsedData =
        typeof response.data === 'string'
          ? JSON.parse(response.data)
          : response.data;

      return parsedData as SearchResponse;
    } catch (error) {
      console.error('Get user failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Get user failed',
      };
    }
  }

  /**
   * Remove a user from search index
   */
  static async deleteUser(userId: string): Promise<SearchResponse> {
    try {
      const response = await getClient().queries.searchUsers({
        action: 'delete_user',
        userId,
      });

      const parsedData =
        typeof response.data === 'string'
          ? JSON.parse(response.data)
          : response.data;

      return parsedData as SearchResponse;
    } catch (error) {
      console.error('Delete failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      };
    }
  }

  /**
   * Quick search suggestions as user types
   */
  static async quickSearch(
    query: string,
    limit: number = 5,
    rankingProfile: RankingProfile = 'default'
  ): Promise<SearchResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const response = await this.searchUsers(
      query,
      limit,
      undefined,
      rankingProfile
    );
    return response.results || [];
  }

  /**
   * Search by specific criteria with intelligent matching
   * Enhanced with different ranking profiles for better results
   */
  static async searchByCriteria(
    criteria: {
      role?: string;
      industry?: string;
      skills?: string[];
      experience?: { min?: number; max?: number };
      interests?: string[];
      query?: string;
      focusOn?: 'skills' | 'experience' | 'general'; // New: focus area
    },
    limit: number = 10
  ): Promise<SearchResult[]> {
    // Build intelligent query from criteria
    const queryParts: string[] = [];

    if (criteria.query) {
      queryParts.push(criteria.query);
    }

    if (criteria.role) {
      queryParts.push(criteria.role);
    }

    if (criteria.skills && criteria.skills.length > 0) {
      queryParts.push(criteria.skills.join(' '));
    }

    if (criteria.interests && criteria.interests.length > 0) {
      queryParts.push(criteria.interests.join(' '));
    }

    const searchQuery = queryParts.join(' ');

    const filters: SearchFilters = {};
    if (criteria.industry) {
      filters.industry = criteria.industry;
    }
    if (criteria.experience?.min !== undefined) {
      filters.minExperience = criteria.experience.min;
    }
    if (criteria.experience?.max !== undefined) {
      filters.maxExperience = criteria.experience.max;
    }
    if (criteria.skills && criteria.skills.length > 0) {
      filters.skills = criteria.skills;
    }

    // Choose ranking profile based on focus
    let rankingProfile: RankingProfile = 'default';
    if (criteria.focusOn === 'skills') {
      rankingProfile = 'skills_focused';
    } else if (criteria.focusOn === 'experience') {
      rankingProfile = 'experience_focused';
    }

    const response = await this.searchUsers(
      searchQuery,
      limit,
      filters,
      rankingProfile
    );
    return response.results || [];
  }

  /**
   * Advanced search with multiple ranking strategies
   * Returns results from different ranking profiles for comparison
   */
  static async advancedSearch(
    query: string,
    limit: number = 10,
    filters?: SearchFilters
  ): Promise<{
    default: SearchResult[];
    skillsFocused: SearchResult[];
    experienceFocused: SearchResult[];
  }> {
    try {
      const [defaultResults, skillsResults, experienceResults] =
        await Promise.all([
          this.searchUsers(query, limit, filters, 'default'),
          this.searchUsers(query, limit, filters, 'skills_focused'),
          this.searchUsers(query, limit, filters, 'experience_focused'),
        ]);

      return {
        default: defaultResults.results || [],
        skillsFocused: skillsResults.results || [],
        experienceFocused: experienceResults.results || [],
      };
    } catch (error) {
      console.error('Advanced search failed:', error);
      return {
        default: [],
        skillsFocused: [],
        experienceFocused: [],
      };
    }
  }
}

// Export individual functions for convenience
export const {
  searchUsers,
  semanticSearch,
  hybridSearch,
  indexUser,
  updateUser,
  getUser,
  deleteUser,
  quickSearch,
  searchByCriteria,
  advancedSearch,
} = VespaService;
