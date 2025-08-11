import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../../amplify/data/resource';
import { getCurrentUser } from 'aws-amplify/auth';
import { uploadData } from 'aws-amplify/storage';
import { amplifyInitialization } from '../lib/amplify-initialization';

export interface OnboardingData {
  fullName: string;
  jobRole: string;
  companyName: string;
  industry: string;
  yearsOfExperience: number;
  education: string;
  about: string;
  interests: string[];
  skills: string[];
  profilePictureFile?: File; // For upload during onboarding
  profilePictureUrl?: string; // S3 URL after upload
}

export interface UserOnboardingStatus {
  isOnboardingComplete: boolean;
  onboardingData?: OnboardingData;
}

const ONBOARDING_STORAGE_KEY_PREFIX = 'loopn_onboarding_status_';

export class OnboardingService {
  /**
   * Get user-specific localStorage key
   */
  private static async getUserStorageKey(): Promise<string> {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    return `${ONBOARDING_STORAGE_KEY_PREFIX}${user.userId}`;
  }

  /**
   * Check if user has completed onboarding
   * First checks localStorage, then API if needed
   */
  static async checkOnboardingStatus(): Promise<UserOnboardingStatus> {
    try {
      // First check localStorage
      const cachedStatus = await this.getOnboardingStatusFromStorage();
      if (cachedStatus !== null) {
        return cachedStatus;
      }

      // Ensure Amplify is ready before making API calls
      await amplifyInitialization.waitForReady();

      // If not in localStorage, check API
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const client = generateClient<Schema>();
      const userPresence = await client.models.UserPresence.get({
        userId: user.userId,
      });

      if (userPresence?.data) {
        const isComplete = userPresence.data.isOnboardingComplete || false;
        const status: UserOnboardingStatus = {
          isOnboardingComplete: isComplete,
          onboardingData: isComplete
            ? {
                jobRole: userPresence.data.jobRole || '',
                companyName: userPresence.data.companyName || '',
                industry: userPresence.data.industry || '',
                yearsOfExperience: userPresence.data.yearsOfExperience || 0,
                education: userPresence.data.education || '',
                about: userPresence.data.about || '',
                interests: (userPresence.data.interests || []).filter(
                  (interest): interest is string => interest !== null
                ),
                skills: (userPresence.data.skills || []).filter(
                  (skill): skill is string => skill !== null
                ),
              }
            : undefined,
        };

        // Cache the status
        await this.setOnboardingStatusInStorage(status);
        return status;
      }

      // Default for new users
      const defaultStatus: UserOnboardingStatus = {
        isOnboardingComplete: false,
      };

      await this.setOnboardingStatusInStorage(defaultStatus);
      return defaultStatus;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return { isOnboardingComplete: false };
    }
  }

