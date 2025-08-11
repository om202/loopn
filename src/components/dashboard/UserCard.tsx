'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  MessageCircle,
  MoreHorizontal,
  User,
} from 'lucide-react';

import type { Schema } from '../../../amplify/data/resource';
import { formatPresenceTime } from '../../lib/presence-utils';
import { UserProfileService } from '../../services/user-profile.service';

import DialogContainer from '../DialogContainer';
import UserAvatar from '../UserAvatar';

type UserPresence = Schema['UserPresence']['type'];
type Conversation = Schema['Conversation']['type'];

interface UserCardProps {
  userPresence: UserPresence;
  onlineUsers: UserPresence[];
  existingConversations: Map<string, Conversation>;
  pendingRequests: Set<string>;
  onChatAction: (userId: string) => void;
  onCancelChatRequest: (userId: string) => void;
  canUserReconnect: (userId: string) => boolean;
  getReconnectTimeRemaining: (userId: string) => string | null;
  onOpenProfileSidebar?: (user: UserPresence) => void;
  onUserCardClick?: (user: UserPresence) => void;
  isProfileSidebarOpen?: boolean;
  selectedUserId?: string;
}

const getDisplayName = (
  userPresence: UserPresence,
  userProfile?: { fullName?: string; email?: string } | null
) => {
  // Try to get full name from profile first
  if (userProfile?.fullName) {
    return userProfile.fullName;
  }
  // Fall back to email if available
  if (userProfile?.email) {
    return userProfile.email;
  }
  // Last resort: User + last 4 chars of userId
  return `User${userPresence.userId.slice(-4)}`;
};

