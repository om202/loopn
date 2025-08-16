import type { Schema } from '../../amplify/data/resource';
import { getClient } from '../lib/amplify-config';
import { OpenSearchService } from './opensearch.service';

type UserProfile = Schema['UserProfile']['type'];
type DataResult<T> = { data: T | null; error: string | null };
type ListResult<T> = { data: T[]; error: string | null };

export interface ProfileData {
  fullName: string;
  jobRole: string;
  companyName: string;
  industry: string;
  yearsOfExperience: number;
  education: string;
  about: string;
  interests: string[];
  skills: string[];
  profilePictureUrl?: string;
  hasProfilePicture?: boolean;
}

export class UserProfileService {
  /**
   * Get user profile details for display (replaces anonymous summary)
   */
  static async getProfileDetails(userId: string): Promise<UserProfile | null> {
    const apiStartTime = performance.now();
    console.log(`🔄 API: Starting getProfileDetails for userId: ${userId}`);

    try {
      const result = await getClient().models.UserProfile.get({ userId });
      const apiEndTime = performance.now();

      console.log(`✅ API: getProfileDetails completed for userId: ${userId}`, {
        duration: `${(apiEndTime - apiStartTime).toFixed(2)}ms`,
        hasData: !!result.data,
        dataKeys: result.data ? Object.keys(result.data) : 'null',
      });

      return result.data || null;
    } catch (error) {
      const apiEndTime = performance.now();
      console.error(
        `❌ API: Error getting profile details for userId: ${userId}`,
        {
          duration: `${(apiEndTime - apiStartTime).toFixed(2)}ms`,
          error: error,
        }
      );
      return null;
    }
  }

  /**
   * Create a new user profile
   */
  async createUserProfile(
    userId: string,
    email: string,
    profileData: ProfileData
  ): Promise<DataResult<UserProfile>> {
    try {
      const result = await getClient().models.UserProfile.create({
        userId,
        email,
        ...profileData,
        isOnboardingComplete: true,
        onboardingCompletedAt: new Date().toISOString(),
      });

      // Automatically index the user profile for vector search
      if (result.data) {
        try {
          console.log('Indexing user profile for search:', userId);
          const indexResult = await OpenSearchService.indexUser(userId, {
            ...profileData,
            userId,
          });
          console.log('User indexing result:', indexResult);

          if (!indexResult.success) {
            console.error('Failed to index user:', indexResult.error);
          }
        } catch (indexError) {
          console.error(
            'Failed to index user profile for vector search:',
            indexError
          );
          // Continue even if indexing fails
        }
      }

      return {
        data: result.data,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create user profile',
      };
    }
  }

  /**
   * Update an existing user profile
   */
  async updateUserProfile(
    userId: string,
    updates: Partial<ProfileData>
  ): Promise<DataResult<UserProfile>> {
    try {
      const result = await getClient().models.UserProfile.update({
        userId,
        ...updates,
      });

      // Re-index the user profile for vector search if update was successful
      if (result.data) {
        try {
          // Get the full profile to re-index
          const fullProfile =
            await UserProfileService.getProfileDetails(userId);
          if (fullProfile) {
            const profileData: ProfileData = {
              fullName: fullProfile.fullName || '',
              jobRole: fullProfile.jobRole || '',
              companyName: fullProfile.companyName || '',
              industry: fullProfile.industry || '',
              yearsOfExperience: fullProfile.yearsOfExperience || 0,
              education: fullProfile.education || '',
              about: fullProfile.about || '',
              interests: (fullProfile.interests || []).filter(
                (item): item is string => item !== null
              ),
              skills: (fullProfile.skills || []).filter(
                (item): item is string => item !== null
              ),
              profilePictureUrl: fullProfile.profilePictureUrl || undefined,
              hasProfilePicture: fullProfile.hasProfilePicture || false,
            };
            await OpenSearchService.indexUser(userId, {
              ...profileData,
              userId,
            });
          }
        } catch (indexError) {
          console.error(
            'Failed to re-index user profile for vector search:',
            indexError
          );
          // Continue even if indexing fails
        }
      }

      return {
        data: result.data,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update user profile',
      };
    }
  }

  /**
   * Get a user's profile by userId
   */
  async getUserProfile(userId: string): Promise<DataResult<UserProfile>> {
    try {
      const result = await getClient().models.UserProfile.get({ userId });
      return {
        data: result.data,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch user profile',
      };
    }
  }

  /**
   * Check if user has completed onboarding
   */
  async hasCompletedOnboarding(userId: string): Promise<boolean> {
    try {
      const result = await this.getUserProfile(userId);
      return result.data?.isOnboardingComplete ?? false;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }

  /**
   * Get all users who have completed onboarding
   */
  async getOnboardedUsers(): Promise<ListResult<UserProfile>> {
    try {
      const result = await getClient().models.UserProfile.list({
        filter: {
          isOnboardingComplete: { eq: true },
        },
      });

      return {
        data: result.data || [],
        error: null,
      };
    } catch (error) {
      return {
        data: [],
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch onboarded users',
      };
    }
  }

  /**
   * Get users by industry
   */
  async getUsersByIndustry(industry: string): Promise<ListResult<UserProfile>> {
    try {
      const result = await getClient().models.UserProfile.list({
        filter: {
          industry: { eq: industry },
          isOnboardingComplete: { eq: true },
        },
      });

      return {
        data: result.data || [],
        error: null,
      };
    } catch (error) {
      return {
        data: [],
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch users by industry',
      };
    }
  }

  /**
   * Update profile picture information
   */
  async updateProfilePicture(
    userId: string,
    profilePictureUrl: string
  ): Promise<DataResult<UserProfile>> {
    try {
      const result = await getClient().models.UserProfile.update({
        userId,
        profilePictureUrl,
        hasProfilePicture: true,
      });

      return {
        data: result.data,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update profile picture',
      };
    }
  }

  /**
   * Fix hasProfilePicture flag for users who have uploaded profile pictures
   * This is a utility method to fix existing users
   */
  async fixHasProfilePictureFlag(
    userId: string
  ): Promise<DataResult<UserProfile>> {
    try {
      const userProfile = await this.getUserProfile(userId);

      if (!userProfile.data) {
        return {
          data: null,
          error: 'User profile not found',
        };
      }

      // If user has profilePictureUrl but hasProfilePicture is false, fix it
      if (
        userProfile.data.profilePictureUrl &&
        !userProfile.data.hasProfilePicture
      ) {
        console.log(`Fixing hasProfilePicture flag for user ${userId}`);

        const result = await getClient().models.UserProfile.update({
          userId,
          hasProfilePicture: true,
        });

        return {
          data: result.data,
          error: null,
        };
      }

      return {
        data: userProfile.data,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fix hasProfilePicture flag',
      };
    }
  }
}

export const userProfileService = new UserProfileService();
