import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

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

export class OpenSearchService {
  /**
   * Search users using OpenSearch's intelligent search
   * This handles all the complexity - just pass a natural language query!
   */
  static async searchUsers(
    query: string,
    limit: number = 10,
    filters?: SearchFilters
  ): Promise<SearchResponse> {
    try {
      const response = await client.queries.searchUsers({
        action: 'search_users',
        query: query.trim(),
        limit,
        filters: filters ? JSON.stringify(filters) : undefined,
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
   * Index a user profile for search
   * Call this when a user completes onboarding or updates their profile
   */
  static async indexUser(
    userId: string,
    userProfile: UserProfile
  ): Promise<SearchResponse> {
    try {
      const response = await client.queries.searchUsers({
        action: 'index_user',
        userId,
        userProfile: JSON.stringify(userProfile),
      });

      // Parse the JSON string response
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
      const response = await client.queries.searchUsers({
        action: 'update_user',
        userId,
        userProfile: JSON.stringify(userProfile),
      });

      // Parse the JSON string response
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
      const response = await client.queries.searchUsers({
        action: 'get_user',
        userId,
      });

      // Parse the JSON string response
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
      const response = await client.queries.searchUsers({
        action: 'delete_user',
        userId,
      });

      // Parse the JSON string response
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
   * Initialize the search index (admin function)
   */
  static async initializeIndex(): Promise<SearchResponse> {
    try {
      const response = await client.queries.searchUsers({
        action: 'initialize_index',
      });

      // Parse the JSON string response
      const parsedData =
        typeof response.data === 'string'
          ? JSON.parse(response.data)
          : response.data;

      return parsedData as SearchResponse;
    } catch (error) {
      console.error('Index initialization failed:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Index initialization failed',
      };
    }
  }

  /**
   * Quick search suggestions as user types
   */
  static async quickSearch(
    query: string,
    limit: number = 5
  ): Promise<SearchResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const response = await this.searchUsers(query, limit);
    return response.results || [];
  }

  /**
   * Search by specific criteria with intelligent matching
   */
  static async searchByCriteria(
    criteria: {
      role?: string;
      industry?: string;
      skills?: string[];
      experience?: { min?: number; max?: number };
      interests?: string[];
      query?: string;
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

    const response = await this.searchUsers(searchQuery, limit, filters);
    return response.results || [];
  }
}

// Export individual functions for convenience
export const {
  searchUsers,
  indexUser,
  updateUser,
  getUser,
  deleteUser,
  initializeIndex,
  quickSearch,
  searchByCriteria,
} = OpenSearchService;
