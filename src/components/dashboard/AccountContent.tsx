'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UserAvatar from '../UserAvatar';
import { useUserProfile } from '../../hooks/useUserProfile';
import {
  User,
  Building2,
  Factory,
  ClockFading,
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
            <h3 className='font-medium text-black text-lg mb-1'>
              {getUserDisplayName()}
            </h3>
            <p className='text-base text-slate-500 font-medium'>
              {getUserEmail()}
            </p>
          </div>
        </div>

        {/* Profile Details */}
        <div className='mt-5'>
          {loadingProfile ? (
            <div className='flex items-center gap-2 text-sm text-slate-500'>
              <div className='w-3 h-3 bg-slate-200 rounded-full animate-pulse'></div>
              <span>Loading...</span>
            </div>
          ) : userProfile ? (
            <div className='divide-y divide-slate-100'>
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
                  <h4 className='text-base font-medium text-slate-500 mb-4'>
                    Profile Details
                  </h4>
                  <div className='divide-y divide-slate-100'>
                    {userProfile.jobRole && (
                      <div className='py-3 flex items-center justify-between'>
                        <dt className='text-base font-medium text-slate-500 flex items-center gap-2 flex-shrink-0'>
                          <User className='w-4 h-4' />
                          Role
                        </dt>
                        <dd className='text-base text-black text-right ml-4'>
                          {userProfile.jobRole}
                        </dd>
                      </div>
                    )}
                    {userProfile.companyName && (
                      <div className='py-3 flex items-center justify-between'>
                        <dt className='text-base font-medium text-slate-500 flex items-center gap-2 flex-shrink-0'>
                          <Building2 className='w-4 h-4' />
                          Company
                        </dt>
                        <dd className='text-base text-black text-right ml-4'>
                          {userProfile.companyName}
                        </dd>
                      </div>
                    )}
                    {userProfile.industry && (
                      <div className='py-3 flex items-center justify-between'>
                        <dt className='text-base font-medium text-slate-500 flex items-center gap-2 flex-shrink-0'>
                          <Factory className='w-4 h-4' />
                          Industry
                        </dt>
                        <dd className='text-base text-black text-right ml-4'>
                          {userProfile.industry}
                        </dd>
                      </div>
                    )}
                    {userProfile.yearsOfExperience !== null &&
                      userProfile.yearsOfExperience !== undefined && (
                        <div className='py-3 flex items-center justify-between'>
                          <dt className='text-base font-medium text-slate-500 flex items-center gap-2 flex-shrink-0'>
                            <ClockFading className='w-4 h-4' />
                            Experience
                          </dt>
                          <dd className='text-base text-black text-right ml-4'>
                            {userProfile.yearsOfExperience} years
                          </dd>
                        </div>
                      )}
                    {userProfile.education && (
                      <div className='py-3 flex items-center justify-between'>
                        <dt className='text-base font-medium text-slate-500 flex items-center gap-2 flex-shrink-0'>
                          <GraduationCap className='w-4 h-4' />
                          Education
                        </dt>
                        <dd className='text-base text-black text-right ml-4'>
                          {userProfile.education}
                        </dd>
                      </div>
                    )}
                    {userProfile.about && (
                      <div className='py-3'>
                        <dt className='text-base font-medium text-slate-500 mb-1.5 flex items-center gap-2'>
                          <Info className='w-4 h-4' />
                          About
                        </dt>
                        <dd className='text-base text-black'>
                          {userProfile.about}
                        </dd>
                      </div>
                    )}
                    {userProfile.skills && userProfile.skills.length > 0 && (
                      <div className='py-3'>
                        <dt className='text-base font-medium text-slate-500 mb-1.5 flex items-center gap-2'>
                          <Target className='w-4 h-4' />
                          Skills
                        </dt>
                        <dd className='flex flex-wrap gap-2'>
                          {userProfile.skills.map((skill, index) => (
                            <span
                              key={index}
                              className='px-3 py-1.5 text-base bg-transparent text-black border border-slate-200 rounded-lg font-medium'
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
                          <dt className='text-base font-medium text-slate-500 mb-1.5 flex items-center gap-2'>
                            <Heart className='w-4 h-4' />
                            Interests
                          </dt>
                          <dd className='flex flex-wrap gap-2'>
                            {userProfile.interests.map((interest, index) => (
                              <span
                                key={index}
                                className='px-3 py-1.5 text-base bg-transparent text-black border border-slate-200 rounded-lg font-medium'
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
            <div className='text-sm text-slate-500 text-center py-8'>
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
