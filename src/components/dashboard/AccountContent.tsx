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
      <div className='max-w-2xl'>
        <div className='flex flex-col items-start mb-8'>
          <UserAvatar
            email={getUserEmail()}
            userId={user?.userId}
            profilePictureUrl={
              userProfile?.profilePictureUrl ||
              onboardingStatus?.onboardingData?.profilePictureUrl
            }
            hasProfilePicture={
              !!userProfile?.profilePictureUrl ||
              !!onboardingStatus?.onboardingData?.profilePictureUrl
            }
            size='xl'
            className='mb-4'
          />
          <div>
            <h3 className='font-semibold text-zinc-900 mb-1'>
              {getUserDisplayName()}
            </h3>
            <p className='text-sm text-zinc-500'>{getUserEmail()}</p>
          </div>
        </div>

        {/* Profile Details */}
        <div className='mt-5'>
          {loadingProfile ? (
            <div className='flex items-center gap-2 text-sm text-zinc-500'>
              <div className='w-3 h-3 bg-zinc-200 rounded-full animate-pulse'></div>
              <span>Loading...</span>
            </div>
          ) : userProfile ? (
            <div className='space-y-6'>
              {/* Professional Info Section */}
              {(userProfile.jobRole ||
                userProfile.companyName ||
                userProfile.industry ||
                userProfile.yearsOfExperience !== null) && (
                <div>
                  <h5 className='text-sm font-semibold text-zinc-900 mb-4 border-b border-zinc-100 pb-2'>
                    Profile Details
                  </h5>
                  <div className='grid grid-cols-1 gap-4'>
                    {userProfile.jobRole && (
                      <div>
                        <dt className='text-xs font-medium text-zinc-500 mb-1'>
                          Role
                        </dt>
                        <dd className='text-sm text-zinc-900'>
                          {userProfile.jobRole}
                        </dd>
                      </div>
                    )}
                    {userProfile.companyName && (
                      <div>
                        <dt className='text-xs font-medium text-zinc-500 mb-1'>
                          Company
                        </dt>
                        <dd className='text-sm text-zinc-900'>
                          {userProfile.companyName}
                        </dd>
                      </div>
                    )}
                    {userProfile.industry && (
                      <div>
                        <dt className='text-xs font-medium text-zinc-500 mb-1'>
                          Industry
                        </dt>
                        <dd className='text-sm text-zinc-900'>
                          {userProfile.industry}
                        </dd>
                      </div>
                    )}
                    {userProfile.yearsOfExperience !== null &&
                      userProfile.yearsOfExperience !== undefined && (
                        <div>
                          <dt className='text-xs font-medium text-zinc-500 mb-1'>
                            Years of Experience
                          </dt>
                          <dd className='text-sm text-zinc-900'>
                            {userProfile.yearsOfExperience} years
                          </dd>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* Education Section */}
              {userProfile.education && (
                <div>
                  <h5 className='text-sm font-semibold text-zinc-900 mb-4 border-b border-zinc-100 pb-2'>
                    Education
                  </h5>
                  <div>
                    <dd className='text-sm text-zinc-900'>
                      {userProfile.education}
                    </dd>
                  </div>
                </div>
              )}

              {/* About Section */}
              {userProfile.about && (
                <div>
                  <h5 className='text-sm font-semibold text-zinc-900 mb-4 border-b border-zinc-100 pb-2'>
                    About
                  </h5>
                  <div>
                    <dd className='text-sm text-zinc-900 leading-relaxed'>
                      {userProfile.about}
                    </dd>
                  </div>
                </div>
              )}

              {/* Skills & Interests Section */}
              {((userProfile.skills && userProfile.skills.length > 0) ||
                (userProfile.interests &&
                  userProfile.interests.length > 0)) && (
                <div>
                  <h5 className='text-sm font-semibold text-zinc-900 mb-4 border-b border-zinc-100 pb-2'>
                    Skills & Interests
                  </h5>
                  <div className='space-y-4'>
                    {userProfile.skills && userProfile.skills.length > 0 && (
                      <div>
                        <dt className='text-xs font-medium text-zinc-500 mb-2'>
                          Skills
                        </dt>
                        <dd className='flex flex-wrap gap-2'>
                          {userProfile.skills.map((skill, index) => (
                            <span
                              key={index}
                              className='px-3 py-1.5 text-xs bg-brand-50 text-brand-700 rounded-md border border-brand-100'
                            >
                              {skill}
                            </span>
                          ))}
                        </dd>
                      </div>
                    )}
                    {userProfile.interests &&
                      userProfile.interests.length > 0 && (
                        <div>
                          <dt className='text-xs font-medium text-zinc-500 mb-2'>
                            Interests
                          </dt>
                          <dd className='flex flex-wrap gap-2'>
                            {userProfile.interests.map((interest, index) => (
                              <span
                                key={index}
                                className='px-3 py-1.5 text-xs bg-b_green-50 text-b_green-700 rounded-md border border-b_green-100'
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
            <div className='text-sm text-zinc-500 text-center py-8'>
              No profile details available yet.
            </div>
          )}
        </div>
      </div>

      {/* Bottom spacing */}
      <div className='pb-8'></div>
    </div>
  );
}
