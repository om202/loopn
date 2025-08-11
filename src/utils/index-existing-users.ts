import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { VectorSearchService } from '../services/vector-search.service';

const client = generateClient<Schema>();

/**
 * Utility to index all existing users for vector search
 * This should be run once after deploying the vector search feature
 */
export async function indexAllExistingUsers(): Promise<{
  success: boolean;
  indexedCount: number;
  skippedCount: number;
  errors: string[];
}> {
  const results = {
    success: true,
    indexedCount: 0,
    skippedCount: 0,
    errors: [] as string[],
  };

  try {
    // Get all user profiles that have completed onboarding
    const { data: profiles, errors } = await client.models.UserProfile.list({
      filter: {
        isOnboardingComplete: { eq: true },
      },
    });

    if (errors && errors.length > 0) {
      console.error('Error fetching user profiles:', errors);
      results.errors.push(...errors.map(e => e.message));
      results.success = false;
      return results;
    }

    if (!profiles || profiles.length === 0) {
      console.log('No user profiles found to index');
      return results;
    }

    console.log(`Found ${profiles.length} user profiles to index`);

    // Prepare users for bulk indexing
    const usersToIndex = profiles
      .filter(profile => {
        // Skip profiles that don't have enough information
        if (
          !profile.jobRole &&
          !profile.companyName &&
          !profile.industry &&
          !profile.about
        ) {
          console.log(
            `Skipping user ${profile.userId} - insufficient profile data`
          );
          results.skippedCount++;
          return false;
        }
        return true;
      })
      .map(profile => ({
        userId: profile.userId,
        userProfile: {
          jobRole: profile.jobRole || '',
          companyName: profile.companyName || '',
          industry: profile.industry || '',
          yearsOfExperience: profile.yearsOfExperience || 0,
          education: profile.education || '',
          about: profile.about || '',
          interests: profile.interests || [],
          skills: profile.skills || [],
        },
      }));

    if (usersToIndex.length === 0) {
      console.log('No users to index after filtering');
      return results;
    }

    console.log(`Indexing ${usersToIndex.length} users...`);

    // Index users in batches of 10 to avoid timeouts
    const batchSize = 10;
    for (let i = 0; i < usersToIndex.length; i += batchSize) {
      const batch = usersToIndex.slice(i, i + batchSize);

      try {
        const response = await VectorSearchService.bulkIndexUsers(batch);

        if (response.success) {
          results.indexedCount += batch.length;
          console.log(
            `Successfully indexed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(usersToIndex.length / batchSize)}`
          );
        } else {
          results.errors.push(
            `Batch ${Math.floor(i / batchSize) + 1} failed: ${response.error}`
          );
          console.error(
            `Failed to index batch ${Math.floor(i / batchSize) + 1}:`,
            response.error
          );
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(
          `Batch ${Math.floor(i / batchSize) + 1} error: ${errorMessage}`
        );
        console.error(
          `Error indexing batch ${Math.floor(i / batchSize) + 1}:`,
          error
        );
      }

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (results.errors.length > 0) {
      results.success = false;
    }

    console.log(
      `Indexing complete. Indexed: ${results.indexedCount}, Skipped: ${results.skippedCount}, Errors: ${results.errors.length}`
    );
  } catch (error) {
    console.error('Error in indexAllExistingUsers:', error);
    results.success = false;
    results.errors.push(
      error instanceof Error ? error.message : 'Unknown error'
    );
  }

  return results;
}

/**
 * Check the status of vector search indexing
 */
export async function getIndexingStatus(): Promise<{
  totalUsers: number;
  indexedUsers: number;
  notIndexedUsers: number;
}> {
  try {
    const { data: profiles } = await client.models.UserProfile.list({
      filter: {
        isOnboardingComplete: { eq: true },
      },
    });

    const totalUsers = profiles?.length || 0;
    const indexedUsers =
      profiles?.filter(p => p.profileEmbedding && p.profileEmbedding.length > 0)
        .length || 0;
    const notIndexedUsers = totalUsers - indexedUsers;

    return {
      totalUsers,
      indexedUsers,
      notIndexedUsers,
    };
  } catch (error) {
    console.error('Error getting indexing status:', error);
    return {
      totalUsers: 0,
      indexedUsers: 0,
      notIndexedUsers: 0,
    };
  }
}
