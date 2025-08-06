import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../../amplify/data/resource';
import { getCurrentUser } from 'aws-amplify/auth';

// Generate the client
const client = generateClient<Schema>();

export interface OnboardingData {
  jobRole: string;
  companyName: string;
  industry: string;
  yearsOfExperience: number;
  education: string;
  about: string;
  interests: string[];
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

      // If not in localStorage, check API
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

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
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Update user presence with onboarding data
      await client.models.UserPresence.update({
        userId: user.userId,
        jobRole: data.jobRole,
        companyName: data.companyName,
        industry: data.industry,
        yearsOfExperience: data.yearsOfExperience,
        education: data.education,
        about: data.about,
        interests: data.interests,
        isOnboardingComplete: true,
        onboardingCompletedAt: new Date().toISOString(),
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
  static async savePartialOnboardingData(data: Partial<OnboardingData>): Promise<void> {
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
