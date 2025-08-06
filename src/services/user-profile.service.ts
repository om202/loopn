import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../../amplify/data/resource';
import { getCurrentUser } from 'aws-amplify/auth';

// Generate the client
const client = generateClient<Schema>();

export interface UserProfile {
  jobRole?: string;
  companyName?: string;
  industry?: string;
  yearsOfExperience?: number;
  education?: string;
  about?: string;
  interests?: string[];
  anonymousSummary?: string;
  isOnboardingComplete: boolean;
}

export class UserProfileService {
  /**
   * Get current user's profile information
   */
  static async getUserProfile(): Promise<UserProfile | null> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const userPresence = await client.models.UserPresence.get({
        userId: user.userId,
      });

      if (userPresence?.data) {
        return {
          jobRole: userPresence.data.jobRole || undefined,
          companyName: userPresence.data.companyName || undefined,
          industry: userPresence.data.industry || undefined,
          yearsOfExperience: userPresence.data.yearsOfExperience || undefined,
          education: userPresence.data.education || undefined,
          about: userPresence.data.about || undefined,
          interests:
            userPresence.data.interests?.filter(
              (interest): interest is string => interest !== null
            ) || [],
          anonymousSummary: userPresence.data.anonymousSummary || undefined,
          isOnboardingComplete: userPresence.data.isOnboardingComplete || false,
        };
      }

      return {
        isOnboardingComplete: false,
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Get anonymous summary only
   */
  static async getAnonymousSummary(): Promise<string | null> {
    try {
      const profile = await this.getUserProfile();
      return profile?.anonymousSummary || null;
    } catch (error) {
      console.error('Error fetching anonymous summary:', error);
      return null;
    }
  }
}
