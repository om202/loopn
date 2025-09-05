'use client';

import { useState } from 'react';
import { MessageSquare, UserCheck, Bookmark, User, X } from 'lucide-react';

// Custom Connect Icon using circles from logo
const ConnectIcon = ({ className }: { className?: string }) => (
  <svg
    width='20'
    height='20'
    viewBox='30 30 160 160'
    className={className}
    fill='currentColor'
  >
    <circle cx='75' cy='110' r='35' />
    <circle cx='145' cy='110' r='35' />
  </svg>
);

import type { Schema } from '../../../amplify/data/resource';
import { formatPresenceTime } from '../../lib/presence-utils';
import { useUserProfile } from '../../hooks/useUserProfile';

import DialogContainer from '../DialogContainer';
import UserAvatar from '../UserAvatar';
import UserProfileContent from '../UserProfileContent';
import { useSavedUsersStore } from '../../stores/saved-users-store';

type UserPresence = Schema['UserPresence']['type'];
type Conversation = Schema['Conversation']['type'];

// Helper function to capitalize first letter of each word
const capitalizeWords = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

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
  onOpenProfileSidebar?: (user: UserPresence) => void;
  onUserCardClick?: (user: UserPresence) => void;
  isProfileSidebarOpen?: boolean;
  selectedUserId?: string;
  currentUserId: string; // Current logged in user ID for save functionality
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
    return capitalizeWords(userProfile.fullName);
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
  onUserCardClick,
  selectedUserId,
  searchProfile,
  useRealtimeStatus = true,
  currentUserId,
}: UserCardProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  // Use our centralized stores
  const { profile: fullProfile, isLoading: _loadingProfile } = useUserProfile(
    searchProfile ? '' : userPresence.userId // Skip fetching if searchProfile is provided
  );

  const savedUsersStore = useSavedUsersStore();

  // Get save status from store
  const isSaved = currentUserId
    ? savedUsersStore.isUserSaved(currentUserId, userPresence.userId)
    : false;
  const isSaveLoading = currentUserId
    ? savedUsersStore.loading[currentUserId] || false
    : false;

  // Handle save/unsave toggle using store
  const handleToggleSave = async () => {
    if (!currentUserId || userPresence.userId === currentUserId) return;
    await savedUsersStore.toggleSaveUser(currentUserId, userPresence.userId);
  };

  // Derive user profile data from either searchProfile or fetched profile
  const userProfile = searchProfile
    ? {
        fullName: searchProfile.fullName
          ? capitalizeWords(searchProfile.fullName)
          : undefined,
        email: searchProfile.email,
        profilePictureUrl: searchProfile.profilePictureUrl,
        hasProfilePicture: !!searchProfile.profilePictureUrl,
      }
    : fullProfile
      ? {
          fullName: fullProfile.fullName
            ? capitalizeWords(fullProfile.fullName)
            : undefined,
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
        fullName: searchProfile.fullName
          ? capitalizeWords(searchProfile.fullName)
          : null,
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
      className={`px-3 py-3 group transition-colors cursor-pointer shadow-xs ${
        isSelected
          ? 'bg-brand-50 rounded-xl border border-brand-200'
          : 'bg-white hover:bg-neutral-50 rounded-lg border border-neutral-200 hover:border-brand-300'
      }`}
    >
      <div className='flex items-center gap-3'>
        <div className='flex-shrink-0 flex items-center justify-center'>
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
            <div className='text-neutral-900 text-[17px] truncate no-email-detection font-medium'>
              {getDisplayName(userPresence, userProfile)}
            </div>
            {/* All connections are now permanent - no trial indicators needed */}
          </div>

          {/* Profession */}
          {(finalFullProfile?.jobRole || finalFullProfile?.companyName) && (
            <div className='text-[15px] text-neutral-500 font-medium truncate'>
              {finalFullProfile?.jobRole && finalFullProfile?.companyName
                ? `${finalFullProfile.jobRole} at ${finalFullProfile.companyName}`
                : finalFullProfile?.jobRole || finalFullProfile?.companyName}
            </div>
          )}
        </div>

        <div className='flex-shrink-0 flex items-center gap-2'>
          {/* Profile Button - only show on mobile */}
          <button
            onClick={() => setShowProfileDialog(true)}
            className='p-2 rounded-lg transition-colors flex-shrink-0 text-neutral-500 hover:bg-neutral-50 sm:hidden'
            title='View Profile'
          >
            <User className='w-5 h-5' strokeWidth={1.5} />
          </button>

          {/* Save Button - only show for other users */}
          {currentUserId && userPresence.userId !== currentUserId && (
            <button
              onClick={handleToggleSave}
              disabled={isSaveLoading}
              className={`p-2 rounded-lg transition-colors flex-shrink-0 text-neutral-500 hover:bg-neutral-50 ${
                isSaveLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={isSaved ? 'Remove from saved' : 'Save'}
            >
              <Bookmark
                className={`w-5 h-5 stroke-neutral-500 ${isSaved ? 'fill-neutral-300' : ''}`}
                strokeWidth={1.5}
              />
            </button>
          )}

          {(() => {
            // All conversations are now permanent - no ended state or timers to check

            // Handle pending request state - show as clickable button for consistency
            // BUT: If user has incoming request, prioritize "Accept Request" over "Request Sent"
            if (
              pendingRequests.has(userPresence.userId) &&
              !incomingRequestSenderIds.has(userPresence.userId)
            ) {
              // Check if this is an optimistic request (no real request data yet)
              const isOptimisticRequest = optimisticPendingRequests.has(
                userPresence.userId
              );

              return (
                <button
                  onClick={() => setShowCancelDialog(true)}
                  disabled={isOptimisticRequest}
                  className='flex items-center justify-center gap-2 px-3 py-2 font-medium text-neutral-500 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors disabled:cursor-not-allowed disabled:hover:bg-neutral-100 border border-neutral-200'
                  title={
                    isOptimisticRequest
                      ? 'Request being sent...'
                      : 'Cancel Request'
                  }
                >
                  <UserCheck className='w-5 h-5 text-neutral-500' />
                  <span className='font-medium text-neutral-500'>Pending</span>
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
                className={`px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 flex-shrink-0 ${
                  incomingRequestSenderIds.has(userPresence.userId)
                    ? 'bg-white text-brand-600 border border-brand-500 hover:bg-brand-50'
                    : existingConversations.has(userPresence.userId)
                      ? 'bg-white text-brand-600 border border-brand-500 hover:bg-brand-50'
                      : 'bg-brand-500 hover:bg-brand-600 text-white'
                }`}
                title={
                  incomingRequestSenderIds.has(userPresence.userId)
                    ? 'Accept'
                    : existingConversations.has(userPresence.userId)
                      ? 'Message'
                      : 'Connect'
                }
              >
                {incomingRequestSenderIds.has(userPresence.userId) ? (
                  // Prioritize incoming requests over existing conversations
                  <>
                    <ConnectIcon className='w-5 h-5 text-brand-600' />
                    <span className='font-medium text-brand-600'>Accept</span>
                  </>
                ) : existingConversations.has(userPresence.userId) ? (
                  <>
                    <MessageSquare className='w-5 h-5 text-brand-600' />
                    <span className='font-medium text-brand-600'>Message</span>
                  </>
                ) : (
                  <>
                    <ConnectIcon className='w-5 h-5 text-white' />
                    <span className='font-medium text-white'>Connect</span>
                  </>
                )}
              </button>
            );
          })()}
        </div>
      </div>

      {/* Sidebar rendering moved to parent to allow push layout */}

      {/* Profile Details Dialog */}
      <DialogContainer
        isOpen={showProfileDialog}
        onClose={() => setShowProfileDialog(false)}
        maxWidth='lg'
      >
        <div className='flex flex-col max-h-[90vh]'>
          {/* Header */}
          <div className='px-6 py-4 border-b border-neutral-200 flex items-center justify-between flex-shrink-0'>
            <h2 className='text-lg font-semibold text-neutral-900'>
              Profile Details
            </h2>
            <button
              onClick={() => setShowProfileDialog(false)}
              className='p-2 text-neutral-500 hover:text-neutral-900 transition-colors rounded-lg hover:bg-neutral-100'
              title='Close'
            >
              <X className='w-5 h-5' />
            </button>
          </div>

          {/* Content */}
          <div className='flex-1 overflow-y-auto'>
            <div className='p-6'>
              {/* User Profile Header */}
              <div className='flex items-start gap-4 mb-6'>
                <div className='flex-shrink-0'>
                  <UserAvatar
                    email={userProfile?.email}
                    userId={userPresence.userId}
                    profilePictureUrl={userProfile?.profilePictureUrl}
                    hasProfilePicture={userProfile?.hasProfilePicture || false}
                    size='xl'
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
                  <h1 className='text-xl font-bold text-neutral-900 mb-1'>
                    {getDisplayName(userPresence, userProfile)}
                  </h1>
                  {(finalFullProfile?.jobRole ||
                    finalFullProfile?.companyName) && (
                    <p className='text-base text-neutral-700 mb-1'>
                      {finalFullProfile?.jobRole &&
                      finalFullProfile?.companyName
                        ? `${finalFullProfile.jobRole} at ${finalFullProfile.companyName}`
                        : finalFullProfile?.jobRole ||
                          finalFullProfile?.companyName}
                    </p>
                  )}
                </div>
              </div>

              {/* Profile Content */}
              {finalFullProfile && (
                <UserProfileContent
                  userProfile={finalFullProfile}
                  loading={false}
                  showContactInfo={false}
                />
              )}

              {!finalFullProfile && (
                <div className='text-center py-8 text-neutral-500'>
                  No profile details available.
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContainer>

      {/* Cancel Request Confirmation Dialog */}
      <DialogContainer
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        maxWidth='sm'
      >
        <div className='p-4'>
          <h3 className='text-lg font-medium text-neutral-900 text-center mb-3'>
            Cancel Connection Request?
          </h3>
          <p className='text-base text-neutral-900 text-center mb-4'>
            This will cancel your pending connection request to{' '}
            {getDisplayName(userPresence, userProfile)}.
          </p>
          <div className='flex gap-2'>
            <button
              onClick={() => setShowCancelDialog(false)}
              className='flex-1 px-3 py-2 font-medium text-neutral-900 bg-neutral-100 rounded-lg hover:bg-neutral-100 focus:outline-none transition-colors'
            >
              Done
            </button>
            <button
              onClick={() => {
                onCancelChatRequest(userPresence.userId);
                setShowCancelDialog(false);
              }}
              className='flex-1 px-3 py-2 font-medium text-red-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 focus:outline-none transition-colors'
            >
              Cancel Request
            </button>
          </div>
        </div>
      </DialogContainer>
    </div>
  );
}
