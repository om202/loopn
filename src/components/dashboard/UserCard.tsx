'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, MessageCircle, MoreHorizontal, User } from 'lucide-react';

import type { Schema } from '../../../amplify/data/resource';
import { formatPresenceTime } from '../../lib/presence-utils';
import { UserProfileService } from '../../services/user-profile.service';

import DialogContainer from '../DialogContainer';
import UserAvatar from '../UserAvatar';
import {
  ShimmerProvider,
  ProfileDetails_Shimmer,
} from '../ShimmerLoader/exports';

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
  const [fullProfile, setFullProfile] = useState<
    Schema['UserProfile']['type'] | null
  >(null);
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
                ? 'ONLINE'
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
            <div className='text-zinc-900 truncate no-email-detection font-medium'>
              {getDisplayName(userPresence, userProfile)}
            </div>
          </div>

          {/* Profession */}
          {fullProfile?.jobRole && (
            <div className='text-sm text-zinc-600 mb-1.5 truncate'>
              {fullProfile.jobRole}
            </div>
          )}
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
                <div className='flex items-center justify-center w-[40px] h-[40px] md:w-auto md:h-auto md:min-w-[70px] rounded-xl border border-zinc-200 bg-white md:px-2.5 md:py-2'>
                  <div
                    className='text-zinc-500 flex flex-col items-center gap-0.5 md:text-right'
                    title={`Reconnect in ${timeRemaining}`}
                  >
                    <div className='md:hidden flex flex-col items-center gap-0.5'>
                      <Clock className='w-4 h-4 text-zinc-500' />
                      <span className='text-[10px] leading-none'>
                        {timeRemaining}
                      </span>
                    </div>
                    <div className='hidden md:block text-sm'>
                      <div className='text-zinc-500 text-xs'>Reconnect in</div>
                      <div className='text-zinc-500 flex items-center justify-end gap-1'>
                        <Clock className='w-3 h-3 text-zinc-500' />
                        <span className='text-xs'>{timeRemaining}</span>
                      </div>
                    </div>
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
                className='px-2 py-1.5 text-sm font-medium rounded-xl border transition-colors bg-white text-brand-500 border-brand-200 hover:bg-brand-100 hover:border-brand-300 flex items-center justify-center flex-shrink-0 w-[40px] h-[40px] md:w-auto md:h-auto md:gap-1.5 md:min-w-[44px]'
                title={
                  pendingRequests.has(userPresence.userId)
                    ? 'Cancel Request'
                    : existingConversations.has(userPresence.userId)
                      ? existingConversations.get(userPresence.userId)
                          ?.chatStatus === 'ENDED'
                        ? canUserReconnect(userPresence.userId)
                          ? 'Reconnect'
                          : 'View Chat'
                        : 'Continue Chat'
                      : 'Send Request'
                }
              >
                {pendingRequests.has(userPresence.userId) ? (
                  <>
                    <Clock className='w-4 h-4 text-zinc-600 flex-shrink-0' />
                    <span className='hidden md:inline text-zinc-600 text-sm font-medium'>
                      <span className='hidden lg:inline'>Cancel Request</span>
                      <span className='lg:hidden'>Cancel</span>
                    </span>
                  </>
                ) : existingConversations.has(userPresence.userId) ? (
                  existingConversations.get(userPresence.userId)?.chatStatus ===
                  'ENDED' ? (
                    canUserReconnect(userPresence.userId) ? (
                      <>
                        <CheckCircle2 className='w-4 h-4 text-brand-500 flex-shrink-0' />
                        <span className='hidden md:inline text-sm font-medium'>
                          Reconnect
                        </span>
                      </>
                    ) : (
                      (() => {
                        const timeRemaining = getReconnectTimeRemaining(
                          userPresence.userId
                        );
                        return timeRemaining ? (
                          <Clock className='w-4 h-4 text-zinc-500 flex-shrink-0' />
                        ) : (
                          <>
                            <MessageCircle className='w-4 h-4 text-brand-500 flex-shrink-0' />
                            <span className='hidden md:inline text-sm font-medium'>
                              View
                            </span>
                          </>
                        );
                      })()
                    )
                  ) : (
                    <>
                      <MessageCircle className='w-4 h-4 text-brand-500 flex-shrink-0' />
                      <span className='hidden md:inline text-sm font-medium'>
                        Chat
                      </span>
                    </>
                  )
                ) : (
                  <>
                    <CheckCircle2 className='w-4 h-4 text-brand-500 flex-shrink-0' />
                    <span className='hidden md:inline text-sm font-medium'>
                      Send Request
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
            className='md:hidden px-2.5 py-2 text-xs font-medium rounded-xl border transition-colors bg-white text-zinc-900 border-zinc-200 hover:bg-zinc-100 hover:border-zinc-200 flex items-center justify-center flex-shrink-0 w-[40px] h-[40px]'
            disabled={loadingProfile}
            title='View Profile'
          >
            <User className='w-4 h-4 text-zinc-900 flex-shrink-0' />
          </button>

          {/* Desktop: profile icon opens sidebar via parent */}
          <button
            onClick={() => onOpenProfileSidebar?.(userPresence)}
            className={`hidden md:flex p-1.5 text-xs font-medium rounded-full border transition-colors items-center justify-center w-[32px] h-[32px] ${
              isProfileSidebarOpen
                ? 'bg-zinc-100 border-zinc-200'
                : 'bg-white border-zinc-200 hover:bg-zinc-100'
            }`}
            disabled={loadingProfile}
            aria-label='Open profile sidebar'
            aria-pressed={isProfileSidebarOpen}
          >
            <Info className='w-5 h-5 text-zinc-500' />
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
              <ShimmerProvider>
                <ProfileDetails_Shimmer />
              </ShimmerProvider>
            ) : fullProfile ? (
              <div className='space-y-5'>
                {/* Professional Info Section */}
                {(fullProfile.jobRole ||
                  fullProfile.companyName ||
                  fullProfile.industry ||
                  fullProfile.yearsOfExperience !== null) && (
                  <div>
                    <h4 className='text-sm font-semibold text-zinc-900 mb-3 border-b border-zinc-100 pb-2'>
                      Profile Details
                    </h4>
                    <div className='space-y-3'>
                      {fullProfile.jobRole && (
                        <div>
                          <dt className='text-xs font-medium text-zinc-500 mb-1'>
                            Role
                          </dt>
                          <dd className='text-sm text-zinc-900'>
                            {fullProfile.jobRole}
                          </dd>
                        </div>
                      )}
                      {fullProfile.companyName && (
                        <div>
                          <dt className='text-xs font-medium text-zinc-500 mb-1'>
                            Company
                          </dt>
                          <dd className='text-sm text-zinc-900'>
                            {fullProfile.companyName}
                          </dd>
                        </div>
                      )}
                      {fullProfile.industry && (
                        <div>
                          <dt className='text-xs font-medium text-zinc-500 mb-1'>
                            Industry
                          </dt>
                          <dd className='text-sm text-zinc-900'>
                            {fullProfile.industry}
                          </dd>
                        </div>
                      )}
                      {fullProfile.yearsOfExperience !== null &&
                        fullProfile.yearsOfExperience !== undefined && (
                          <div>
                            <dt className='text-xs font-medium text-zinc-500 mb-1'>
                              Experience
                            </dt>
                            <dd className='text-sm text-zinc-900'>
                              {fullProfile.yearsOfExperience} years
                            </dd>
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {/* Education Section */}
                {fullProfile.education && (
                  <div>
                    <h4 className='text-sm font-semibold text-zinc-900 mb-3 border-b border-zinc-100 pb-2'>
                      Education
                    </h4>
                    <div>
                      <dd className='text-sm text-zinc-900'>
                        {fullProfile.education}
                      </dd>
                    </div>
                  </div>
                )}

                {/* About Section */}
                {fullProfile.about && (
                  <div>
                    <h4 className='text-sm font-semibold text-zinc-900 mb-3 border-b border-zinc-100 pb-2'>
                      About
                    </h4>
                    <div>
                      <dd className='text-sm text-zinc-900 leading-relaxed'>
                        {fullProfile.about}
                      </dd>
                    </div>
                  </div>
                )}

                {/* Skills & Interests Section */}
                {((fullProfile.skills && fullProfile.skills.length > 0) ||
                  (fullProfile.interests &&
                    fullProfile.interests.length > 0)) && (
                  <div>
                    <h4 className='text-sm font-semibold text-zinc-900 mb-3 border-b border-zinc-100 pb-2'>
                      Skills & Interests
                    </h4>
                    <div className='space-y-3'>
                      {fullProfile.skills && fullProfile.skills.length > 0 && (
                        <div>
                          <dt className='text-xs font-medium text-zinc-500 mb-2'>
                            Skills
                          </dt>
                          <dd className='flex flex-wrap gap-2'>
                            {fullProfile.skills.map((skill, index) => (
                              <span
                                key={index}
                                className='px-2 py-1 text-xs bg-brand-50 text-brand-700 rounded-md border border-brand-100'
                              >
                                {skill}
                              </span>
                            ))}
                          </dd>
                        </div>
                      )}
                      {fullProfile.interests &&
                        fullProfile.interests.length > 0 && (
                          <div>
                            <dt className='text-xs font-medium text-zinc-500 mb-2'>
                              Interests
                            </dt>
                            <dd className='flex flex-wrap gap-2'>
                              {fullProfile.interests.map((interest, index) => (
                                <span
                                  key={index}
                                  className='px-2 py-1 text-xs bg-b_green-50 text-b_green-700 rounded-md border border-b_green-100'
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
              <div className='text-sm text-zinc-500 text-center py-4'>
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
