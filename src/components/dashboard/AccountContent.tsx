'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UserAvatar from '../UserAvatar';
import { useUserProfile } from '../../hooks/useUserProfile';

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
      <div className='mx-auto max-w-[1000px] w-full'>
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
            <h3 className='font-semibold text-neutral-950 mb-1'>
              {getUserDisplayName()}
            </h3>
            <p className='text-sm text-neutral-500 font-medium'>
              {getUserEmail()}
            </p>
          </div>
        </div>

        {/* Profile Details */}
        <div className='mt-5'>
          {loadingProfile ? (
            <div className='flex items-center gap-2 text-sm text-neutral-500'>
              <div className='w-3 h-3 bg-gray-200 rounded-full animate-pulse'></div>
              <span>Loading...</span>
            </div>
          ) : userProfile ? (
            <div className='divide-y divide-gray-100'>
              {/* Professional Info Section */}
              {(userProfile.jobRole ||
                userProfile.companyName ||
                userProfile.industry ||
                userProfile.yearsOfExperience !== null) && (
                <div className='pb-4'>
                  <h4 className='text-sm font-semibold text-neutral-500 mb-4 border-b border-gray-100 pb-2'>
                    Profile
                  </h4>
                  <div className='divide-y divide-gray-100'>
                    {userProfile.jobRole && (
                      <div className='pb-3'>
                        <dt className='text-sm font-medium text-neutral-500 mb-1.5'>
                          Role
                        </dt>
                        <dd className='text-base text-neutral-950'>
                          {userProfile.jobRole}
                        </dd>
                      </div>
                    )}
                    {userProfile.companyName && (
                      <div className='py-3'>
                        <dt className='text-sm font-medium text-neutral-500 mb-1.5'>
                          Company
                        </dt>
                        <dd className='text-base text-neutral-950'>
                          {userProfile.companyName}
                        </dd>
                      </div>
                    )}
                    {userProfile.industry && (
                      <div className='py-3'>
                        <dt className='text-sm font-medium text-neutral-500 mb-1.5'>
                          Industry
                        </dt>
                        <dd className='text-base text-neutral-950'>
                          {userProfile.industry}
                        </dd>
                      </div>
                    )}
                    {userProfile.yearsOfExperience !== null &&
                      userProfile.yearsOfExperience !== undefined && (
                        <div className='pt-3'>
                          <dt className='text-sm font-medium text-neutral-500 mb-1.5'>
                            Experience
                          </dt>
                          <dd className='text-base text-neutral-950'>
                            {userProfile.yearsOfExperience} years
                          </dd>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* Education Section */}
              {userProfile.education && (
                <div className='py-4'>
                  <h4 className='text-sm font-semibold text-neutral-500 mb-4'>
                    Education
                  </h4>
                  <div className='text-base text-neutral-950 leading-relaxed'>
                    {userProfile.education}
                  </div>
                </div>
              )}

              {/* About Section */}
              {userProfile.about && (
                <div className='py-4'>
                  <h4 className='text-sm font-medium text-neutral-500 mb-4'>
                    About
                  </h4>
                  <div className='text-base text-neutral-950 leading-relaxed'>
                    {userProfile.about}
                  </div>
                </div>
              )}

              {/* Skills & Interests Section */}
              {((userProfile.skills && userProfile.skills.length > 0) ||
                (userProfile.interests &&
                  userProfile.interests.length > 0)) && (
                <div className='pt-4'>
                  <div className='divide-y divide-gray-100'>
                    {userProfile.skills && userProfile.skills.length > 0 && (
                      <div className='pb-3'>
                        <dt className='text-sm font-medium text-neutral-500 mb-3'>
                          Skills
                        </dt>
                        <dd className='flex flex-wrap gap-2'>
                          {userProfile.skills.map((skill, index) => (
                            <span
                              key={index}
                              className='px-3 py-1.5 text-base bg-transparent text-neutral-950 border border-gray-200 rounded-lg font-medium'
                            >
                              {skill}
                            </span>
                          ))}
                        </dd>
                      </div>
                    )}
                    {userProfile.interests &&
                      userProfile.interests.length > 0 && (
                        <div className='pt-3'>
                          <dt className='text-sm font-medium text-neutral-500 mb-3'>
                            Interests
                          </dt>
                          <dd className='flex flex-wrap gap-2'>
                            {userProfile.interests.map((interest, index) => (
                              <span
                                key={index}
                                className='px-3 py-1.5 text-base bg-transparent text-neutral-950 border border-gray-200 rounded-lg font-medium'
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
            <div className='text-sm text-neutral-500 text-center py-8'>
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
