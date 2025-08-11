import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export interface UserProfile {
  jobRole?: string;
  companyName?: string;
  industry?: string;
  yearsOfExperience?: number;
  education?: string;
  about?: string;
  interests?: string[];
  skills?: string[];
}

export interface SearchResult {
  userId: string;
  score: number;
  profile: UserProfile;
}

export interface VectorSearchResponse {
  success: boolean;
  results?: SearchResult[];
  error?: string;
}

export class VectorSearchService {
  /**
   * Search for users using natural language query
   */
  static async searchUsers(
    query: string,
    limit: number = 10
  ): Promise<VectorSearchResponse> {
    try {
      const { data, errors } = await client.queries.vectorSearch({
        action: 'search',
        query,
        limit,
      });

      if (errors && errors.length > 0) {
        console.error('Vector search errors:', errors);
        return {
          success: false,
          error: errors[0].message,
        };
      }

      return data as VectorSearchResponse;
    } catch (error) {
      console.error('Error in vector search:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate embedding for a user profile and store it
   */
  static async indexUserProfile(
    userId: string,
    userProfile: UserProfile
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, errors } = await client.queries.vectorSearch({
        action: 'index_user',
        userId,
        userProfile,
      });

      if (errors && errors.length > 0) {
        console.error('Vector indexing errors:', errors);
        return {
          success: false,
          error: errors[0].message,
        };
      }

      return data as { success: boolean; error?: string };
    } catch (error) {
      console.error('Error indexing user profile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Bulk index multiple user profiles
   */
  static async bulkIndexUsers(
    users: Array<{ userId: string; userProfile: UserProfile }>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, errors } = await client.queries.vectorSearch({
        action: 'bulk_index',
        users,
      });

      if (errors && errors.length > 0) {
        console.error('Bulk vector indexing errors:', errors);
        return {
          success: false,
          error: errors[0].message,
        };
      }

      return data as { success: boolean; error?: string };
    } catch (error) {
      console.error('Error bulk indexing user profiles:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate embedding for any text
   */
  static async generateEmbedding(
    text: string
  ): Promise<{ success: boolean; embedding?: number[]; error?: string }> {
    try {
      const { data, errors } = await client.queries.vectorSearch({
        action: 'generate_embedding',
        text,
      });

      if (errors && errors.length > 0) {
        console.error('Embedding generation errors:', errors);
        return {
          success: false,
          error: errors[0].message,
        };
      }

      return data as { success: boolean; embedding?: number[]; error?: string };
    } catch (error) {
      console.error('Error generating embedding:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
