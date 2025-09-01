import { getCurrentUser } from 'aws-amplify/auth';
import { uploadData } from 'aws-amplify/storage';
import { amplifyInitialization } from '../lib/amplify-initialization';
import { userProfileService } from './user-profile.service';

export interface OnboardingData {
  // Personal Information
  fullName: string;
  gender?: 'MALE' | 'FEMALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY' | 'SELF_DESCRIBE';
  genderCustom?: string; // For self-describe option
  email?: string;
  phone?: string;
  city?: string;
  country?: string;

  // Professional URLs
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;

  // Current Professional Info (for compatibility) - made optional to match UI validation
  jobRole?: string;
  companyName?: string;
  industry?: string;
  yearsOfExperience?: number;
  education?: string; // Keep as string for compatibility, but also have detailed education below
  about?: string;

  // Detailed Professional Background - made optional since they're dynamic
  workExperience?: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;

  // Detailed Education - made optional since they're dynamic
  educationHistory?: Array<{
    institution: string;
    degree: string;
    field: string;
    startYear: string;
    endYear: string;
  }>;

  // Skills & Projects - made optional to match UI behavior
  skills?: string[];
  projects?: Array<{
    title: string;
    description: string;
    technologies: string;
  }>;

  // Additional Qualifications - made optional since they're dynamic
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

  // Personal Interests - made optional to match UI validation
  interests?: string[]; // Professional interests from our current system
  hobbies?: string[]; // Personal hobbies from resume

  // Professional Status
  hiringStatus?: 'NOT_SPECIFIED' | 'HIRING' | 'LOOKING_FOR_JOB' | 'OPEN_TO_OPPORTUNITIES' | 'NOT_LOOKING';

  // Profile Picture
  profilePictureFile?: File; // For upload during onboarding
  profilePictureUrl?: string; // S3 URL after upload

  // Auto-fill tracking
  autoFilledFields?: string[]; // Track which fields were auto-populated from resume
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

