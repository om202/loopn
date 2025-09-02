'use client';

import React, { useState } from 'react';
import { FileDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import UserAvatar from '../UserAvatar';
import UserProfileContent from '../UserProfileContent';
import { useUserProfile } from '../../hooks/useUserProfile';
import { generateMarkdownResume } from '../../lib/markdown-resume-generator';

export default function AccountContent() {
  const { user, onboardingStatus } = useAuth();
  const [downloadingResume, setDownloadingResume] = useState(false);

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

    return `${name}`;
  };

  const getCleanDisplayName = () => {
    if (onboardingStatus?.onboardingData?.fullName) {
      return onboardingStatus.onboardingData.fullName;
    }
    if (userProfile?.fullName) {
      return userProfile.fullName;
    }
    if (user?.signInDetails?.loginId) {
      return user.signInDetails.loginId;
    }
    return 'My_Resume';
  };

  // Handle resume download
  const handleDownloadResume = async () => {
    if (!userProfile) return;

    setDownloadingResume(true);
    try {
      await generateMarkdownResume(userProfile, getCleanDisplayName());
    } catch (error) {
      console.error('Failed to download resume:', error);
      // Could add a toast notification here for better UX
    } finally {
      setDownloadingResume(false);
    }
  };

  return (
    <div className='h-full flex flex-col'>
      {/* PDF Generation Overlay */}
      {downloadingResume && (
        <div className='fixed inset-0 bg-white flex items-center justify-center z-[9999]'>
          <div className='flex flex-col items-center'>
            <FileDown className='w-8 h-8 animate-pulse text-brand-600 mb-3' />
            <div className='text-lg'>Generating PDF. Please wait.</div>
          </div>
        </div>
      )}

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
            className='mb-5'
          />
          <div className='flex items-start justify-between w-full'>
            <div>
              <h3 className='font-semibold text-black text-lg mb-1'>
                {getUserDisplayName()}
              </h3>
              <p className='text-base text-neutral-500 font-medium'>
                {getUserEmail()}
              </p>
            </div>
            <div className='flex items-center gap-2 ml-4'>
              {/* Download Resume Button */}
              <button
                onClick={handleDownloadResume}
                disabled={downloadingResume || !userProfile}
                className='flex items-center gap-2 px-3 py-2 text-neutral-500 hover:text-brand-600 transition-colors rounded-lg hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 text-sm font-medium'
                title='Download Your Profile as PDF'
              >
                <FileDown className='w-4 h-4' />
                <span>Download Your Profile</span>
              </button>
            </div>
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