  /**
   * Complete user onboarding
   */
  static async completeOnboarding(data: OnboardingData): Promise<void> {
    try {
      // Ensure Amplify is ready before making API calls
      await amplifyInitialization.waitForReady();

      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const client = generateClient<Schema>();

      // Handle profile picture upload if provided
      let profilePictureUrl: string | undefined;
      let hasProfilePicture = false;

      if (data.profilePictureFile) {
        try {
          const fileExtension =
            data.profilePictureFile.name.split('.').pop() || 'jpg';
          const fileName = `${user.userId}/profile.${fileExtension}`;

          const uploadResult = await uploadData({
            key: `profile-pictures/${fileName}`,
            data: data.profilePictureFile,
            options: {
              contentType: data.profilePictureFile.type,
            },
          }).result;

          profilePictureUrl = uploadResult.key;
          hasProfilePicture = true;
          console.log('Profile picture uploaded:', profilePictureUrl);
        } catch (uploadError) {
          console.error('Failed to upload profile picture:', uploadError);
          // Continue with onboarding even if image upload fails
        }
      }

      // Generate AI summary in the background
      let anonymousSummary = '';
      try {
        const summaryResponse = await client.queries.generateAnonymousSummary({
          jobRole: data.jobRole,
          companyName: data.companyName,
          industry: data.industry,
          yearsOfExperience: data.yearsOfExperience,
          education: data.education,
          about: data.about,
          interests: data.interests,
        });

        if (summaryResponse.data?.summary) {
          anonymousSummary = summaryResponse.data.summary;
        }
      } catch (aiError) {
        console.warn('AI summary generation failed, using fallback:', aiError);
        // Create a simple fallback summary
        const skillsSnippet = (data.skills || []).slice(0, 2).join(' and ');
        const interestsSnippet = (data.interests || [])
          .slice(0, 2)
          .join(' and ');
        anonymousSummary = `${data.jobRole} with ${data.yearsOfExperience} years of experience in ${data.industry}. Skills include ${skillsSnippet || 'N/A'}. Interested in ${interestsSnippet || 'varied topics'}.`;
      }

      // Update user presence with onboarding data and AI summary
      await client.models.UserPresence.update({
        userId: user.userId,
        fullName: data.fullName,
        jobRole: data.jobRole,
        companyName: data.companyName,
        industry: data.industry,
        yearsOfExperience: data.yearsOfExperience,
        education: data.education,
        about: data.about,
        interests: data.interests,
        skills: data.skills,
        isOnboardingComplete: true,
        onboardingCompletedAt: new Date().toISOString(),
        anonymousSummary: anonymousSummary,
        profilePictureUrl: profilePictureUrl,
        hasProfilePicture: hasProfilePicture,
      });

      // Update localStorage
      const status: UserOnboardingStatus = {
        isOnboardingComplete: true,
        onboardingData: data,
      };

      await this.setOnboardingStatusInStorage(status);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  }

  /**
   * Save partial onboarding data to localStorage
   * This allows users to resume if they close the page
   */
  static async savePartialOnboardingData(
    data: Partial<OnboardingData>
  ): Promise<void> {
    try {
      const currentStatus = (await this.getOnboardingStatusFromStorage()) || {
        isOnboardingComplete: false,
      };

      const updatedStatus: UserOnboardingStatus = {
        ...currentStatus,
        onboardingData: {
          ...currentStatus.onboardingData,
          ...data,
        } as OnboardingData,
      };

      await this.setOnboardingStatusInStorage(updatedStatus);
    } catch (error) {
      console.error('Error saving partial onboarding data:', error);
    }
  }

  /**
   * Get partial onboarding data from localStorage
   */
  static async getPartialOnboardingData(): Promise<Partial<OnboardingData> | null> {
    try {
      const status = await this.getOnboardingStatusFromStorage();
      return status?.onboardingData || null;
    } catch (error) {
      console.error('Error getting partial onboarding data:', error);
      return null;
    }
  }

  /**
   * Clear onboarding data from localStorage
   */
  static async clearOnboardingData(): Promise<void> {
    try {
      const storageKey = await this.getUserStorageKey();
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Error clearing onboarding data:', error);
    }
  }

  /**
   * Force refresh onboarding status from API
   */
  static async refreshOnboardingStatus(): Promise<UserOnboardingStatus> {
    await this.clearOnboardingData();
    return this.checkOnboardingStatus();
  }

  // Private helper methods
  private static async getOnboardingStatusFromStorage(): Promise<UserOnboardingStatus | null> {
    try {
      if (typeof window === 'undefined') return null;

      const storageKey = await this.getUserStorageKey();
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;

      return JSON.parse(stored);
    } catch (error) {
      console.error('Error reading onboarding status from storage:', error);
      return null;
    }
  }

  private static async setOnboardingStatusInStorage(
    status: UserOnboardingStatus
  ): Promise<void> {
    try {
      if (typeof window === 'undefined') return;

      const storageKey = await this.getUserStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(status));
    } catch (error) {
      console.error('Error saving onboarding status to storage:', error);
    }
  }
}