      // If not in localStorage, get from API
      return await this.getOnboardingStatusFromAPI();
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return { isOnboardingComplete: false };
    }
  }

  /**
   * Get onboarding status directly from API
   */
  private static async getOnboardingStatusFromAPI(): Promise<UserOnboardingStatus> {
    try {
      // Ensure Amplify is ready before making API calls
      await amplifyInitialization.waitForReady();

      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const userProfileResult = await userProfileService.getUserProfile(
        user.userId
      );

      if (userProfileResult.data) {
        const userProfile = userProfileResult.data;
        const isComplete = userProfile.isOnboardingComplete || false;

        const status: UserOnboardingStatus = {
          isOnboardingComplete: isComplete,
          onboardingData: isComplete
            ? {
                // Personal Information
                fullName: userProfile.fullName || '',
                gender: userProfile.gender || undefined,
                genderCustom: userProfile.genderCustom || undefined,
                email: userProfile.email || undefined,
                phone: userProfile.phone || undefined,
                city: userProfile.city || undefined,
                country: userProfile.country || undefined,

                // Professional URLs
                linkedinUrl: userProfile.linkedinUrl || undefined,
                githubUrl: userProfile.githubUrl || undefined,
                portfolioUrl: userProfile.portfolioUrl || undefined,

                // Current Professional Info
                jobRole: userProfile.jobRole || '',
                companyName: userProfile.companyName || '',
                industry: userProfile.industry || '',
                yearsOfExperience: userProfile.yearsOfExperience || 0,
                education: userProfile.education || '',
                about: userProfile.about || '',

                // Professional Background & Skills
                interests: (userProfile.interests || []).filter(
                  (interest: string | null): interest is string =>
                    interest !== null
                ),
                skills: (userProfile.skills || []).filter(
                  (skill: string | null): skill is string => skill !== null
                ),
                hobbies: (userProfile.hobbies || []).filter(
                  (hobby: string | null): hobby is string => hobby !== null
                ),

                // Professional Status
                hiringStatus: userProfile.hiringStatus || 'NOT_SPECIFIED',

                // Detailed Professional Background - parse JSON strings back to objects
                workExperience:
                  (this.safeParseJSON(
                    userProfile.workExperience
                  ) as OnboardingData['workExperience']) || [],
                educationHistory:
                  (this.safeParseJSON(
                    userProfile.educationHistory
                  ) as OnboardingData['educationHistory']) || [],
                projects:
                  (this.safeParseJSON(
                    userProfile.projects
                  ) as OnboardingData['projects']) || [],
                certifications:
                  (this.safeParseJSON(
                    userProfile.certifications
                  ) as OnboardingData['certifications']) || [],
                awards:
                  (this.safeParseJSON(
                    userProfile.awards
                  ) as OnboardingData['awards']) || [],
                languages:
                  (this.safeParseJSON(
                    userProfile.languages
                  ) as OnboardingData['languages']) || [],
                publications:
                  (this.safeParseJSON(
                    userProfile.publications
                  ) as OnboardingData['publications']) || [],

                // Profile picture fields
                profilePictureUrl: userProfile.profilePictureUrl || undefined,

                // Auto-fill tracking
                autoFilledFields: (userProfile.autoFilledFields || []).filter(
                  (field: string | null): field is string => field !== null
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
      console.error('Error getting onboarding status from API:', error);
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
          console.log('Profile picture uploaded successfully:', {
            key: profilePictureUrl,
            size: data.profilePictureFile.size,
            type: data.profilePictureFile.type,
          });
        } catch (uploadError) {
          console.error('Failed to upload profile picture:', uploadError);
          // Continue with onboarding even if image upload fails
        }
      }

      // Create user profile with expanded onboarding data
      const profileData = {
        // Personal Information
        fullName: data.fullName,
        gender: data.gender || null,
        genderCustom: data.genderCustom || null,
        phone: data.phone,
        city: data.city,
        country: data.country,

        // Professional URLs
        linkedinUrl: data.linkedinUrl,
        githubUrl: data.githubUrl,
        portfolioUrl: data.portfolioUrl,

        // Current Professional Info - provide defaults for optional fields (null for indexed fields)
        jobRole: data.jobRole || '',
        companyName: data.companyName || '',
        industry: data.industry || null, // null instead of '' for DynamoDB secondary index
        yearsOfExperience: data.yearsOfExperience || 0,
        education: data.education || '',
        about: data.about || '',

        // Professional Background & Skills - provide defaults for arrays
        interests: data.interests || [],
        skills: data.skills || [],
        hobbies: data.hobbies || [],

        // Professional Status
        hiringStatus: data.hiringStatus || 'NOT_SPECIFIED',

        // Detailed Professional Background - provide defaults for arrays
        workExperience: data.workExperience || [],
        educationHistory: data.educationHistory || [],
        projects: data.projects || [],
        certifications: data.certifications || [],
        awards: data.awards || [],
        languages: data.languages || [],
        publications: data.publications || [],

        // Profile picture fields
        profilePictureUrl: profilePictureUrl,
        hasProfilePicture: hasProfilePicture,

        // Auto-fill tracking
        autoFilledFields: data.autoFilledFields || [],
      };

      await userProfileService.createUserProfile(
        user.userId,
        user.signInDetails?.loginId || '',
        profileData
      );

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
   * Update just the profile picture for an existing user
   */
  static async updateProfilePicture(profilePictureFile: File): Promise<void> {
    try {
      await amplifyInitialization.waitForReady();

      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Handle profile picture upload
      let profilePictureUrl: string | undefined;
      let hasProfilePicture = false;

      try {
        const fileExtension = profilePictureFile.name.split('.').pop() || 'jpg';
        const fileName = `${user.userId}/profile.${fileExtension}`;

        console.log('Updating profile picture:', fileName);

        const uploadResult = await uploadData({
          key: `profile-pictures/${fileName}`,
          data: profilePictureFile,
          options: {
            contentType: profilePictureFile.type,
          },
        }).result;

        profilePictureUrl = uploadResult.key;
        hasProfilePicture = true;
        console.log('Profile picture updated successfully:', {
          key: profilePictureUrl,
          size: profilePictureFile.size,
          type: profilePictureFile.type,
        });
      } catch (uploadError) {
        console.error('Failed to upload profile picture:', uploadError);
        throw new Error('Failed to upload profile picture');
      }

      // Update user profile with new picture info
      await userProfileService.updateUserProfile(user.userId, {
        profilePictureUrl,
        hasProfilePicture,
      });

      // Update localStorage to reflect the change
      const currentStatus = await this.getOnboardingStatusFromStorage();
      if (currentStatus && currentStatus.onboardingData) {
        const updatedStatus: UserOnboardingStatus = {
          ...currentStatus,
          onboardingData: {
            ...currentStatus.onboardingData,
            profilePictureUrl,
          },
        };
        await this.setOnboardingStatusInStorage(updatedStatus);
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
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
  private static safeParseJSON(jsonString: unknown): unknown {
    if (!jsonString || typeof jsonString !== 'string') {
      return null;
    }
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Failed to parse JSON field:', error);
      return null;
    }
  }

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
