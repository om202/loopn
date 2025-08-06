import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../../amplify/data/resource';
import { getCurrentUser } from 'aws-amplify/auth';
import { amplifyInitialization } from '../lib/amplify-initialization';

// Lazy client generation
let client: ReturnType<typeof generateClient<Schema>> | null = null;

const getClient = () => {
  if (!client) {
    client = generateClient<Schema>();
  }
  return client;
};

// Helper function to ensure Amplify is ready before making API calls
async function ensureAmplifyReady(): Promise<void> {
  await amplifyInitialization.waitForReady();
}

// Constants for localStorage
const PROFILE_SUMMARY_STORAGE_KEY_PREFIX = 'loopn_profile_summary_';

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

interface CachedProfileSummary {
  summary: string;
  timestamp: number;
  userId: string;
}

// Helper function to get user-specific storage key
function getProfileSummaryStorageKey(userId: string): string {
  return `${PROFILE_SUMMARY_STORAGE_KEY_PREFIX}${userId}`;
}

// Helper function to save profile summary to localStorage
async function saveProfileSummaryToStorage(
  userId: string,
  summary: string
): Promise<void> {
  try {
    if (typeof window !== 'undefined') {
      const cacheData: CachedProfileSummary = {
        summary,
        timestamp: Date.now(),
        userId,
      };
      localStorage.setItem(
        getProfileSummaryStorageKey(userId),
        JSON.stringify(cacheData)
      );
    }
  } catch (error) {
    console.warn('Error saving profile summary to localStorage:', error);
  }
}

// Helper function to get profile summary from localStorage
async function getProfileSummaryFromStorage(
  userId: string
): Promise<string | null> {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(getProfileSummaryStorageKey(userId));
      if (stored) {
        const cacheData: CachedProfileSummary = JSON.parse(stored);
        // Verify this cache belongs to the correct user
        if (cacheData.userId === userId && cacheData.summary) {
          return cacheData.summary;
        }
      }
    }
  } catch (error) {
    console.warn('Error reading profile summary from localStorage:', error);
  }
  return null;
}

export class UserProfileService {
  /**
   * Check if current user has anonymous summary and generate if missing
   * This should be called on login for existing users
   */
  static async ensureAnonymousSummaryExists(): Promise<void> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return;
      }

      // Check if we already have a cached summary
      const cachedSummary = await getProfileSummaryFromStorage(user.userId);
      if (cachedSummary) {
        return; // Already have summary cached, no need to check again
      }

      // Ensure Amplify is ready before making API calls
      await ensureAmplifyReady();

      // Get user's current profile data
      const userPresence = await getClient().models.UserPresence.get({
        userId: user.userId,
      });

      if (!userPresence?.data) {
        return; // No profile data, user needs to complete onboarding
      }

      // Check if anonymous summary exists
      if (userPresence.data.anonymousSummary) {
        // Summary exists, cache it for future use
        await saveProfileSummaryToStorage(
          user.userId,
          userPresence.data.anonymousSummary
        );
        return;
      }

      // Check if user has completed onboarding but missing summary
      if (
        userPresence.data.isOnboardingComplete &&
        userPresence.data.jobRole &&
        userPresence.data.industry &&
        userPresence.data.about
      ) {
        console.log('Generating missing anonymous summary for existing user');

        // Generate AI summary
        let anonymousSummary = '';
        try {
          const summaryResponse =
            await getClient().queries.generateAnonymousSummary({
              jobRole: userPresence.data.jobRole,
              companyName: userPresence.data.companyName || '',
              industry: userPresence.data.industry,
              yearsOfExperience: userPresence.data.yearsOfExperience || 0,
              education: userPresence.data.education || '',
              about: userPresence.data.about,
              interests:
                userPresence.data.interests?.filter(
                  (interest): interest is string => interest !== null
                ) || [],
            });

          if (summaryResponse.data?.summary) {
            anonymousSummary = summaryResponse.data.summary;
          }
        } catch (aiError) {
          console.warn(
            'AI summary generation failed, using fallback:',
            aiError
          );
          // Create a simple fallback summary
          anonymousSummary = `${userPresence.data.jobRole} with ${userPresence.data.yearsOfExperience || 0} years of experience in ${userPresence.data.industry}.`;
          if (
            userPresence.data.interests &&
            userPresence.data.interests.length > 0
          ) {
            const validInterests = userPresence.data.interests.filter(
              (interest): interest is string => interest !== null
            );
            if (validInterests.length > 0) {
              anonymousSummary += ` Passionate about ${validInterests.slice(0, 2).join(' and ')}.`;
            }
          }
        }

        // Update user presence with the generated summary
        await getClient().models.UserPresence.update({
          userId: user.userId,
          anonymousSummary: anonymousSummary,
        });

        // Cache the summary
        await saveProfileSummaryToStorage(user.userId, anonymousSummary);

        console.log('Anonymous summary generated and saved for existing user');
      }
    } catch (error) {
      console.error('Error ensuring anonymous summary exists:', error);
    }
  }

  /**
   * Get current user's profile information
   */
  static async getUserProfile(): Promise<UserProfile | null> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const userPresence = await getClient().models.UserPresence.get({
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
   * Get anonymous summary only for current user
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

  /**
   * Get profile summary for any user with localStorage caching
   * First checks localStorage, then API if not found
   */
  static async getProfileSummary(userId: string): Promise<string | null> {
    try {
      // First, try to get from localStorage
      const cachedSummary = await getProfileSummaryFromStorage(userId);
      if (cachedSummary) {
        return cachedSummary;
      }

      // Ensure Amplify is ready before making API calls
      await ensureAmplifyReady();

      // If not in cache, fetch from API
      const userPresence = await getClient().models.UserPresence.get({
        userId: userId,
      });

      if (userPresence?.data?.anonymousSummary) {
        const summary = userPresence.data.anonymousSummary;
        // Save to localStorage for future use
        await saveProfileSummaryToStorage(userId, summary);
        return summary;
      }

      return null;
    } catch (error) {
      console.error('Error fetching profile summary for user:', userId, error);
      return null;
    }
  }

  /**
   * Get profile summaries for multiple users (bulk operation)
   * Efficiently handles localStorage caching for multiple users
   */
  static async getProfileSummaries(
    userIds: string[]
  ): Promise<Map<string, string>> {
    const summaryMap = new Map<string, string>();
    const uncachedUserIds: string[] = [];

    // First, check localStorage for all users
    for (const userId of userIds) {
      const cachedSummary = await getProfileSummaryFromStorage(userId);
      if (cachedSummary) {
        summaryMap.set(userId, cachedSummary);
      } else {
        uncachedUserIds.push(userId);
      }
    }

    // If there are uncached users, fetch from API
    if (uncachedUserIds.length > 0) {
      try {
        const promises = uncachedUserIds.map(async userId => {
          const userPresence = await getClient().models.UserPresence.get({
            userId: userId,
          });

          if (userPresence?.data?.anonymousSummary) {
            const summary = userPresence.data.anonymousSummary;
            summaryMap.set(userId, summary);
            // Cache for future use
            await saveProfileSummaryToStorage(userId, summary);
          }
        });

        await Promise.all(promises);
      } catch (error) {
        console.error('Error fetching profile summaries from API:', error);
      }
    }

    return summaryMap;
  }
}
