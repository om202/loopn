'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  MessageCircle,
  MoreHorizontal,
  User,
} from 'lucide-react';

import type { Schema } from '../../../amplify/data/resource';
import { formatPresenceTime } from '../../lib/presence-utils';
import { useUserProfile } from '../../hooks/useUserProfile';

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
  optimisticPendingRequests?: Set<string>; // Track optimistic requests
  incomingRequestSenderIds: Set<string>;
  onChatAction: (userId: string) => void;
  onCancelChatRequest: (userId: string) => void;
  onAcceptChatRequest: (userId: string) => void;
  canUserReconnect: (userId: string) => boolean;
  getReconnectTimeRemaining: (userId: string) => string | null;
  onOpenProfileSidebar?: (user: UserPresence) => void;
  onUserCardClick?: (user: UserPresence) => void;
  isProfileSidebarOpen?: boolean;
  selectedUserId?: string;
  searchProfile?: {
    userId: string;
    fullName?: string;
    email?: string;
    jobRole?: string;
    companyName?: string;
    industry?: string;
    yearsOfExperience?: number;
    education?: string;
    about?: string;
    interests?: string[];
    skills?: string[];
    profilePictureUrl?: string;
    isOnboardingComplete?: boolean;
  };
  useRealtimeStatus?: boolean; // Whether to show real-time status (online/offline)
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
  optimisticPendingRequests = new Set(),
  incomingRequestSenderIds,
  onChatAction,
  onCancelChatRequest,
  onAcceptChatRequest,
  canUserReconnect,
  getReconnectTimeRemaining,
  onOpenProfileSidebar,
  onUserCardClick,
  isProfileSidebarOpen,
  selectedUserId,
  searchProfile,
  useRealtimeStatus = true,
}: UserCardProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  // Use our centralized user profile hook instead of local state and API calls
  const { profile: fullProfile, isLoading: loadingProfile } = useUserProfile(
    searchProfile ? '' : userPresence.userId // Skip fetching if searchProfile is provided
  );

  // Derive user profile data from either searchProfile or fetched profile
  const userProfile = searchProfile
    ? {
        fullName: searchProfile.fullName,
        email: searchProfile.email,
        profilePictureUrl: searchProfile.profilePictureUrl,
        hasProfilePicture: !!searchProfile.profilePictureUrl,
      }
    : fullProfile
      ? {
          fullName: fullProfile.fullName || undefined,
          email: fullProfile.email || undefined,
          profilePictureUrl: fullProfile.profilePictureUrl || undefined,
          hasProfilePicture: fullProfile.hasProfilePicture || false,
        }
      : null;
  // Only show online status if useRealtimeStatus is enabled
  const isOnline = useRealtimeStatus
    ? onlineUsers.some(ou => ou.userId === userPresence.userId)
    : false;
  const isSelected = selectedUserId === userPresence.userId;

  // Handle searchProfile case - create a mock fullProfile for consistency
  const finalFullProfile = searchProfile
    ? ({
        userId: searchProfile.userId,
        fullName: searchProfile.fullName || null,
        email: searchProfile.email || null,
        jobRole: searchProfile.jobRole || null,
        companyName: searchProfile.companyName || null,
        industry: searchProfile.industry || null,
        yearsOfExperience: searchProfile.yearsOfExperience || null,
        education: searchProfile.education || null,
        about: searchProfile.about || null,
        interests: searchProfile.interests || null,
        skills: searchProfile.skills || null,
        profilePictureUrl: searchProfile.profilePictureUrl || null,
        isOnboardingComplete: searchProfile.isOnboardingComplete || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Schema['UserProfile']['type'])
    : fullProfile;

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
      className={`px-3 py-2 group transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'bg-brand-50 rounded-2xl border border-brand-200'
          : 'bg-white hover:bg-zinc-50 hover:rounded-2xl border border-transparent border-b-zinc-100 last:border-b-0'
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
            showStatus={useRealtimeStatus}
            status={
              useRealtimeStatus
                ? isOnline
                  ? 'ONLINE'
                  : userPresence.lastSeen &&
                      formatPresenceTime(userPresence.lastSeen) ===
                        'Recently active'
                    ? 'RECENTLY_ACTIVE'
                    : 'OFFLINE'
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
          {finalFullProfile?.jobRole && (
            <div className='text-[15px] text-zinc-500 mb-1.5 truncate'>
              {finalFullProfile.jobRole}
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
                <div
                  className={`flex items-center justify-center w-[40px] h-[40px] md:w-auto md:h-auto md:min-w-[70px] rounded-xl border border-brand-100 md:px-2.5 md:py-2 ${
                    isSelected ? 'bg-white' : 'bg-brand-50'
                  }`}
                >
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

            // Handle pending request state - show as clickable button for consistency
            if (pendingRequests.has(userPresence.userId)) {
              // Check if this is an optimistic request (no real request data yet)
              const isOptimisticRequest = optimisticPendingRequests.has(
                userPresence.userId
              );

              return (
                <button
                  onClick={() => setShowCancelDialog(true)}
                  disabled={isOptimisticRequest}
                  className='flex items-center gap-1 px-2 py-1.5 text-sm text-zinc-500 hover:bg-zinc-50 rounded transition-colors disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:opacity-60'
                  title={
                    isOptimisticRequest
                      ? 'Request being sent...'
                      : 'Cancel Request'
                  }
                >
                  <CheckCircle2 className='w-4 h-4 text-zinc-500 flex-shrink-0' />
                  <span className='text-base text-zinc-500'>Request Sent</span>
                </button>
              );
            }

            return (
              <button
                onClick={() => {
                  if (incomingRequestSenderIds.has(userPresence.userId)) {
                    onAcceptChatRequest(userPresence.userId);
                  } else {
                    onChatAction(userPresence.userId);
                  }
                }}
                className={`px-2 py-1.5 text-base font-medium rounded-xl border transition-colors flex items-center justify-center flex-shrink-0 w-[40px] h-[40px] md:w-auto md:h-auto md:gap-1.5 md:min-w-[44px] ${
                  incomingRequestSenderIds.has(userPresence.userId)
                    ? 'bg-brand-500 text-white border-brand-500 hover:bg-brand-600 hover:border-brand-600'
                    : isSelected
                      ? 'bg-white text-brand-500 border-brand-100 hover:bg-brand-100 hover:border-brand-200'
                      : 'bg-brand-50 text-brand-500 border-brand-100 hover:bg-brand-100 hover:border-brand-200'
                }`}
                title={
                  existingConversations.has(userPresence.userId)
                    ? existingConversations.get(userPresence.userId)
                        ?.chatStatus === 'ENDED'
                      ? canUserReconnect(userPresence.userId)
                        ? 'Send Request'
                        : 'View Chat'
                      : 'Continue Chat'
                    : incomingRequestSenderIds.has(userPresence.userId)
                      ? 'Accept Request'
                      : 'Send Request'
                }
              >
                {existingConversations.has(userPresence.userId) ? (
                  existingConversations.get(userPresence.userId)?.chatStatus ===
                  'ENDED' ? (
                    canUserReconnect(userPresence.userId) ? (
                      <>
                        <CheckCircle2 className='w-4 h-4 text-brand-500 flex-shrink-0' />
                        <span className='hidden md:inline text-base font-medium'>
                          Send Request
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
                            <span className='hidden md:inline text-base font-medium'>
                              View
                            </span>
                          </>
                        );
                      })()
                    )
                  ) : (
                    <>
                      <MessageCircle className='w-4 h-4 text-brand-500 flex-shrink-0' />
                      <span className='hidden md:inline text-base font-medium'>
                        Chat
                      </span>
                    </>
                  )
                ) : incomingRequestSenderIds.has(userPresence.userId) ? (
                  <>
                    <CheckCircle2 className='w-4 h-4 text-white flex-shrink-0' />
                    <span className='hidden md:inline text-base font-medium'>
                      Accept Request
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className='w-4 h-4 text-brand-500 flex-shrink-0' />
                    <span className='hidden md:inline text-base font-medium'>
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
            className={`md:hidden px-2.5 py-2 text-base font-medium rounded-xl border transition-colors text-zinc-900 border-brand-100 hover:bg-brand-100 hover:border-brand-100 flex items-center justify-center flex-shrink-0 w-[40px] h-[40px] ${
              isSelected ? 'bg-white' : 'bg-brand-50'
            }`}
            disabled={loadingProfile}
            title='View Profile'
          >
            <User className='w-4 h-4 text-zinc-900 flex-shrink-0' />
          </button>

          {/* Desktop: profile icon opens sidebar via parent */}
          <button
            onClick={() => onOpenProfileSidebar?.(userPresence)}
            className={`hidden md:flex p-1.5 text-base font-medium rounded-full border transition-colors items-center justify-center w-[32px] h-[32px] ${
              isProfileSidebarOpen
                ? 'bg-zinc-100 border-zinc-100'
                : isSelected
                  ? 'bg-zinc-50 border-zinc-100 hover:bg-zinc-100'
                  : 'bg-white border-zinc-100 hover:bg-zinc-100'
            }`}
            disabled={loadingProfile}
            aria-label='Open profile sidebar'
            aria-pressed={isProfileSidebarOpen}
          >
            <MoreHorizontal className='w-5 h-5 text-zinc-500' />
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
            ) : finalFullProfile ? (
              <div className='space-y-5'>
                {/* Professional Info Section */}
                {(finalFullProfile.jobRole ||
                  finalFullProfile.companyName ||
                  finalFullProfile.industry ||
                  finalFullProfile.yearsOfExperience !== null) && (
                  <div>
                    <h4 className='text-sm font-semibold text-zinc-900 mb-3 border-b border-zinc-100 pb-2'>
                      Profile
                    </h4>
                    <div className='space-y-3'>
                      {finalFullProfile.jobRole && (
                        <div>
                          <dt className='text-xs font-medium text-zinc-500 mb-1'>
                            Role
                          </dt>
                          <dd className='text-sm text-zinc-900'>
                            {finalFullProfile.jobRole}
                          </dd>
                        </div>
                      )}
                      {finalFullProfile.companyName && (
                        <div>
                          <dt className='text-xs font-medium text-zinc-500 mb-1'>
                            Company
                          </dt>
                          <dd className='text-sm text-zinc-900'>
                            {finalFullProfile.companyName}
                          </dd>
                        </div>
                      )}
                      {finalFullProfile.industry && (
                        <div>
                          <dt className='text-xs font-medium text-zinc-500 mb-1'>
                            Industry
                          </dt>
                          <dd className='text-sm text-zinc-900'>
                            {finalFullProfile.industry}
                          </dd>
                        </div>
                      )}
                      {finalFullProfile.yearsOfExperience !== null &&
                        finalFullProfile.yearsOfExperience !== undefined && (
                          <div>
                            <dt className='text-xs font-medium text-zinc-500 mb-1'>
                              Experience
                            </dt>
                            <dd className='text-sm text-zinc-900'>
                              {finalFullProfile.yearsOfExperience} years
                            </dd>
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {/* Education Section */}
                {finalFullProfile.education && (
                  <div>
                    <h4 className='text-sm font-semibold text-zinc-900 mb-3 border-b border-zinc-100 pb-2'>
                      Education
                    </h4>
                    <div>
                      <dd className='text-sm text-zinc-900'>
                        {finalFullProfile.education}
                      </dd>
                    </div>
                  </div>
                )}

                {/* About Section */}
                {finalFullProfile.about && (
                  <div>
                    <h4 className='text-sm font-semibold text-zinc-900 mb-3 border-b border-zinc-100 pb-2'>
                      About
                    </h4>
                    <div>
                      <dd className='text-sm text-zinc-900 leading-relaxed'>
                        {finalFullProfile.about}
                      </dd>
                    </div>
                  </div>
                )}

                {/* Skills & Interests Section */}
                {((finalFullProfile.skills &&
                  finalFullProfile.skills.length > 0) ||
                  (finalFullProfile.interests &&
                    finalFullProfile.interests.length > 0)) && (
                  <div>
                    <h4 className='text-sm font-semibold text-zinc-900 mb-3 border-b border-zinc-100 pb-2'>
                      Skills & Interests
                    </h4>
                    <div className='space-y-3'>
                      {finalFullProfile.skills &&
                        finalFullProfile.skills.length > 0 && (
                          <div>
                            <dt className='text-xs font-medium text-zinc-500 mb-2'>
                              Skills
                            </dt>
                            <dd className='flex flex-wrap gap-2'>
                              {finalFullProfile.skills.map((skill, index) => (
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
                      {finalFullProfile.interests &&
                        finalFullProfile.interests.length > 0 && (
                          <div>
                            <dt className='text-xs font-medium text-zinc-500 mb-2'>
                              Interests
                            </dt>
                            <dd className='flex flex-wrap gap-2'>
                              {finalFullProfile.interests.map(
                                (interest, index) => (
                                  <span
                                    key={index}
                                    className='px-2 py-1 text-xs bg-b_green-50 text-b_green-700 rounded-md border border-b_green-100'
                                  >
                                    {interest}
                                  </span>
                                )
                              )}
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
        maxWidth='sm'
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
              className='flex-1 px-3 py-2 text-base font-medium text-b_red-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 focus:outline-none transition-colors'
            >
              Cancel Request
            </button>
          </div>
        </div>
      </DialogContainer>
    </div>
  );
}
