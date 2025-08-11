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
          <div className='flex items-center gap-2 mb-3'>
            <h4 className='text-sm font-medium text-zinc-900'>
              Profile Details
            </h4>
          </div>

          {loadingProfile ? (
            <div className='flex items-center gap-2 text-sm text-zinc-500'>
              <div className='w-3 h-3 bg-zinc-200 rounded-full animate-pulse'></div>
              <span>Loading...</span>
            </div>
          ) : userProfile ? (
            <div className='bg-zinc-50 rounded-lg p-4 space-y-3'>
              {userProfile.fullName && (
                <div>
                  <span className='text-xs font-medium text-zinc-500'>
                    Name:
                  </span>
                  <p className='text-sm text-zinc-700'>
                    {userProfile.fullName}
                  </p>
                </div>
              )}
              {userProfile.jobRole && (
                <div>
                  <span className='text-xs font-medium text-zinc-500'>
                    Role:
                  </span>
                  <p className='text-sm text-zinc-700'>{userProfile.jobRole}</p>
                </div>
              )}
              {userProfile.companyName && (
                <div>
                  <span className='text-xs font-medium text-zinc-500'>
                    Company:
                  </span>
                  <p className='text-sm text-zinc-700'>
                    {userProfile.companyName}
                  </p>
                </div>
              )}
              {userProfile.industry && (
                <div>
                  <span className='text-xs font-medium text-zinc-500'>
                    Industry:
                  </span>
                  <p className='text-sm text-zinc-700'>
                    {userProfile.industry}
                  </p>
                </div>
              )}
              {userProfile.yearsOfExperience !== null &&
                userProfile.yearsOfExperience !== undefined && (
                  <div>
                    <span className='text-xs font-medium text-zinc-500'>
                      Experience:
                    </span>
                    <p className='text-sm text-zinc-700'>
                      {userProfile.yearsOfExperience} years
                    </p>
                  </div>
                )}
              {userProfile.education && (
                <div>
                  <span className='text-xs font-medium text-zinc-500'>
                    Education:
                  </span>
                  <p className='text-sm text-zinc-700'>
                    {userProfile.education}
                  </p>
                </div>
              )}
              {userProfile.about && (
                <div>
                  <span className='text-xs font-medium text-zinc-500'>
                    About:
                  </span>
                  <p className='text-sm text-zinc-700'>{userProfile.about}</p>
                </div>
              )}
              {userProfile.interests && userProfile.interests.length > 0 && (
                <div>
                  <span className='text-xs font-medium text-zinc-500'>
                    Interests:
                  </span>
                  <p className='text-sm text-zinc-700'>
                    {userProfile.interests.join(', ')}
                  </p>
                </div>
              )}
              {userProfile.skills && userProfile.skills.length > 0 && (
                <div>
                  <span className='text-xs font-medium text-zinc-500'>
                    Skills:
                  </span>
                  <p className='text-sm text-zinc-700'>
                    {userProfile.skills.join(', ')}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className='bg-zinc-50 rounded-lg p-3 text-sm text-zinc-500'>
              No profile details available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
