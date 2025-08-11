'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { simplePresenceManager } from '@/lib/presence-utils';
import { UserProfileService } from '@/services/user-profile.service';
import UserAvatar from '../UserAvatar';
import type { Schema } from '../../../amplify/data/resource';

type UserProfile = Schema['UserProfile']['type'];

export default function AccountContent() {
  const { handleSignOut, user, onboardingStatus } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const getUserEmail = () => {
    return user?.signInDetails?.loginId || '';
  };

  const handleSignOutClick = async () => {
    await simplePresenceManager.setOffline();
    handleSignOut();
  };

  // Load current user's profile details
  useEffect(() => {
    let mounted = true;

    const loadUserProfile = async () => {
      if (!user?.userId) return;

      setLoadingProfile(true);
      try {
        const profile = await UserProfileService.getProfileDetails(user.userId);
        if (mounted) {
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        if (mounted) {
          setLoadingProfile(false);
        }
      }
    };

    loadUserProfile();

    return () => {
      mounted = false;
    };
  }, [user?.userId]);

  return (
    <div className='h-full flex flex-col'>
      {/* Header */}
      <div className='mb-12 flex items-start justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-zinc-900 mb-1'>Account</h2>
          <p className='text-sm text-zinc-500'>
            Manage your account and profile information
          </p>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOutClick}
          className='flex items-center gap-2 px-4 py-2.5 text-b_red-600 hover:bg-b_red-50 rounded-lg border border-b_red-200'
        >
          <span className='text-sm font-medium'>Log Out</span>
        </button>
      </div>

      {/* Profile Section */}
      <div className='max-w-2xl'>
        <div className='flex items-center gap-2'>
          <UserAvatar
            email={getUserEmail()}
            userId={user?.userId}
            profilePictureUrl={
              onboardingStatus?.onboardingData?.profilePictureUrl
            }
            hasProfilePicture={
              !!onboardingStatus?.onboardingData?.profilePictureUrl
            }
            size='md'
          />
          <div className='flex-1'>
            <h3 className='font-semibold text-zinc-900 mb-1'>
              {getUserEmail()}
            </h3>
            <p className='text-sm text-zinc-500'>You</p>
          </div>
        </div>

        {/* Profile Details */}
        <div className='mt-5 pt-5 border-t border-zinc-100'>

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
                (userProfile.interests && userProfile.interests.length > 0)) && (
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
                              className='px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-md border border-blue-100'
                            >
                              {skill}
                            </span>
                          ))}
                        </dd>
                      </div>
                    )}
                    {userProfile.interests && userProfile.interests.length > 0 && (
                      <div>
                        <dt className='text-xs font-medium text-zinc-500 mb-2'>
                          Interests
                        </dt>
                        <dd className='flex flex-wrap gap-2'>
                          {userProfile.interests.map((interest, index) => (
                            <span
                              key={index}
                              className='px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded-md border border-green-100'
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
