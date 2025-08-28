'use client';

import { useState } from 'react';
import { MessageSquare, UserCheck, Bookmark } from 'lucide-react';

// Custom Connect Icon using circles from logo
const ConnectIcon = ({ className }: { className?: string }) => (
  <svg
    width='20'
    height='20'
    viewBox='0 0 20 20'
    className={className}
    fill='currentColor'
  >
    <circle cx='6' cy='10' r='4' />
    <circle cx='14' cy='10' r='4' />
  </svg>
);

import type { Schema } from '../../../amplify/data/resource';
import { formatPresenceTime } from '../../lib/presence-utils';
import { useUserProfile } from '../../hooks/useUserProfile';

import DialogContainer from '../DialogContainer';
import UserAvatar from '../UserAvatar';
import { useSavedUsersStore } from '../../stores/saved-users-store';

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
  onUserCardClick,
  selectedUserId,
  searchProfile,
  useRealtimeStatus = true,
  currentUserId,
}: UserCardProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);

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
      className={`px-3 py-3 group transition-all duration-200 cursor-pointer shadow-xs ${
        isSelected
          ? 'bg-brand-50 rounded-xl border border-brand-100'
          : 'bg-white hover:bg-slate-50 rounded-lg border border-slate-100 hover:border-brand-200'
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
          <div className='flex items-center gap-2 mb-0.5'>
            <div className='text-black truncate no-email-detection font-medium'>
              {getDisplayName(userPresence, userProfile)}
            </div>
            {/* All connections are now permanent - no trial indicators needed */}
          </div>

          {/* Profession */}
          {(finalFullProfile?.jobRole || finalFullProfile?.companyName) && (
            <div className='text-sm text-slate-500 truncate'>
              {finalFullProfile?.jobRole && finalFullProfile?.companyName
                ? `${finalFullProfile.jobRole} at ${finalFullProfile.companyName}`
                : finalFullProfile?.jobRole || finalFullProfile?.companyName}
            </div>
          )}
        </div>

        <div className='flex-shrink-0 flex items-center gap-2'>
          {/* Save Button - only show for other users */}
          {currentUserId && userPresence.userId !== currentUserId && (
            <button
              onClick={handleToggleSave}
              disabled={isSaveLoading}
              className={`p-2 rounded-lg transition-colors flex-shrink-0 text-slate-600 hover:bg-slate-50 ${
                isSaveLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={isSaved ? 'Remove from saved' : 'Save'}
            >
              <Bookmark
                className={`w-5 h-5 stroke-slate-500 ${isSaved ? 'fill-slate-300' : ''}`}
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
                  className='flex items-center justify-center gap-2 px-2 py-2 text-base font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:cursor-not-allowed disabled:hover:bg-slate-100 border border-slate-200'
                  title={
                    isOptimisticRequest
                      ? 'Request being sent...'
                      : 'Cancel Request'
                  }
                >
                  <UserCheck className='w-5 h-5 text-slate-500' />
                  <span className='text-base font-medium text-slate-500'>
                    Pending
                  </span>
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
                className={`px-2 py-2 rounded-lg text-base font-medium transition-colors flex items-center justify-center gap-2 flex-shrink-0 ${
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
                    <span className='text-base font-medium text-brand-600'>
                      Accept
                    </span>
                  </>
                ) : existingConversations.has(userPresence.userId) ? (
                  <>
                    <MessageSquare className='w-5 h-5 text-brand-600' />
                    <span className='text-base font-medium text-brand-600'>
                      Message
                    </span>
                  </>
                ) : (
                  <>
                    <ConnectIcon className='w-5 h-5 text-white' />
                    <span className='text-base font-medium text-white'>
                      Connect
                    </span>
                  </>
                )}
              </button>
            );
          })()}
        </div>
      </div>

      {/* Sidebar rendering moved to parent to allow push layout */}

      {/* Cancel Request Confirmation Dialog */}
      <DialogContainer
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        maxWidth='sm'
      >
        <div className='p-4'>
          <h3 className='text-lg font-medium text-black text-center mb-3'>
            Cancel Connection Request?
          </h3>
          <p className='text-base text-black text-center mb-4'>
            This will cancel your pending connection request to{' '}
            {getDisplayName(userPresence, userProfile)}.
          </p>
          <div className='flex gap-2'>
            <button
              onClick={() => setShowCancelDialog(false)}
              className='flex-1 px-3 py-2 text-base font-medium text-black bg-slate-100 rounded-lg hover:bg-slate-100 focus:outline-none transition-colors'
            >
              Done
            </button>
            <button
              onClick={() => {
                onCancelChatRequest(userPresence.userId);
                setShowCancelDialog(false);
              }}
              className='flex-1 px-3 py-2 text-base font-medium text-b_red-600 bg-slate-100 rounded-lg hover:bg-slate-200 focus:outline-none transition-colors'
            >
              Cancel Request
            </button>
          </div>
        </div>
      </DialogContainer>
    </div>
  );
}
