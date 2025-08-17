'use client';

import { useState, useEffect } from 'react';
import { Clock, MessageCircle, CheckCircle2 } from 'lucide-react';
import UserAvatar from './UserAvatar';
import { formatPresenceTime } from '../lib/presence-utils';
import { useSubscriptionStore } from '../stores/subscription-store';
import {
  ShimmerProvider,
  ProfileDetails_Shimmer,
} from './ShimmerLoader/exports';

import type { Schema } from '../../amplify/data/resource';

type UserPresence = Schema['UserPresence']['type'];
type UserProfile = Schema['UserProfile']['type'];
type Conversation = Schema['Conversation']['type'];

interface ProfileSidebarProps {
  userId: string;
  userPresence?: UserPresence | null;
  onlineUsers?: UserPresence[];
  // Optional action buttons props
  showActionButtons?: boolean;
  existingConversations?: Map<string, Conversation>;
  pendingRequests?: Set<string>;
  onChatAction?: (userId: string) => void;
  onCancelChatRequest?: (userId: string) => void;
  canUserReconnect?: (userId: string) => boolean;
  getReconnectTimeRemaining?: (userId: string) => string | null;
}

export default function ProfileSidebar({
  userId,
  userPresence,
  onlineUsers = [],
  showActionButtons = false,
  existingConversations,
  pendingRequests,
  onChatAction,
  onCancelChatRequest,
  canUserReconnect,
  getReconnectTimeRemaining,
}: ProfileSidebarProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const { fetchUserProfile } = useSubscriptionStore();

  // Load profile data when component mounts
  useEffect(() => {
    let mounted = true;
    const loadProfileData = async () => {
      if (!userId) return;

      setProfileLoading(true);
      try {
        // Use our centralized profile fetching (with caching)
        const profile = await fetchUserProfile(userId);
        if (mounted && profile) {
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        if (mounted) {
          setProfileLoading(false);
        }
      }
    };

    loadProfileData();

    return () => {
      mounted = false;
    };
  }, [userId, fetchUserProfile]);

  const getUserDisplayName = () => {
    return (
      userProfile?.fullName || userProfile?.email || `User${userId.slice(-4)}`
    );
  };

  const getUserStatus = () => {
    // Check if user is in online users list
    const isOnline = onlineUsers.find(u => u.userId === userId);
    if (isOnline) {
      return 'ONLINE';
    }

    if (userPresence?.status === 'ONLINE' || userPresence?.status === 'BUSY') {
      return userPresence.status;
    }
    if (
      userPresence?.lastSeen &&
      formatPresenceTime(userPresence.lastSeen) === 'Recently active'
    ) {
      return 'RECENTLY_ACTIVE';
    }
    return 'OFFLINE';
  };

  const renderActionButtons = () => {
    if (!showActionButtons || !existingConversations || !pendingRequests) {
      return null;
    }

    const conversation = existingConversations.get(userId);
    const isEndedWithTimer =
      conversation?.chatStatus === 'ENDED' &&
      canUserReconnect &&
      !canUserReconnect(userId) &&
      getReconnectTimeRemaining &&
      getReconnectTimeRemaining(userId);

    if (isEndedWithTimer) {
      const timeRemaining = getReconnectTimeRemaining!(userId);
      return (
        <div className='text-sm text-center p-3 bg-zinc-50 rounded-xl border border-zinc-200'>
          <div className='text-zinc-500 mb-1'>Reconnect in</div>
          <div className='text-zinc-600 flex items-center justify-center gap-1'>
            <Clock className='w-3 h-3' />
            <span className='font-medium'>{timeRemaining}</span>
          </div>
        </div>
      );
    }

    const isTrialConversation =
      existingConversations.has(userId) &&
      !existingConversations.get(userId)?.isConnected;

    return (
      <div className='flex items-center gap-3'>
        <button
          onClick={() => {
            if (pendingRequests.has(userId)) {
              onCancelChatRequest?.(userId);
            } else {
              onChatAction?.(userId);
            }
          }}
          className='px-2 py-1.5 text-base font-medium rounded-xl border transition-colors bg-brand-50 text-brand-500 border-brand-100 hover:bg-brand-100 hover:border-brand-200 flex items-center justify-center gap-2'
        >
          {pendingRequests.has(userId) ? (
            <>
              <span className='text-zinc-600 text-base font-medium'>
                Cancel Request
              </span>
            </>
          ) : existingConversations.has(userId) ? (
            <>
              {existingConversations.get(userId)?.chatStatus === 'ENDED' ? (
                canUserReconnect && canUserReconnect(userId) ? (
                  <>
                    <MessageCircle className='w-4 h-4' />
                    <span className='text-base font-medium'>Send Request</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className='w-4 h-4' />
                    <span className='text-base font-medium'>View Chat</span>
                  </>
                )
              ) : (
                <>
                  <MessageCircle className='w-4 h-4' />
                  <span className='text-base font-medium'>Chat</span>
                </>
              )}
            </>
          ) : (
            <>
              <CheckCircle2 className='w-4 h-4' />
              <span className='text-base font-medium'>Send Request</span>
            </>
          )}
        </button>
        {isTrialConversation && (
          <span className='px-2 py-1.5 text-base font-medium text-zinc-500 rounded-xl flex-shrink-0 flex items-center gap-1'>
            <Clock className='w-4 h-4' />
            Trial
          </span>
        )}
      </div>
    );
  };

  return (
    <div className='bg-white rounded-2xl border border-zinc-200 w-full h-full flex flex-col relative'>
      {/* User Profile Header */}
      <div className='p-6 pb-2 flex justify-center'>
        <div className='flex flex-col items-center text-center'>
          <UserAvatar
            email={userProfile?.email}
            userId={userId}
            profilePictureUrl={userProfile?.profilePictureUrl}
            hasProfilePicture={userProfile?.hasProfilePicture || false}
            size='xl'
            showStatus
            status={getUserStatus()}
          />
          <div className='mt-2'>
            <div className='mb-1'>
              <div className='font-semibold text-zinc-900 text-base'>
                {getUserDisplayName()}
              </div>
            </div>
            {getUserStatus() === 'ONLINE' && (
              <div className='text-sm text-b_green-500'>Online</div>
            )}
            {userPresence?.lastSeen &&
              formatPresenceTime(userPresence.lastSeen) !==
                'Recently active' && (
                <div className='text-sm text-zinc-500'>
                  {formatPresenceTime(userPresence.lastSeen)}
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Action buttons section */}
      {showActionButtons && (
        <div className='px-6 pb-6 pt-2'>
          <div className='w-full flex justify-center'>
            {renderActionButtons()}
          </div>
        </div>
      )}

      {/* Professional Details */}
      <div className='flex-1 overflow-y-auto'>
        <div className='px-6 pb-8 pt-6'>
          {profileLoading ? (
            <ShimmerProvider>
              <ProfileDetails_Shimmer />
            </ShimmerProvider>
          ) : userProfile ? (
            <div className='divide-y divide-zinc-100'>
              {/* Professional Info Section */}
              {(userProfile.jobRole ||
                userProfile.companyName ||
                userProfile.industry ||
                userProfile.yearsOfExperience !== null) && (
                <div className='pb-4'>
                  <h4 className='text-sm font-semibold text-zinc-500 mb-4 border-b border-zinc-100 pb-2'>
                    Profile Details
                  </h4>
                  <div className='divide-y divide-zinc-100'>
                    {userProfile.jobRole && (
                      <div className='pb-3'>
                        <dt className='text-sm font-medium text-zinc-500 mb-1.5'>
                          Role
                        </dt>
                        <dd className='text-base text-zinc-900 font-medium'>
                          {userProfile.jobRole}
                        </dd>
                      </div>
                    )}
                    {userProfile.companyName && (
                      <div className='py-3'>
                        <dt className='text-sm font-medium text-zinc-500 mb-1.5'>
                          Company
                        </dt>
                        <dd className='text-base text-zinc-900 font-medium'>
                          {userProfile.companyName}
                        </dd>
                      </div>
                    )}
                    {userProfile.industry && (
                      <div className='py-3'>
                        <dt className='text-sm font-medium text-zinc-500 mb-1.5'>
                          Industry
                        </dt>
                        <dd className='text-base text-zinc-900 font-medium'>
                          {userProfile.industry}
                        </dd>
                      </div>
                    )}
                    {userProfile.yearsOfExperience !== null &&
                      userProfile.yearsOfExperience !== undefined && (
                        <div className='pt-3'>
                          <dt className='text-sm font-medium text-zinc-500 mb-1.5'>
                            Experience
                          </dt>
                          <dd className='text-base text-zinc-900 font-medium'>
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
                  <h4 className='text-sm font-semibold text-zinc-900 mb-4'>
                    Education
                  </h4>
                  <div className='text-base text-zinc-900 font-medium leading-relaxed'>
                    {userProfile.education}
                  </div>
                </div>
              )}

              {/* About Section */}
              {userProfile.about && (
                <div className='py-4'>
                  <h4 className='text-sm font-medium text-zinc-500 mb-4'>
                    About
                  </h4>
                  <div className='text-base text-zinc-900 leading-relaxed'>
                    {userProfile.about}
                  </div>
                </div>
              )}

              {/* Skills & Interests Section */}
              {((userProfile.skills && userProfile.skills.length > 0) ||
                (userProfile.interests &&
                  userProfile.interests.length > 0)) && (
                <div className='pt-4'>
                  <div className='divide-y divide-zinc-100'>
                    {userProfile.skills && userProfile.skills.length > 0 && (
                      <div className='pb-3'>
                        <dt className='text-sm font-medium text-zinc-500 mb-3'>
                          Skills
                        </dt>
                        <dd className='flex flex-wrap gap-2'>
                          {userProfile.skills.map((skill, index) => (
                            <span
                              key={index}
                              className='px-3 py-1.5 text-base bg-transparent text-zinc-700 border border-zinc-200 rounded-lg font-medium'
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
                          <dt className='text-sm font-medium text-zinc-500 mb-3'>
                            Interests
                          </dt>
                          <dd className='flex flex-wrap gap-2'>
                            {userProfile.interests.map((interest, index) => (
                              <span
                                key={index}
                                className='px-3 py-1.5 text-base bg-transparent text-zinc-700 border border-zinc-200 rounded-lg font-medium'
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
              No profile details available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
