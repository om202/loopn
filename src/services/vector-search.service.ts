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
   * Generate embedding for a user profile and store it
   */
  static async indexUserProfile(
    userId: string,
    userProfile: UserProfile
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate userProfile has content
      if (!userProfile || Object.keys(userProfile).length === 0) {
        return {
          success: false,
          error: 'UserProfile is empty or invalid',
        };
      }

      // Create a clean userProfile object by explicitly filtering out undefined values
      const cleanUserProfile: UserProfile = {};

      // Only include fields that have actual values (not null, undefined, or empty strings)
      if (userProfile.jobRole && userProfile.jobRole.trim()) {
        cleanUserProfile.jobRole = userProfile.jobRole.trim();
      }
      if (userProfile.companyName && userProfile.companyName.trim()) {
        cleanUserProfile.companyName = userProfile.companyName.trim();
      }
      if (userProfile.industry && userProfile.industry.trim()) {
        cleanUserProfile.industry = userProfile.industry.trim();
      }
      if (
        typeof userProfile.yearsOfExperience === 'number' &&
        userProfile.yearsOfExperience >= 0
      ) {
        cleanUserProfile.yearsOfExperience = userProfile.yearsOfExperience;
      }
      if (userProfile.education && userProfile.education.trim()) {
        cleanUserProfile.education = userProfile.education.trim();
      }
      if (userProfile.about && userProfile.about.trim()) {
        cleanUserProfile.about = userProfile.about.trim();
      }
      if (
        userProfile.interests &&
        Array.isArray(userProfile.interests) &&
        userProfile.interests.length > 0
      ) {
        cleanUserProfile.interests = userProfile.interests
          .filter(item => item && item.trim())
          .map(item => item.trim());
      }
      if (
        userProfile.skills &&
        Array.isArray(userProfile.skills) &&
        userProfile.skills.length > 0
      ) {
        cleanUserProfile.skills = userProfile.skills
          .filter(item => item && item.trim())
          .map(item => item.trim());
      }

      // Validate after cleaning
      if (Object.keys(cleanUserProfile).length === 0) {
        return {
          success: false,
          error: 'UserProfile has no valid content after cleaning',
        };
      }

      // Convert userProfile to JSON string for GraphQL
      const userProfileJson = JSON.stringify(cleanUserProfile);

      const { data, errors } = await client.queries.vectorSearch({
        action: 'index_user',
        userId,
        userProfile: userProfileJson,
      });

      if (errors && errors.length > 0) {
        console.error('Vector indexing errors:', errors);
        return {
          success: false,
          error: errors[0].message,
        };
      }

      if (!data) {
        console.error('No data returned from GraphQL query');
        return {
          success: false,
          error: 'No data returned from vector search service',
        };
      }

      // Parse the JSON string if data is returned as string
      let result: { success: boolean; error?: string };
      if (typeof data === 'string') {
        try {
          result = JSON.parse(data);
        } catch (parseError) {
          console.error('Failed to parse GraphQL response:', parseError);
          return {
            success: false,
            error: 'Invalid response format from vector search service',
          };
        }
      } else {
        result = data as { success: boolean; error?: string };
      }

      if (!result.success && result.error) {
        console.error('Vector search service returned error:', result.error);
        return {
          success: false,
          error: result.error,
        };
      }

      return result;
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
      // Clean all user profiles before sending
      const cleanUsers = users
        .map(user => {
          const cleanUserProfile: UserProfile = {};

          const { userProfile } = user;

          // Only include fields that have actual values (not null, undefined, or empty strings)
          if (userProfile.jobRole && userProfile.jobRole.trim()) {
            cleanUserProfile.jobRole = userProfile.jobRole.trim();
          }
          if (userProfile.companyName && userProfile.companyName.trim()) {
            cleanUserProfile.companyName = userProfile.companyName.trim();
          }
          if (userProfile.industry && userProfile.industry.trim()) {
            cleanUserProfile.industry = userProfile.industry.trim();
          }
          if (
            typeof userProfile.yearsOfExperience === 'number' &&
            userProfile.yearsOfExperience >= 0
          ) {
            cleanUserProfile.yearsOfExperience = userProfile.yearsOfExperience;
          }
          if (userProfile.education && userProfile.education.trim()) {
            cleanUserProfile.education = userProfile.education.trim();
          }
          if (userProfile.about && userProfile.about.trim()) {
            cleanUserProfile.about = userProfile.about.trim();
          }
          if (
            userProfile.interests &&
            Array.isArray(userProfile.interests) &&
            userProfile.interests.length > 0
          ) {
            cleanUserProfile.interests = userProfile.interests
              .filter(item => item && item.trim())
              .map(item => item.trim());
          }
          if (
            userProfile.skills &&
            Array.isArray(userProfile.skills) &&
            userProfile.skills.length > 0
          ) {
            cleanUserProfile.skills = userProfile.skills
              .filter(item => item && item.trim())
              .map(item => item.trim());
          }

          return {
            userId: user.userId,
            userProfile: cleanUserProfile,
          };
        })
        .filter(user => Object.keys(user.userProfile).length > 0); // Only include users with valid content

      if (cleanUsers.length === 0) {
        return {
          success: false,
          error: 'No valid user profiles to index after cleaning',
        };
      }

      // Convert users array to JSON string for GraphQL
      const usersJson = JSON.stringify(cleanUsers);

      const { data, errors } = await client.queries.vectorSearch({
        action: 'bulk_index',
        users: usersJson,
      });

      if (errors && errors.length > 0) {
        console.error('Bulk vector indexing errors:', errors);
        return {
          success: false,
          error: errors[0].message,
        };
      }

      if (!data) {
        console.error('No data returned from bulk GraphQL query');
        return {
          success: false,
          error: 'No data returned from vector search service',
        };
      }

      // Parse the JSON string if data is returned as string
      let result: { success: boolean; error?: string };
      if (typeof data === 'string') {
        try {
          result = JSON.parse(data);
        } catch (parseError) {
          console.error('Failed to parse bulk GraphQL response:', parseError);
          return {
            success: false,
            error: 'Invalid response format from vector search service',
          };
        }
      } else {
        result = data as { success: boolean; error?: string };
      }

      if (!result.success && result.error) {
        console.error(
          'Bulk vector search service returned error:',
          result.error
        );
        return {
          success: false,
          error: result.error,
        };
      }

      return result;
    } catch (error) {
      console.error('Error bulk indexing user profiles:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Search for users using natural language query
   */
  static async searchUsers(
    query: string,
    limit: number = 10
  ): Promise<{ success: boolean; results?: SearchResult[]; error?: string }> {
    try {
      const { data, errors } = await client.queries.vectorSearch({
        action: 'search_users',
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

      if (!data) {
        console.error('No data returned from vector search query');
        return {
          success: false,
          error: 'No data returned from vector search service',
        };
      }

      // Parse the JSON string if data is returned as string
      let result: {
        success: boolean;
        results?: SearchResult[];
        error?: string;
      };
      if (typeof data === 'string') {
        try {
          result = JSON.parse(data);
        } catch (parseError) {
          console.error('Failed to parse vector search response:', parseError);
          return {
            success: false,
            error: 'Invalid response format from vector search service',
          };
        }
      } else {
        result = data as {
          success: boolean;
          results?: SearchResult[];
          error?: string;
        };
      }

      if (!result.success && result.error) {
        console.error('Vector search service returned error:', result.error);
        return {
          success: false,
          error: result.error,
        };
      }

      return result;
    } catch (error) {
      console.error('Error searching users:', error);
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
