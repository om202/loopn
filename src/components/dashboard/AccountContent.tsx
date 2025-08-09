'use client';

import { useState, useEffect } from 'react';
import { User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { simplePresenceManager } from '@/lib/presence-utils';
import { UserProfileService } from '@/services/user-profile.service';
import UserAvatar from '../UserAvatar';

export default function AccountContent() {
  const { handleSignOut, user } = useAuth();
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
      <div className='mb-8'>
        <div className='flex items-center gap-3 mb-2'>
          <User className='w-6 h-6 text-brand-600' />
          <h1 className='text-2xl font-semibold text-zinc-900'>Account</h1>
        </div>
        <p className='text-zinc-600'>Manage your account and profile information</p>
      </div>

      {/* Main Profile Card - Similar to navbar dropdown but expanded */}
      <div className='bg-white border border-zinc-200 rounded-2xl p-6 mb-6'>
        <div className='flex flex-col items-center text-center'>
          <UserAvatar email={getUserEmail()} size='xl' />
          <div className='mt-4'>
            <h3 className='text-lg font-semibold text-zinc-900 mb-1'>
              {getUserEmail()}
            </h3>
            <p className='text-sm text-zinc-500'>
              Welcome to Loopn
            </p>
          </div>
        </div>

        {/* AI Profile Summary */}
        <div className='mt-6'>
          <div className='flex items-center gap-2 mb-3'>
            <Settings className='w-4 h-4 text-zinc-600' />
            <h4 className='font-medium text-zinc-900'>Anonymous Overview</h4>
          </div>
          
          {loadingSummary ? (
            <div className='flex items-center gap-2 text-sm text-zinc-500'>
              <div className='w-3 h-3 bg-zinc-100 rounded-full animate-pulse'></div>
              <span>Loading profile summary...</span>
            </div>
          ) : userSummary ? (
            <div className='bg-zinc-50 rounded-lg p-4 border border-zinc-200'>
              <div className='text-sm text-zinc-900 leading-relaxed'>
                {userSummary}
              </div>
            </div>
          ) : (
            <div className='bg-zinc-50 rounded-lg p-4 border border-zinc-200'>
              <p className='text-sm text-zinc-500 italic'>
                No profile summary available yet. Start chatting with others to generate your anonymous overview!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sign Out Section */}
      <div className='mt-auto'>
        <button
          onClick={handleSignOutClick}
          className='w-full flex items-center gap-3 p-4 text-b_red-600 hover:bg-b_red-50 rounded-lg transition-colors border border-b_red-200'
        >
          <LogOut className='w-5 h-5' />
          <span className='font-medium'>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
