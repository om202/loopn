'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UserAvatar from '../UserAvatar';
import UserProfileContent from '../UserProfileContent';
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
      <div className='mx-auto w-full'>
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
            <h3 className='font-semibold text-black text-lg mb-1'>
              {getUserDisplayName()}
            </h3>
            <p className='text-base text-slate-500 font-medium'>
              {getUserEmail()}
            </p>
          </div>
        </div>

        {/* Profile Details */}
        <div className='mt-5'>
          <UserProfileContent 
            userProfile={userProfile}
            loading={loadingProfile}
            showContactInfo={true}
          />
        </div>
      </div>

      {/* Bottom spacing */}
      <div className='pb-8'></div>
    </div>
  );
}
