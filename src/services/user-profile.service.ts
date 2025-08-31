import type { Schema } from '../../amplify/data/resource';
import { getClient } from '../lib/amplify-config';

type UserProfile = Schema['UserProfile']['type'];
type DataResult<T> = { data: T | null; error: string | null };
type ListResult<T> = { data: T[]; error: string | null };

export interface ProfileData {
  // Personal Information
  fullName: string;
  phone?: string;
  city?: string;
  country?: string;

  // Professional URLs
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;

  // Current Professional Info (for compatibility)
  jobRole: string;
  companyName: string;
  industry: string | null | undefined; // Allow null/undefined for DynamoDB secondary index compatibility
  yearsOfExperience: number;
  education: string;
  about: string;

  // Professional Background & Skills
  interests: string[];
  skills: string[];
  hobbies?: string[];

  // Detailed Professional Background
  workExperience?: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;

  educationHistory?: Array<{
    institution: string;
    degree: string;
    field: string;
    startYear: string;
    endYear: string;
  }>;

  projects?: Array<{
    title: string;
    description: string;
    technologies: string;
  }>;

  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
    expiryDate: string;
  }>;

  awards?: Array<{
    title: string;
    issuer: string;
    date: string;
    description: string;
  }>;

  languages?: Array<{
    language: string;
    proficiency: string;
  }>;

  publications?: Array<{
    title: string;
    venue: string;
    date: string;
    description: string;
  }>;

  // Profile picture fields
  profilePictureUrl?: string;
  hasProfilePicture?: boolean;

  // Auto-fill tracking
  autoFilledFields?: string[];
}

// Helper function to safely parse JSON fields from database
function safeParseJsonField<T>(jsonField: any): T | null {
  if (!jsonField) return null;

  // If it's already an object/array, return as is
  if (typeof jsonField === 'object' && jsonField !== null) {
    return jsonField as T;
  }

  // If it's a string, try to parse it
  if (typeof jsonField === 'string') {
    try {
      return JSON.parse(jsonField) as T;
    } catch (error) {
      console.warn('Failed to parse JSON field:', jsonField, error);
      return null;
    }
  }

  return null;
}

// Helper function to parse all JSON fields in a user profile
function parseUserProfileJsonFields(profile: UserProfile): UserProfile {
  return {
    ...profile,
    workExperience: safeParseJsonField<ProfileData['workExperience']>(
      profile.workExperience
    ),
    educationHistory: safeParseJsonField<ProfileData['educationHistory']>(
      profile.educationHistory
    ),
    projects: safeParseJsonField<ProfileData['projects']>(profile.projects),
    certifications: safeParseJsonField<ProfileData['certifications']>(
      profile.certifications
    ),
    awards: safeParseJsonField<ProfileData['awards']>(profile.awards),
    languages: safeParseJsonField<ProfileData['languages']>(profile.languages),
    publications: safeParseJsonField<ProfileData['publications']>(
      profile.publications
    ),
  };
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

      // Parse JSON fields before returning
      return result.data ? parseUserProfileJsonFields(result.data) : null;
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
      // Convert JSON fields to strings as required by GraphQL schema
      const jsonFields = {
        workExperience: profileData.workExperience
          ? JSON.stringify(profileData.workExperience)
          : undefined,
        educationHistory: profileData.educationHistory
          ? JSON.stringify(profileData.educationHistory)
          : undefined,
        projects: profileData.projects
          ? JSON.stringify(profileData.projects)
          : undefined,
        certifications: profileData.certifications
          ? JSON.stringify(profileData.certifications)
          : undefined,
        awards: profileData.awards
          ? JSON.stringify(profileData.awards)
          : undefined,
        languages: profileData.languages
          ? JSON.stringify(profileData.languages)
          : undefined,
        publications: profileData.publications
          ? JSON.stringify(profileData.publications)
          : undefined,
      };

      const result = await getClient().models.UserProfile.create({
        userId,
        email,
        // Spread all other profile data
        ...profileData,
        // Override JSON fields with stringified versions
        ...jsonFields,
        isOnboardingComplete: true,
        onboardingCompletedAt: new Date().toISOString(),
      });

      // Note: User profile indexing for search has been removed
      console.log('User profile created successfully:', userId);

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
      // Convert JSON fields to strings as required by GraphQL schema
      const jsonFields = {
        workExperience: updates.workExperience
          ? JSON.stringify(updates.workExperience)
          : undefined,
        educationHistory: updates.educationHistory
          ? JSON.stringify(updates.educationHistory)
          : undefined,
        projects: updates.projects
          ? JSON.stringify(updates.projects)
          : undefined,
        certifications: updates.certifications
          ? JSON.stringify(updates.certifications)
          : undefined,
        awards: updates.awards ? JSON.stringify(updates.awards) : undefined,
        languages: updates.languages
          ? JSON.stringify(updates.languages)
          : undefined,
        publications: updates.publications
          ? JSON.stringify(updates.publications)
          : undefined,
      };

      // Filter out undefined values
      const filteredJsonFields = Object.fromEntries(
        Object.entries(jsonFields).filter(([, value]) => value !== undefined)
      );

      const result = await getClient().models.UserProfile.update({
        userId,
        // Spread all other updates
        ...updates,
        // Override JSON fields with stringified versions if they exist in updates
        ...filteredJsonFields,
      });

      // Note: User profile re-indexing for search has been removed
      console.log('User profile updated successfully:', userId);

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
        data: result.data ? parseUserProfileJsonFields(result.data) : null,
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