export default function UserCard({
  userPresence,
  onlineUsers,
  existingConversations,
  pendingRequests,
  onChatAction,
  onCancelChatRequest,
  canUserReconnect,
  getReconnectTimeRemaining,
  onOpenProfileSidebar,
  onUserCardClick,
  isProfileSidebarOpen,
  selectedUserId,
}: UserCardProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [fullProfile, setFullProfile] = useState<Schema['UserProfile']['type'] | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    fullName?: string;
    email?: string;
    profilePictureUrl?: string;
    hasProfilePicture?: boolean;
  } | null>(null);
  const isOnline = onlineUsers.some(ou => ou.userId === userPresence.userId);
  const isSelected = selectedUserId === userPresence.userId;

  // Load profile data when component mounts
  useEffect(() => {
    let mounted = true;

    const loadProfileData = async () => {
      setLoadingProfile(true);
      try {
        // Get both full profile details and basic profile data
        const [profileDetails, profileResult] = await Promise.all([
          UserProfileService.getProfileDetails(userPresence.userId),
          new UserProfileService().getUserProfile(userPresence.userId),
        ]);

        if (mounted) {
          setFullProfile(profileDetails);
          setUserProfile(
            profileResult.data
              ? {
                  fullName: profileResult.data.fullName || undefined,
                  email: profileResult.data.email || undefined,
                  profilePictureUrl:
                    profileResult.data.profilePictureUrl || undefined,
                  hasProfilePicture:
                    profileResult.data.hasProfilePicture || false,
                }
              : null
          );
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        if (mounted) {
          setLoadingProfile(false);
        }
      }
    };

    loadProfileData();

    return () => {
      mounted = false;
    };
  }, [userPresence.userId]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onUserCardClick?.(userPresence);
  };

  return (
    <div
      key={userPresence.userId}
      onClick={handleCardClick}
      className={`rounded-2xl border px-3 py-3 group transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'bg-brand-50 border-brand-200'
          : 'bg-white border-zinc-200 hover:bg-zinc-50'
      }`}
    >
      <div className='flex items-center gap-3'>
        <div className='flex-shrink-0'>
          <UserAvatar
            email={userProfile?.email}
            userId={userPresence.userId}
            profilePictureUrl={userProfile?.profilePictureUrl}
            hasProfilePicture={userProfile?.hasProfilePicture}
            size='md'
            showStatus
            status={
              isOnline
                ? userPresence.status
                : userPresence.lastSeen &&
                    formatPresenceTime(userPresence.lastSeen) ===
                      'Recently active'
                  ? 'RECENTLY_ACTIVE'
                  : 'OFFLINE'
            }
          />
        </div>

        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2 mb-1'>
            <div className='text-zinc-900 truncate no-email-detection'>
              {getDisplayName(userPresence, userProfile)}
            </div>
            {/* Trial indicator */}
            {existingConversations.has(userPresence.userId) &&
              !existingConversations.get(userPresence.userId)?.isConnected && (
                <span className='px-1.5 py-0.5 text-xs border bg-white border-zinc-200 text-zinc-500 rounded-full flex-shrink-0 flex items-center gap-1'>
                  <Clock className='w-3 h-3' />
                  Trial
                </span>
              )}
          </div>
          <div
            className={`text-sm mb-1.5 ${
              existingConversations.has(userPresence.userId) &&
              existingConversations.get(userPresence.userId)?.chatStatus ===
                'ENDED'
                ? canUserReconnect(userPresence.userId)
                  ? 'text-brand-500'
                  : 'text-zinc-500'
                : isOnline
                  ? 'text-green-500'
                  : userPresence.lastSeen &&
                      formatPresenceTime(userPresence.lastSeen) ===
                        'Recently active'
                    ? 'text-zinc-500'
                    : 'text-zinc-500'
            }`}
          >
            {existingConversations.has(userPresence.userId) &&
            existingConversations.get(userPresence.userId)?.chatStatus ===
              'ENDED'
              ? 'Chat Trial Ended'
              : isOnline
                ? 'Online now'
                : userPresence.lastSeen
                  ? formatPresenceTime(userPresence.lastSeen)
                  : 'Offline'}
          </div>
        </div>

        <div className='flex-shrink-0 flex items-center gap-1.5'>
          {(() => {
            const conversation = existingConversations.get(userPresence.userId);
            const isEndedWithTimer =
              conversation?.chatStatus === 'ENDED' &&
              !canUserReconnect(userPresence.userId) &&
              getReconnectTimeRemaining(userPresence.userId);

            if (isEndedWithTimer) {
              const timeRemaining = getReconnectTimeRemaining(
                userPresence.userId
              );
              return (
                <div className='text-sm text-right min-w-[70px]'>
                  <div className='text-zinc-500 hidden min-[400px]:block'>
                    Reconnect in
                  </div>
                  <div className='text-zinc-500 flex items-center justify-end gap-1'>
                    <Clock className='w-3 h-3 text-zinc-500 hover:text-zinc-900 cursor-pointer transition-colors' />
                    <span className='text-xs min-[400px]:text-sm'>
                      {timeRemaining}
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <button
                onClick={() => {
                  if (pendingRequests.has(userPresence.userId)) {
                    setShowCancelDialog(true);
                  } else {
                    onChatAction(userPresence.userId);
                  }
                }}
                className='px-2.5 py-2 text-sm font-medium rounded-xl border transition-colors bg-white text-brand-500 border-zinc-200 hover:bg-brand-100 hover:border-zinc-200 flex items-center gap-1.5 flex-shrink-0 min-w-[44px] justify-center'
              >
                {pendingRequests.has(userPresence.userId) ? (
                  <>
                    <span className='text-zinc-600 text-base min-[400px]:inline'>
                      <span className='hidden min-[400px]:inline'>
                        Cancel Request
                      </span>
                      <span className='min-[400px]:hidden'>Cancel</span>
                    </span>
                  </>
                ) : existingConversations.has(userPresence.userId) ? (
                  <>
                    {existingConversations.get(userPresence.userId)
                      ?.chatStatus === 'ENDED' ? (
                      canUserReconnect(userPresence.userId) ? (
                        <>
                          <span className='text-sm'>
                            <span className='hidden min-[400px]:inline'>
                              Send Request
                            </span>
                            <span className='min-[400px]:hidden'>Request</span>
                          </span>
                        </>
                      ) : (
                        (() => {
                          const timeRemaining = getReconnectTimeRemaining(
                            userPresence.userId
                          );
                          return timeRemaining ? (
                            <div className='text-right'>
                              <div className='hidden min-[400px]:block text-xs'>
                                Reconnect in
                              </div>
                              <div className='min-[400px]:hidden text-xs'>
                                Wait
                              </div>
                              <div className='flex items-center justify-end gap-1'>
                                <span className='text-xs'>{timeRemaining}</span>
                                <Clock
                                  className='w-3 h-3 text-zinc-500 hover:text-zinc-900 cursor-pointer transition-colors'
                                  onClick={e => {
                                    e.stopPropagation();
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            'View'
                          );
                        })()
                      )
                    ) : (
                      <>
                        <MessageCircle className='w-4 h-4 text-brand-500 flex-shrink-0' />
                        <span className='hidden min-[400px]:inline'>Chat</span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className='w-4 h-4 text-brand-500 flex-shrink-0' />
                    <span className='hidden min-[400px]:inline'>
                      Start Trial
                    </span>
                  </>
                )}
              </button>
            );
          })()}

          {/* Profile Summary Trigger - Mobile shows dialog, Desktop shows sidebar */}
          {/* Mobile: Profile dialog button */}
          <button
            onClick={() => setShowProfileDialog(true)}
            className='md:hidden px-2.5 py-2 text-sm font-medium rounded-xl border transition-colors bg-white text-zinc-900 border-zinc-200 hover:bg-zinc-100 hover:border-zinc-200 flex items-center gap-1.5 flex-shrink-0 min-w-[44px] justify-center'
            disabled={loadingProfile}
          >
            <User className='w-4 h-4 text-zinc-900 flex-shrink-0' />
            <span className='hidden min-[400px]:inline'>Profile</span>
          </button>

          {/* Desktop: three dots opens sidebar via parent */}
          <button
            onClick={() => onOpenProfileSidebar?.(userPresence)}
            className={`hidden md:flex p-2 text-sm font-medium rounded-full border transition-colors text-zinc-900 items-center justify-center w-[40px] h-[40px] ${
              isProfileSidebarOpen
                ? 'bg-zinc-100 border-zinc-200'
                : 'bg-white border-zinc-200 hover:bg-zinc-100 hover:border-zinc-200'
            }`}
            disabled={loadingProfile}
            aria-label='Open profile sidebar'
            aria-pressed={isProfileSidebarOpen}
          >
            <MoreHorizontal className='w-5 h-5 text-zinc-900' />
          </button>
        </div>
      </div>

      {/* Profile Summary Dialog */}
      <DialogContainer
        isOpen={showProfileDialog}
        onClose={() => setShowProfileDialog(false)}
        maxWidth='md'
      >
        <div className='p-6'>
          <h3 className='text-lg font-medium text-zinc-900 mb-4'>
            Profile Summary
          </h3>
          <div className='mb-4'>
            <div className='text-sm text-zinc-500 mb-2'>
              {getDisplayName(userPresence, userProfile)}
            </div>
            {loadingProfile ? (
              <div className='flex items-center gap-2 text-sm text-zinc-500'>
                <div className='w-3 h-3 bg-zinc-100 rounded-full animate-pulse'></div>
                <span>Loading profile details...</span>
              </div>
            ) : fullProfile ? (
              <div className='text-sm text-zinc-900 leading-relaxed bg-zinc-100 rounded-lg p-4 border border-zinc-200 space-y-3'>
                <div className='font-semibold mb-2'>Profile Details</div>
                {fullProfile.fullName && (
                  <div>
                    <span className='text-xs font-medium text-zinc-500'>Name:</span>
                    <p className='text-sm text-zinc-700'>{fullProfile.fullName}</p>
                  </div>
                )}
                {fullProfile.jobRole && (
                  <div>
                    <span className='text-xs font-medium text-zinc-500'>Role:</span>
                    <p className='text-sm text-zinc-700'>{fullProfile.jobRole}</p>
                  </div>
                )}
                {fullProfile.companyName && (
                  <div>
                    <span className='text-xs font-medium text-zinc-500'>Company:</span>
                    <p className='text-sm text-zinc-700'>{fullProfile.companyName}</p>
                  </div>
                )}
                {fullProfile.industry && (
                  <div>
                    <span className='text-xs font-medium text-zinc-500'>Industry:</span>
                    <p className='text-sm text-zinc-700'>{fullProfile.industry}</p>
                  </div>
                )}
                {fullProfile.yearsOfExperience !== null && fullProfile.yearsOfExperience !== undefined && (
                  <div>
                    <span className='text-xs font-medium text-zinc-500'>Experience:</span>
                    <p className='text-sm text-zinc-700'>{fullProfile.yearsOfExperience} years</p>
                  </div>
                )}
                {fullProfile.education && (
                  <div>
                    <span className='text-xs font-medium text-zinc-500'>Education:</span>
                    <p className='text-sm text-zinc-700'>{fullProfile.education}</p>
                  </div>
                )}
                {fullProfile.about && (
                  <div>
                    <span className='text-xs font-medium text-zinc-500'>About:</span>
                    <p className='text-sm text-zinc-700'>{fullProfile.about}</p>
                  </div>
                )}
                {fullProfile.interests && fullProfile.interests.length > 0 && (
                  <div>
                    <span className='text-xs font-medium text-zinc-500'>Interests:</span>
                    <p className='text-sm text-zinc-700'>{fullProfile.interests.join(', ')}</p>
                  </div>
                )}
                {fullProfile.skills && fullProfile.skills.length > 0 && (
                  <div>
                    <span className='text-xs font-medium text-zinc-500'>Skills:</span>
                    <p className='text-sm text-zinc-700'>{fullProfile.skills.join(', ')}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className='text-sm text-zinc-500'>
                No profile details available.
              </div>
            )}
          </div>
          <div className='flex'>
            <button
              onClick={() => setShowProfileDialog(false)}
              className='w-full px-4 py-2 text-sm font-medium text-white bg-brand-500 border border-zinc-200 rounded-lg focus:outline-none transition-colors'
            >
              OK
            </button>
          </div>
        </div>
      </DialogContainer>

      {/* Sidebar rendering moved to parent to allow push layout */}

      {/* Cancel Request Confirmation Dialog */}
      <DialogContainer
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        maxWidth='xs'
      >
        <div className='p-4'>
          <h3 className='text-lg font-medium text-zinc-900 text-center mb-3'>
            Cancel Chat Request?
          </h3>
          <p className='text-sm text-zinc-900 text-center mb-4'>
            This will cancel your pending chat request to{' '}
            {getDisplayName(userPresence, userProfile)}.
          </p>
          <div className='flex gap-2'>
            <button
              onClick={() => setShowCancelDialog(false)}
              className='flex-1 px-3 py-2 text-base font-medium text-zinc-900 bg-zinc-100 rounded-lg hover:bg-zinc-100 focus:outline-none transition-colors'
            >
              Done
            </button>
            <button
              onClick={() => {
                onCancelChatRequest(userPresence.userId);
                setShowCancelDialog(false);
              }}
              className='flex-1 px-3 py-2 text-base font-medium text-white bg-b_red-600 rounded-lg hover:bg-b_red-600 focus:outline-none transition-colors'
            >
              Cancel
            </button>
          </div>
        </div>
      </DialogContainer>
    </div>
  );
}
