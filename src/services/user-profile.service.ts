import type { Schema } from '../../amplify/data/resource';
import { getClient } from '../lib/amplify-config';

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
   * Get anonymous summary for a user (static method for easy access)
   */
  static async getProfileSummary(userId: string): Promise<string | null> {
    try {
      const result = await getClient().models.UserProfile.get({ userId });
      return result.data?.anonymousSummary || null;
    } catch (error) {
      console.error('Error getting profile summary:', error);
      return null;
    }
  }

  /**
   * Ensure anonymous summary exists for current user (static method)
   */
  static async ensureAnonymousSummaryExists(): Promise<void> {
    // This method exists for compatibility with AuthContext
    // Implementation can be added later if needed
    console.log('ensureAnonymousSummaryExists called');
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
   * Update anonymous summary
   */
  async updateAnonymousSummary(
    userId: string,
    anonymousSummary: string
  ): Promise<DataResult<UserProfile>> {
    try {
      const result = await getClient().models.UserProfile.update({
        userId,
        anonymousSummary,
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
            : 'Failed to update anonymous summary',
      };
    }
  }
}

export const userProfileService = new UserProfileService();
