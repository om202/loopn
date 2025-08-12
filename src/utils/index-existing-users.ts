import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import {
  VectorSearchService,
  UserProfile,
} from '../services/vector-search.service';

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
      .map(profile => {
        const userProfile: UserProfile = {};

        // Only include fields that have actual values (not null, undefined, or empty strings)
        if (profile.jobRole && profile.jobRole.trim()) {
          userProfile.jobRole = profile.jobRole.trim();
        }
        if (profile.companyName && profile.companyName.trim()) {
          userProfile.companyName = profile.companyName.trim();
        }
        if (profile.industry && profile.industry.trim()) {
          userProfile.industry = profile.industry.trim();
        }
        if (
          typeof profile.yearsOfExperience === 'number' &&
          profile.yearsOfExperience >= 0
        ) {
          userProfile.yearsOfExperience = profile.yearsOfExperience;
        }
        if (profile.education && profile.education.trim()) {
          userProfile.education = profile.education.trim();
        }
        if (profile.about && profile.about.trim()) {
          userProfile.about = profile.about.trim();
        }
        if (
          profile.interests &&
          Array.isArray(profile.interests) &&
          profile.interests.length > 0
        ) {
          const validInterests = profile.interests
            .filter(
              (item): item is string =>
                item !== null &&
                item !== undefined &&
                typeof item === 'string' &&
                Boolean(item.trim())
            )
            .map(item => item.trim());
          if (validInterests.length > 0) {
            userProfile.interests = validInterests;
          }
        }
        if (
          profile.skills &&
          Array.isArray(profile.skills) &&
          profile.skills.length > 0
        ) {
          const validSkills = profile.skills
            .filter(
              (item): item is string =>
                item !== null &&
                item !== undefined &&
                typeof item === 'string' &&
                Boolean(item.trim())
            )
            .map(item => item.trim());
          if (validSkills.length > 0) {
            userProfile.skills = validSkills;
          }
        }

        return {
          userId: profile.userId,
          userProfile,
        };
      })
      .filter(user => {
        // Ensure userProfile has at least one field
        const hasContent = Object.keys(user.userProfile).length > 0;
        if (!hasContent) {
          console.log(
            `Skipping user ${user.userId} - empty userProfile after filtering`
          );
          results.skippedCount++;
        }
        return hasContent;
      });

    if (usersToIndex.length === 0) {
      console.log('No users to index after filtering');
      return results;
    }

    console.log(`Indexing ${usersToIndex.length} users...`);

    // Index users one by one to avoid GraphQL serialization issues
    for (let i = 0; i < usersToIndex.length; i++) {
      const user = usersToIndex[i];

      try {
        const response = await VectorSearchService.indexUserProfile(
          user.userId,
          user.userProfile
        );

        if (response.success) {
          results.indexedCount++;
          console.log(
            `Successfully indexed user ${i + 1}/${usersToIndex.length}: ${user.userId}`
          );
        } else {
          results.errors.push(`User ${user.userId} failed: ${response.error}`);
          console.error(`Failed to index user ${user.userId}:`, response.error);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`User ${user.userId} error: ${errorMessage}`);
        console.error(`Error indexing user ${user.userId}:`, error);
      }

      // Small delay between requests
      if (i < usersToIndex.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
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
