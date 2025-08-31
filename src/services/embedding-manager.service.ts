import type { Schema } from '../../amplify/data/resource';
import { getClient } from '../lib/amplify-config';
import { EmbeddingService } from './embedding.service';
import { BM25SearchService } from './bm25-search.service';
import {
  createProfileText,
  generateProfileVersion,
  validateProfileText,
} from '../lib/profile-text-generator';
import type {
  BatchEmbeddingResult,
  EmbeddingJob,
  EmbeddingHealthCheck,
} from '../types/search.types';

type ProfileEmbeddingType = Schema['ProfileEmbedding']['type'];
type DataResult<T> = { data: T | null; error: string | null };

/**
 * Service for managing profile embeddings in the ProfileEmbedding table
 * Handles CRUD operations and integrates with EmbeddingService and profile text generation
 */
export class EmbeddingManager {
  /**
   * Create embedding when profile is created
   * @param userId - User ID to create embedding for
   * @param profileData - Complete profile data
   * @returns Promise<DataResult<ProfileEmbeddingType>> - Created embedding record
   */
  static async createProfileEmbedding(
    userId: string,
    profileData: any
  ): Promise<DataResult<ProfileEmbeddingType>> {
    try {
      console.log('Creating profile embedding for user:', userId);

      // Generate searchable text from profile
      const profileText = createProfileText(profileData);

      // Validate profile text quality
      const validation = validateProfileText(profileText);
      if (!validation.isValid) {
        console.warn('Profile text validation warnings:', validation.warnings);
      }

      // Generate embedding vector
      const embeddingVector =
        await EmbeddingService.generateEmbedding(profileText);

      // Generate version for cache invalidation
      const profileVersion = generateProfileVersion(profileData);

      const client = getClient();
      const result = await client.models.ProfileEmbedding.create({
        userId: userId,
        embeddingVector: JSON.stringify(embeddingVector),
        embeddingText: profileText,
        profileVersion: profileVersion,
      });

      if (result.data) {
        console.log('Successfully created profile embedding:', {
          userId,
          textLength: profileText.length,
          dimensions: embeddingVector.length,
          version: profileVersion,
        });
        
        // Also add to BM25 index
        try {
          BM25SearchService.addDocument(userId, profileText);
          console.log('Successfully added profile to BM25 index:', userId);
        } catch (bm25Error) {
          console.warn('Failed to add to BM25 index (non-critical):', bm25Error);
        }
        
        return { data: result.data, error: null };
      } else {
        const error = 'Failed to create profile embedding - no data returned';
        console.error(error);
        return { data: null, error };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown error creating embedding';
      console.error('Error creating profile embedding:', errorMessage, {
        userId,
      });
      return { data: null, error: errorMessage };
    }
  }

  /**
   * Update embedding when profile changes
   * @param userId - User ID to update embedding for
   * @param profileData - Updated profile data
   * @returns Promise<DataResult<ProfileEmbeddingType>> - Updated embedding record
   */
  static async updateProfileEmbedding(
    userId: string,
    profileData: any
  ): Promise<DataResult<ProfileEmbeddingType>> {
    try {
      console.log('Updating profile embedding for user:', userId);

      // Generate new searchable text
      const profileText = createProfileText(profileData);
      const validation = validateProfileText(profileText);

      if (!validation.isValid) {
        console.warn('Profile text validation warnings:', validation.warnings);
      }

      // Generate new embedding vector
      const embeddingVector =
        await EmbeddingService.generateEmbedding(profileText);

      // Generate new version
      const profileVersion = generateProfileVersion(profileData);

      const client = getClient();
      const result = await client.models.ProfileEmbedding.update({
        userId: userId,
        embeddingVector: JSON.stringify(embeddingVector),
        embeddingText: profileText,
        profileVersion: profileVersion,
      });

      if (result.data) {
        console.log('Successfully updated profile embedding:', {
          userId,
          textLength: profileText.length,
          dimensions: embeddingVector.length,
          version: profileVersion,
        });
        
        // Also update BM25 index
        try {
          BM25SearchService.updateDocument(userId, profileText);
          console.log('Successfully updated profile in BM25 index:', userId);
        } catch (bm25Error) {
          console.warn('Failed to update BM25 index (non-critical):', bm25Error);
        }
        
        return { data: result.data, error: null };
      } else {
        const error = 'Failed to update profile embedding - no data returned';
        console.error(error);
        return { data: null, error };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown error updating embedding';
      console.error('Error updating profile embedding:', errorMessage, {
        userId,
      });
      return { data: null, error: errorMessage };
    }
  }

  /**
   * Delete embedding when profile is deleted
   * @param userId - User ID to delete embedding for
   * @returns Promise<{ success: boolean; error: string | null }>
   */
  static async deleteProfileEmbedding(
    userId: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      console.log('Deleting profile embedding for user:', userId);

      const client = getClient();
      const result = await client.models.ProfileEmbedding.delete({
        userId: userId,
      });

      if (result.data) {
        console.log('Successfully deleted profile embedding for user:', userId);
        
        // Also remove from BM25 index
        try {
          BM25SearchService.removeDocument(userId);
          console.log('Successfully removed profile from BM25 index:', userId);
        } catch (bm25Error) {
          console.warn('Failed to remove from BM25 index (non-critical):', bm25Error);
        }
        
        return { success: true, error: null };
      } else {
        const error = 'Failed to delete profile embedding - no data returned';
        console.error(error);
        return { success: false, error };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown error deleting embedding';
      console.error('Error deleting profile embedding:', errorMessage, {
        userId,
      });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get embedding for a specific user
   * @param userId - User ID to get embedding for
   * @returns Promise<DataResult<ProfileEmbeddingType>> - Embedding record
   */
  static async getProfileEmbedding(
    userId: string
  ): Promise<DataResult<ProfileEmbeddingType>> {
    try {
      const client = getClient();
      const result = await client.models.ProfileEmbedding.get({
        userId: userId,
      });

      return { data: result.data, error: result.errors?.[0]?.message || null };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown error getting embedding';
      console.error('Error getting profile embedding:', errorMessage, {
        userId,
      });
      return { data: null, error: errorMessage };
    }
  }

  /**
   * Get all embeddings (for search operations)
   * @returns Promise<ProfileEmbeddingType[]> - All embedding records
   */
  static async getAllEmbeddings(): Promise<ProfileEmbeddingType[]> {
    try {
      const client = getClient();
      const result = await client.models.ProfileEmbedding.list();

      if (result.data) {
        console.log(
          `Retrieved ${result.data.length} profile embeddings for search`
        );
        return result.data;
      } else {
        console.warn('No embeddings found');
        return [];
      }
    } catch (error) {
      console.error('Error getting all embeddings:', error);
      return [];
    }
  }

  /**
   * Check if embedding exists for a user
   * @param userId - User ID to check
   * @returns Promise<boolean> - True if embedding exists
   */
  static async embeddingExists(userId: string): Promise<boolean> {
    try {
      const result = await EmbeddingManager.getProfileEmbedding(userId);
      return result.data !== null;
    } catch (error) {
      console.error('Error checking embedding existence:', error);
      return false;
    }
  }

  /**
   * Batch create/update embeddings for multiple users
   * @param jobs - Array of embedding jobs to process
   * @returns Promise<BatchEmbeddingResult> - Results of batch operation
   */
  static async batchProcessEmbeddings(
    jobs: EmbeddingJob[]
  ): Promise<BatchEmbeddingResult> {
    const startTime = Date.now();
    const successful: string[] = [];
    const failed: Array<{ userId: string; error: string }> = [];

    console.log(`Starting batch embedding processing for ${jobs.length} users`);

    for (const job of jobs) {
      try {
        const exists = await EmbeddingManager.embeddingExists(job.userId);

        let result;
        if (exists) {
          result = await EmbeddingManager.updateProfileEmbedding(
            job.userId,
            job.profileData
          );
        } else {
          result = await EmbeddingManager.createProfileEmbedding(
            job.userId,
            job.profileData
          );
        }

        if (result.error) {
          failed.push({ userId: job.userId, error: result.error });
        } else {
          successful.push(job.userId);
        }

        // Small delay to avoid overwhelming the service
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        failed.push({ userId: job.userId, error: errorMessage });
      }
    }

    const totalTime = Date.now() - startTime;

    const result: BatchEmbeddingResult = {
      successful,
      failed,
      metrics: {
        totalProcessed: jobs.length,
        successCount: successful.length,
        failCount: failed.length,
        avgProcessingTime:
          successful.length > 0 ? totalTime / successful.length : 0,
        totalTimeMs: totalTime,
      },
    };

    console.log('Batch embedding processing completed:', result.metrics);
    return result;
  }

  /**
   * Health check for embedding service
   * @returns Promise<EmbeddingHealthCheck> - Service health status
   */
  static async healthCheck(): Promise<EmbeddingHealthCheck> {
    const errors: string[] = [];
    let serviceAvailable = false;
    let totalEmbeddings = 0;
    let lastUpdated: string | null = null;
    let sampleQuery = null;

    try {
      // Test embedding service
      serviceAvailable = await EmbeddingService.testService();
      if (!serviceAvailable) {
        errors.push('Embedding service unavailable');
      }
    } catch (error) {
      errors.push(`Embedding service error: ${error}`);
    }

    try {
      // Get embedding count and latest update
      const embeddings = await EmbeddingManager.getAllEmbeddings();
      totalEmbeddings = embeddings.length;

      if (embeddings.length > 0) {
        const latest = embeddings.reduce((latest, current) =>
          (current.updatedAt || current.createdAt || '') >
          (latest.updatedAt || latest.createdAt || '')
            ? current
            : latest
        );
        lastUpdated = latest.updatedAt || latest.createdAt || null;
      }
    } catch (error) {
      errors.push(`Error getting embeddings: ${error}`);
    }

    // Test sample search if we have embeddings
    if (serviceAvailable && totalEmbeddings > 0) {
      try {
        const startTime = Date.now();
        const testQuery = 'software engineer';
        const queryEmbedding =
          await EmbeddingService.generateEmbedding(testQuery);

        // Simple similarity test with first embedding
        const embeddings = await EmbeddingManager.getAllEmbeddings();
        if (embeddings.length > 0) {
          const firstEmbedding = JSON.parse(embeddings[0].embeddingVector);
          EmbeddingService.calculateCosineSimilarity(
            queryEmbedding,
            firstEmbedding
          );

          sampleQuery = {
            query: testQuery,
            resultCount: embeddings.length,
            processingTime: Date.now() - startTime,
          };
        }
      } catch (error) {
        errors.push(`Sample query failed: ${error}`);
      }
    }

    return {
      serviceAvailable,
      totalEmbeddings,
      lastUpdated,
      avgSimilarityRange: null, // Could be computed from sample data
      sampleQuery,
      errors,
    };
  }

  /**
   * Cleanup old or invalid embeddings
   * @returns Promise<{ cleaned: number; errors: string[] }>
   */
  static async cleanupEmbeddings(): Promise<{
    cleaned: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let cleaned = 0;

    try {
      const embeddings = await EmbeddingManager.getAllEmbeddings();

      for (const embedding of embeddings) {
        try {
          // Validate embedding vector format
          const vector = JSON.parse(embedding.embeddingVector);
          if (!Array.isArray(vector) || vector.length !== 1024) {
            console.log(
              `Cleaning invalid embedding for user ${embedding.userId}`
            );
            await EmbeddingManager.deleteProfileEmbedding(embedding.userId);
            cleaned++;
          }
        } catch (parseError) {
          console.log(
            `Cleaning corrupted embedding for user ${embedding.userId}. Errpr ${parseError}`
          );
          await EmbeddingManager.deleteProfileEmbedding(embedding.userId);
          cleaned++;
        }
      }
    } catch (error) {
      errors.push(`Cleanup error: ${error}`);
    }

    console.log(
      `Embedding cleanup completed: ${cleaned} cleaned, ${errors.length} errors`
    );
    return { cleaned, errors };
  }

  /**
   * Initialize BM25 index with all existing embeddings
   * Should be called on application startup
   * @returns Promise<{ success: boolean; count: number; error?: string }>
   */
  static async initializeBM25Index(): Promise<{ 
    success: boolean; 
    count: number; 
    error?: string 
  }> {
    try {
      console.log('Initializing BM25 index with existing embeddings...');
      
      const embeddings = await EmbeddingManager.getAllEmbeddings();
      
      if (embeddings.length === 0) {
        console.log('No embeddings found, BM25 index will be empty');
        BM25SearchService.buildIndex([]);
        return { success: true, count: 0 };
      }

      // Extract text data for BM25 indexing
      const bm25Data = embeddings
        .filter(embedding => embedding.embeddingText && embedding.embeddingText.trim())
        .map(embedding => ({
          userId: embedding.userId,
          text: embedding.embeddingText || ''
        }));

      // Initialize BM25 index (convert to expected format)
      const bm25FormattedData = bm25Data.map(item => ({
        userId: item.userId,
        embeddingText: item.text
      }));
      await BM25SearchService.initializeFromEmbeddings(bm25FormattedData);
      
      console.log(`BM25 index initialized with ${bm25Data.length} profiles`);
      return { success: true, count: bm25Data.length };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to initialize BM25 index:', errorMessage);
      return { success: false, count: 0, error: errorMessage };
    }
  }
}
