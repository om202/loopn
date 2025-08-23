'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UserAvatar from '../UserAvatar';
import { useUserProfile } from '../../hooks/useUserProfile';
import {
  Briefcase,
  Building2,
  Factory,
  Clock,
  GraduationCap,
  Info,
  Target,
  Heart,
} from 'lucide-react';

export default function AccountContent() {
  const { user, onboardingStatus } = useAuth();

  // Use our centralized user profile hook instead of local state and API calls
  const { profile: userProfile, isLoading: loadingProfile } = useUserProfile(
    user?.userId || ''
  );

  const getUserEmail = () => {
    return user?.signInDetails?.loginId || '';
  };

  const getUserDisplayName = () => {
    let name = '';

    // Try to get full name from onboarding data first
    if (onboardingStatus?.onboardingData?.fullName) {
      name = onboardingStatus.onboardingData.fullName;
    }
    // Try to get full name from loaded user profile
    else if (userProfile?.fullName) {
      name = userProfile.fullName;
    }
    // Fall back to email if available
    else if (user?.signInDetails?.loginId) {
      name = user.signInDetails.loginId;
    }
    // Last resort: just show "You"
    else {
      return 'You';
    }

    // Add "(You)" to indicate it's the current user
    return `${name} (You)`;
  };

  return (
    <div className='h-full flex flex-col'>
      {/* Profile Section */}
      <div className='mx-auto w-full pl-0 sm:pl-2'>
        <div className='flex flex-col items-start mb-8'>
          <UserAvatar
            email={getUserEmail()}
            userId={user?.userId}
            profilePictureUrl={
              userProfile?.profilePictureUrl ||
              onboardingStatus?.onboardingData?.profilePictureUrl
            }
            hasProfilePicture={
              userProfile?.hasProfilePicture ||
              !!onboardingStatus?.onboardingData?.profilePictureUrl
            }
            size='xl'
            className='mb-4'
          />
          <div>
            <h3 className='font-medium text-black mb-1'>
              {getUserDisplayName()}
            </h3>
            <p className='text-sm text-gray-500 font-medium'>
              {getUserEmail()}
            </p>
          </div>
        </div>

        {/* Profile Details */}
        <div className='mt-5'>
          {loadingProfile ? (
            <div className='flex items-center gap-2 text-sm text-gray-500'>
              <div className='w-3 h-3 bg-gray-200 rounded-full animate-pulse'></div>
              <span>Loading...</span>
            </div>
          ) : userProfile ? (
            <div className='divide-y divide-gray-100'>
              {/* Professional Info Section */}
              {(userProfile.jobRole ||
                userProfile.companyName ||
                userProfile.industry ||
                userProfile.yearsOfExperience !== null ||
                userProfile.education ||
                userProfile.about ||
                (userProfile.skills && userProfile.skills.length > 0) ||
                (userProfile.interests &&
                  userProfile.interests.length > 0)) && (
                <div className='pb-6'>
                  <h4 className='text-sm font-semibold text-gray-500 mb-4'>
                    Profile Details
                  </h4>
                  <div className='divide-y divide-gray-100'>
                    {userProfile.jobRole && (
                      <div className='py-3'>
                        <dt className='text-sm font-medium text-gray-500 mb-1.5 flex items-center gap-1'>
                          <Briefcase className='w-3.5 h-3.5' />
                          Role
                        </dt>
                        <dd className='text-base text-black'>
                          {userProfile.jobRole}
                        </dd>
                      </div>
                    )}
                    {userProfile.companyName && (
                      <div className='py-3'>
                        <dt className='text-sm font-medium text-gray-500 mb-1.5 flex items-center gap-1'>
                          <Building2 className='w-3.5 h-3.5' />
                          Company
                        </dt>
                        <dd className='text-base text-black'>
                          {userProfile.companyName}
                        </dd>
                      </div>
                    )}
                    {userProfile.industry && (
                      <div className='py-3'>
                        <dt className='text-sm font-medium text-gray-500 mb-1.5 flex items-center gap-1'>
                          <Factory className='w-3.5 h-3.5' />
                          Industry
                        </dt>
                        <dd className='text-base text-black'>
                          {userProfile.industry}
                        </dd>
                      </div>
                    )}
                    {userProfile.yearsOfExperience !== null &&
                      userProfile.yearsOfExperience !== undefined && (
                        <div className='py-3'>
                          <dt className='text-sm font-medium text-gray-500 mb-1.5 flex items-center gap-1'>
                            <Clock className='w-3.5 h-3.5' />
                            Experience
                          </dt>
                          <dd className='text-base text-black'>
                            {userProfile.yearsOfExperience} years
                          </dd>
                        </div>
                      )}
                    {userProfile.education && (
                      <div className='py-3'>
                        <dt className='text-sm font-medium text-gray-500 mb-1.5 flex items-center gap-1'>
                          <GraduationCap className='w-3.5 h-3.5' />
                          Education
                        </dt>
                        <dd className='text-base text-black'>
                          {userProfile.education}
                        </dd>
                      </div>
                    )}
                    {userProfile.about && (
                      <div className='py-3'>
                        <dt className='text-sm font-medium text-gray-500 mb-1.5 flex items-center gap-1'>
                          <Info className='w-3.5 h-3.5' />
                          About
                        </dt>
                        <dd className='text-base text-black'>
                          {userProfile.about}
                        </dd>
                      </div>
                    )}
                    {userProfile.skills && userProfile.skills.length > 0 && (
                      <div className='py-3'>
                        <dt className='text-sm font-medium text-gray-500 mb-1.5 flex items-center gap-1'>
                          <Target className='w-3.5 h-3.5' />
                          Skills
                        </dt>
                        <dd className='flex flex-wrap gap-2'>
                          {userProfile.skills.map((skill, index) => (
                            <span
                              key={index}
                              className='px-3 py-1.5 text-base bg-transparent text-black border border-gray-200 rounded-lg font-medium'
                            >
                              {skill}
                            </span>
                          ))}
                        </dd>
                      </div>
                    )}
                    {userProfile.interests &&
                      userProfile.interests.length > 0 && (
                        <div className='py-3'>
                          <dt className='text-sm font-medium text-gray-500 mb-1.5 flex items-center gap-1'>
                            <Heart className='w-3.5 h-3.5' />
                            Interests
                          </dt>
                          <dd className='flex flex-wrap gap-2'>
                            {userProfile.interests.map((interest, index) => (
                              <span
                                key={index}
                                className='px-3 py-1.5 text-base bg-transparent text-black border border-gray-200 rounded-lg font-medium'
                              >
                                {interest}
                              </span>
                            ))}
                          </dd>
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className='text-sm text-gray-500 text-center py-8'>
              No profile details available.
            </div>
          )}
        </div>
      </div>

      {/* Bottom spacing */}
      <div className='pb-8'></div>
    </div>
  );
}
