'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { simplePresenceManager } from '@/lib/presence-utils';
import { UserProfileService } from '@/services/user-profile.service';
import UserAvatar from '../UserAvatar';

export default function AccountContent() {
  const { handleSignOut, user, onboardingStatus } = useAuth();
  const [userSummary, setUserSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const getUserEmail = () => {
    return user?.signInDetails?.loginId || '';
  };

  const handleSignOutClick = async () => {
    await simplePresenceManager.setOffline();
    handleSignOut();
  };

  // Load current user's AI summary
  useEffect(() => {
    let mounted = true;

    const loadUserSummary = async () => {
      if (!user?.userId) return;

      setLoadingSummary(true);
      try {
        const summary = await UserProfileService.getProfileSummary(user.userId);
        if (mounted) {
          setUserSummary(summary);
        }
      } catch (error) {
        console.error('Error loading user summary:', error);
      } finally {
        if (mounted) {
          setLoadingSummary(false);
        }
      }
    };

    loadUserSummary();

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

        {/* AI Profile Summary */}
        <div className='mt-5 pt-5 border-t border-zinc-100'>
          <div className='flex items-center gap-2 mb-3'>
            <h4 className='text-sm font-medium text-zinc-900'>
              Anonymous Overview
            </h4>
          </div>

          {loadingSummary ? (
            <div className='flex items-center gap-2 text-sm text-zinc-500'>
              <div className='w-3 h-3 bg-zinc-200 rounded-full animate-pulse'></div>
              <span>Loading...</span>
            </div>
          ) : userSummary ? (
            <div className='bg-zinc-50 rounded-lg p-3 text-sm text-zinc-700 leading-relaxed'>
              {userSummary}
            </div>
          ) : (
            <div className='bg-zinc-50 rounded-lg p-3 text-sm text-zinc-500'>
              No profile summary available yet. Start chatting with others to
              generate your anonymous overview!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
