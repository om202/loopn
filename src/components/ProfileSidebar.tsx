'use client';

import { useState, useEffect } from 'react';
import {
  ClockFading,
  ArrowLeft,
  MessageSquare,
  UserRoundMinus,
  UserPlus,
  UserCheck,
  Expand,
  X,
  FileDown,
} from 'lucide-react';

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
import { useAuthenticator } from '@aws-amplify/ui-react';
import UserAvatar from './UserAvatar';
import UserProfileContent from './UserProfileContent';
import Tooltip from './Tooltip';
import DialogContainer from './DialogContainer';
import { formatPresenceTime } from '../lib/presence-utils';
import { useSubscriptionStore } from '../stores/subscription-store';
import {
  ShimmerProvider,
  ProfileDetails_Shimmer,
} from './ShimmerLoader/exports';
import { useRealtimeConnectionRequests } from '../hooks/realtime/useRealtimeConnectionRequests';
import { useConnectionActions } from '../hooks/useConnectionActions';
import CancelConnectionRequestDialog from './CancelConnectionRequestDialog';
import RemoveConnectionDialog from './RemoveConnectionDialog';
import { generateMarkdownResume } from '../lib/markdown-resume-generator';

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
  incomingRequestSenderIds?: Set<string>;
  onChatAction?: (userId: string) => void;
  onCancelChatRequest?: (userId: string) => void;
  onAcceptChatRequest?: (userId: string) => void;

  // Chat-specific props
  conversation?: Conversation;
  timeLeft?: string;
  sendingConnectionRequest?: boolean;
  onBack?: () => void;
  onClose?: () => void;
  onEndChat?: () => void;
  onSendConnectionRequest?: () => void;
  onCancelConnectionRequest?: (connectionId: string) => void;

  onRemoveConnection?: () => void;
}

export default function ProfileSidebar({
  userId,
  userPresence,
  onlineUsers = [],
  showActionButtons = false,
  existingConversations,
  pendingRequests,
  incomingRequestSenderIds,
  onChatAction,
  onCancelChatRequest,
  onAcceptChatRequest,

  conversation,
  timeLeft,
  sendingConnectionRequest,
  onBack,
  onClose,
  onEndChat,
  onSendConnectionRequest,
  onCancelConnectionRequest,

  onRemoveConnection,
}: ProfileSidebarProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showEndChatDialog, setShowEndChatDialog] = useState(false);
  const [showCancelRequestDialog, setShowCancelRequestDialog] = useState(false);
  const [showRemoveConnectionDialog, setShowRemoveConnectionDialog] =
    useState(false);
  const [showFullScreenDialog, setShowFullScreenDialog] = useState(false);
  const [optimisticRequestSent, setOptimisticRequestSent] = useState(false);
  const [downloadingResume, setDownloadingResume] = useState(false);
  const { fetchUserProfile } = useSubscriptionStore();
  const { user } = useAuthenticator();

  // Connection actions hook for removing connections
  const connectionActions = useConnectionActions({
    conversationId: conversation?.id || '',
    currentUserId: user?.userId || '',
    otherUserId: userId,
  });

  // Get real-time connection requests for this conversation
  const {
    pendingRequest,
    hasAcceptedConnection,
    isLoading: connectionRequestsLoading,
  } = useRealtimeConnectionRequests({
    conversationId: conversation?.id || '',
    enabled: !!conversation?.id,
  });

  // Handle optimistic connect button click
  const handleOptimisticConnect = async () => {
    if (!onSendConnectionRequest) return;

    // Immediately show optimistic state
    setOptimisticRequestSent(true);

    try {
      await onSendConnectionRequest();
    } catch (error) {
      console.error('Failed to send permanent request', error);
      // If request fails, reset optimistic state
      setOptimisticRequestSent(false);
    }
  };

  // Reset optimistic state when real pending request appears
  useEffect(() => {
    if (pendingRequest) {
      setOptimisticRequestSent(false);
    }
  }, [pendingRequest]);

  // Handle cancel connection request
  const handleCancelRequest = async () => {
    if (!pendingRequest?.id || !onCancelConnectionRequest) return;

    try {
      await onCancelConnectionRequest(pendingRequest.id);
      setShowCancelRequestDialog(false);
      // Reset optimistic state immediately for better UX
      setOptimisticRequestSent(false);
    } catch (error) {
      console.error('Failed to cancel connection request:', error);
    }
  };

  // Handle remove connection
  const handleRemoveConnection = async () => {
    if (!conversation?.id || !user?.userId) return;

    try {
      await connectionActions.removeConnection();
      setShowRemoveConnectionDialog(false);
      // Optionally call the parent's onRemoveConnection callback
      onRemoveConnection?.();
    } catch (error) {
      console.error('Failed to remove connection:', error);
    }
  };

  // Handle resume download
  const handleDownloadResume = async () => {
    if (!userProfile) return;

    setDownloadingResume(true);
    try {
      await generateMarkdownResume(userProfile, getUserDisplayName());
    } catch (error) {
      console.error('Failed to download resume:', error);
      // Could add a toast notification here for better UX
    } finally {
      setDownloadingResume(false);
    }
  };

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

  const isTrialConversation = () => {
    // All conversations are now permanent - no trial conversations exist
    return false;
  };

  const getTrialTimeLeft = () => {
    // If timeLeft is provided as prop, use it
    if (timeLeft && timeLeft !== 'Expired') {
      return timeLeft;
    }

    // All conversations are permanent - no trial time limits
    return null;
  };

  const renderActionButtons = () => {
    if (!showActionButtons || !existingConversations || !pendingRequests) {
      return null;
    }

    // All conversations are permanent - no ended chat timers needed

    return (
      <div className='flex items-center gap-3'>
        <button
          onClick={() => {
            if (incomingRequestSenderIds?.has(userId)) {
              onAcceptChatRequest?.(userId);
            } else if (pendingRequests.has(userId)) {
              onCancelChatRequest?.(userId);
            } else {
              onChatAction?.(userId);
            }
          }}
          className={`px-2 py-2 text-base font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
            incomingRequestSenderIds?.has(userId)
              ? 'bg-neutral-50 text-brand-600 border border-brand-500 hover:bg-neutral-100'
              : pendingRequests.has(userId)
                ? 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 border border-neutral-200'
                : existingConversations.has(userId)
                  ? 'bg-neutral-50 text-brand-600 border border-brand-500 hover:bg-neutral-100'
                  : 'bg-brand-500 text-white hover:bg-brand-600'
          }`}
        >
          {incomingRequestSenderIds?.has(userId) ? (
            <>
              <ConnectIcon className='w-4 h-4 text-brand-600' />
              <span className='text-base font-medium text-brand-600'>
                Accept
              </span>
            </>
          ) : pendingRequests.has(userId) ? (
            <>
              <UserCheck className='w-4 h-4 text-neutral-500' />
              <span className='text-base font-medium text-neutral-500'>
                Pending
              </span>
            </>
          ) : existingConversations.has(userId) ? (
            <>
              <MessageSquare className='w-4 h-4 text-brand-600' />
              <span className='text-base font-medium text-brand-600'>
                Message
              </span>
            </>
          ) : (
            <>
              <ConnectIcon className='w-4 h-4 text-white' />
              <span className='text-base font-medium text-white'>Connect</span>
            </>
          )}
        </button>
      </div>
    );
  };

  const isInChatContext = !!conversation;

  return (
    <div
      className={`bg-white rounded-2xl w-full h-full flex flex-col relative border border-neutral-200 p-2 sm:p-4 ${
        isInChatContext ? 'w-[330px] xl:w-[360px]' : ''
      }`}
    >
      {/* PDF Generation Overlay */}
      {downloadingResume && (
        <div className='fixed inset-0 bg-white flex items-center justify-center z-[9999]'>
          <div className='flex flex-col items-center'>
            <FileDown className='w-8 h-8 animate-pulse text-brand-600 mb-3' />
            <div className='text-lg'>Generating PDF. Please wait.</div>
          </div>
        </div>
      )}

      {/* Header with buttons */}
      <div className='pb-2 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          {/* Back Button - Only shows when onBack is provided */}
          {onBack && (
            <button
              onClick={onBack}
              className='flex items-center gap-2 text-neutral-500 hover:text-black transition-colors'
            >
              <ArrowLeft className='w-4 h-4' />
              <span className='text-base font-medium'>Back</span>
            </button>
          )}
        </div>

        <div className='flex items-center gap-2'>
          {/* In chat context, show minimal buttons */}
          {isInChatContext ? (
            <>
              {/* Collapse Button - Always visible when onClose is provided */}
              {onClose && (
                <button
                  onClick={onClose}
                  className='p-1.5 text-neutral-500 hover:text-black transition-colors rounded-lg hover:bg-neutral-100'
                  title='Collapse sidebar'
                >
                  <X className='w-[22px] h-[22px]' />
                </button>
              )}
            </>
          ) : (
            <>
              {/* Download Resume Button */}
              <button
                onClick={handleDownloadResume}
                disabled={downloadingResume || !userProfile}
                className='p-1.5 text-neutral-500 hover:text-brand-600 transition-colors rounded-lg hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50'
                title='Download resume as PDF'
              >
                <FileDown className='w-[18px] h-[18px]' />
              </button>

              {/* Full Screen Button */}
              <button
                onClick={() => setShowFullScreenDialog(true)}
                className='p-1.5 text-neutral-500 hover:text-black transition-colors rounded-lg hover:bg-neutral-100'
                title='Open in full view'
              >
                <Expand className='w-[18px] h-[18px]' />
              </button>

              {/* Collapse Button - Always visible when onClose is provided */}
              {onClose && (
                <button
                  onClick={onClose}
                  className='p-1.5 text-neutral-500 hover:text-black transition-colors rounded-lg hover:bg-neutral-100'
                  title='Collapse sidebar'
                >
                  <X className='w-[22px] h-[22px]' />
                </button>
              )}
            </>
          )}

          {/* Remove Connection Button - Only shows when onEndChat is provided */}
          {onEndChat && (
            <button
              onClick={() => setShowEndChatDialog(true)}
              className='text-sm text-neutral-500 hover:text-black transition-colors font-medium flex items-center gap-1.5'
            >
              <>
                <UserRoundMinus className='w-3.5 h-3.5' />
                Remove Connection
              </>
            </button>
          )}
        </div>
      </div>

      {/* Line Separator */}
      <div className='w-full h-px bg-neutral-200 mb-4 sm:mb-6'></div>

      {/* User Profile Header */}
      <div className='pb-1 flex justify-center'>
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
            <div className='font-semibold text-black text-lg flex items-center justify-center gap-2'>
              {getUserDisplayName()}
            </div>
            {/* Show trial chat expiration info when in sidebar context (not in chat) */}
            {!conversation && isTrialConversation() && getTrialTimeLeft() && (
              <div className='flex items-center justify-center gap-1 text-neutral-400 mt-0.5'>
                <ClockFading className='w-3.5 h-3.5 flex-shrink-0' />
                <span className='text-sm font-medium'>
                  Chat Expires in {getTrialTimeLeft()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Header Section - when in chat context */}
      {conversation && (
        <div className='px-4 pb-3'>
          {/* Connection Status - All conversations are now permanent connections */}
          <div className='flex items-center justify-center text-base text-neutral-500 mb-2'>
            <button
              onClick={() => setShowRemoveConnectionDialog(true)}
              className='flex items-center gap-2 px-2 py-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors'
            >
              <ConnectIcon className='w-4 h-4 text-brand-600' />
              <span className='font-medium'>Connected</span>
            </button>
          </div>

          {/* All conversations are permanent - no trial chat status needed */}
          {false && (
            <div className='mb-1 mt-1'>
              {/* Trial Chat Info with End Chat Icon - Centered */}
              <div className='text-center text-sm text-neutral-500 mb-2'>
                <div className='flex items-center justify-center gap-1 mb-1'>
                  <ClockFading className='w-3.5 h-3.5 text-neutral-400' />
                  <span className='font-medium'>
                    Connection Expires in{' '}
                    <span className='font-bold text-black text-base'>
                      {timeLeft}
                    </span>
                  </span>
                </div>
              </div>

              {/* Connect Button */}
              <div className='flex justify-center'>
                {hasAcceptedConnection ? (
                  <div className='px-2 py-2 text-base font-medium rounded-lg flex items-center justify-center gap-2 text-neutral-500'>
                    <svg
                      className='w-4 h-4'
                      viewBox='30 30 160 160'
                      xmlns='http://www.w3.org/2000/svg'
                    >
                      <circle cx='110' cy='110' r='80' fill='#D9D9D9' />
                      <circle cx='75' cy='110' r='35' fill='#0099fc' />
                      <circle cx='145' cy='110' r='35' fill='#0099fc' />
                    </svg>
                    <span>Connected</span>
                  </div>
                ) : pendingRequest || optimisticRequestSent ? (
                  <button
                    onClick={() => setShowCancelRequestDialog(true)}
                    disabled={optimisticRequestSent} // Disable if optimistic (no real request to cancel yet)
                    className='px-2 py-2 text-base font-medium rounded-lg flex items-center justify-center gap-2 bg-neutral-100 text-neutral-500 hover:bg-neutral-200 border border-neutral-200 transition-colors disabled:cursor-not-allowed disabled:hover:bg-neutral-100'
                  >
                    <UserCheck className='w-4 h-4 text-neutral-500' />
                    <span className='font-medium'>Pending</span>
                  </button>
                ) : (
                  <Tooltip
                    content='Send permanent connection request'
                    position='bottom'
                  >
                    <button
                      onClick={handleOptimisticConnect}
                      disabled={
                        sendingConnectionRequest || connectionRequestsLoading
                      }
                      className='px-2 py-2 text-base font-medium rounded-lg transition-colors flex items-center justify-center gap-2 bg-brand-500 text-white hover:bg-brand-600 disabled:bg-brand-500 disabled:cursor-not-allowed'
                    >
                      <UserPlus className='w-4 h-4 text-white' />
                      <span>Add Connection</span>
                    </button>
                  </Tooltip>
                )}
              </div>
            </div>
          )}

          {/* All conversations are now permanent - no ended chat status needed */}
        </div>
      )}

      {/* Action buttons section */}
      {showActionButtons && (
        <div className='px-4 pb-4 pt-1'>
          <div className='w-full flex justify-center'>
            {renderActionButtons()}
          </div>
        </div>
      )}

      {/* Professional Details */}
      <div className='flex-1 overflow-y-auto'>
        <div className='p-4 pb-6 pt-2'>
          {profileLoading ? (
            <ShimmerProvider>
              <ProfileDetails_Shimmer />
            </ShimmerProvider>
          ) : isInChatContext ? (
            /* Minimal details for chat context */
            <div className='space-y-3'>
              {userProfile?.jobRole && (
                <div>
                  <h3 className='text-base font-medium text-neutral-900 mb-1'>
                    Role
                  </h3>
                  <p className='text-base text-neutral-600'>
                    {userProfile.jobRole}
                  </p>
                </div>
              )}
              {userProfile?.companyName && (
                <div>
                  <h3 className='text-base font-medium text-neutral-900 mb-1'>
                    Company
                  </h3>
                  <p className='text-base text-neutral-600'>
                    {userProfile.companyName}
                  </p>
                </div>
              )}
              {(userProfile?.city || userProfile?.country) && (
                <div>
                  <h3 className='text-base font-medium text-neutral-900 mb-1'>
                    Location
                  </h3>
                  <p className='text-base text-neutral-600'>
                    {[userProfile.city, userProfile.country]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              )}

              <div className='pt-2'>
                <button
                  onClick={() => setShowFullScreenDialog(true)}
                  className='text-base text-brand-600 hover:text-brand-700 font-medium bg-neutral-100 hover:bg-neutral-200 px-3 py-2 rounded-lg transition-colors'
                >
                  View Full Profile
                </button>
              </div>
            </div>
          ) : (
            <UserProfileContent
              userProfile={userProfile}
              loading={false}
              showContactInfo={false}
            />
          )}
        </div>
      </div>

      {/* End Chat Confirmation Dialog */}
      <DialogContainer
        isOpen={showEndChatDialog}
        onClose={() => setShowEndChatDialog(false)}
        maxWidth='sm'
      >
        <div className='p-4'>
          {/* All conversations are now permanent connections */}
          <>
            <h3 className='text-sm font-medium text-black text-center mb-3'>
              Remove {getUserDisplayName()} from your connections?
            </h3>
            <p className='text-base text-neutral-500 text-center mb-4'>
              This will permanently remove them from your professional network.
              You can reconnect later if needed.
            </p>
            <div className='flex gap-2'>
              <button
                onClick={() => setShowEndChatDialog(false)}
                className='flex-1 px-3 py-2 text-base font-medium text-black bg-neutral-100 rounded-lg hover:bg-neutral-200 focus:outline-none transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onRemoveConnection?.();
                  setShowEndChatDialog(false);
                }}
                className='flex-1 px-3 py-2 text-base font-medium text-b_red-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 focus:outline-none transition-colors'
              >
                Remove Connection
              </button>
            </div>
          </>
        </div>
      </DialogContainer>

      {/* Cancel Connection Request Dialog */}
      <CancelConnectionRequestDialog
        isOpen={showCancelRequestDialog}
        onClose={() => setShowCancelRequestDialog(false)}
        onConfirm={handleCancelRequest}
        isLoading={false} // We can add loading state later if needed
      />

      {/* Remove Connection Dialog */}
      <RemoveConnectionDialog
        isOpen={showRemoveConnectionDialog}
        onClose={() => setShowRemoveConnectionDialog(false)}
        onConfirm={handleRemoveConnection}
        isLoading={connectionActions?.isLoading || false}
        userName={getUserDisplayName()}
      />

      {/* Full Screen Profile Dialog */}
      {showFullScreenDialog && (
        <div className='fixed inset-0 z-50 overflow-y-auto'>
          {/* Background overlay */}
          <div
            className='fixed inset-0 bg-neutral-950/16'
            onClick={() => setShowFullScreenDialog(false)}
          />

          {/* Dialog container */}
          <div className='flex min-h-full items-center justify-center p-2'>
            <div className='relative w-[95vw] max-w-[832px] min-w-[640px] bg-white rounded-2xl max-h-[94vh] flex flex-col overflow-hidden shadow-2xl'>
              {/* Header */}
              <div className='px-6 py-4 border-b border-neutral-200 flex items-center justify-between'>
                <h2 className='text-lg font-semibold text-neutral-900'>
                  Profile Details
                </h2>
                <div className='flex items-center gap-2'>
                  {/* Download Resume Button */}
                  <button
                    onClick={handleDownloadResume}
                    disabled={downloadingResume || !userProfile}
                    className='p-2 text-neutral-500 hover:text-brand-600 transition-colors rounded-lg hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50'
                    title='Download resume as PDF'
                  >
                    <FileDown className='w-[18px] h-[18px]' />
                  </button>
                  <button
                    onClick={() => setShowFullScreenDialog(false)}
                    className='p-2 text-neutral-500 hover:text-black transition-colors rounded-lg hover:bg-neutral-100'
                    title='Close'
                  >
                    <X className='w-[22px] h-[22px]' />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className='flex-1 overflow-y-auto'>
                <div className='p-8 pb-10 pt-6'>
                  {/* User Profile Header */}
                  <div className='flex items-start gap-6 mb-6'>
                    <div className='flex-shrink-0'>
                      <UserAvatar
                        email={userProfile?.email}
                        userId={userId}
                        profilePictureUrl={userProfile?.profilePictureUrl}
                        hasProfilePicture={
                          userProfile?.hasProfilePicture || false
                        }
                        size='xl'
                        showStatus
                        status={getUserStatus()}
                      />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-start justify-between mb-3'>
                        <div>
                          <h1 className='text-xl font-bold text-neutral-900 mb-1'>
                            {getUserDisplayName()}
                          </h1>
                          {userProfile?.jobRole && (
                            <p className='text-base text-neutral-700 mb-1'>
                              {userProfile.jobRole}
                              {userProfile.companyName && (
                                <span className='text-neutral-500'>
                                  {' '}
                                  at {userProfile.companyName}
                                </span>
                              )}
                            </p>
                          )}
                          {userProfile?.city || userProfile?.country ? (
                            <p className='text-base text-neutral-500'>
                              {[userProfile.city, userProfile.country]
                                .filter(Boolean)
                                .join(', ')}
                            </p>
                          ) : null}
                        </div>
                        {showActionButtons && renderActionButtons()}
                      </div>
                    </div>
                  </div>

                  {/* Profile Content */}
                  {profileLoading ? (
                    <ShimmerProvider>
                      <ProfileDetails_Shimmer />
                    </ShimmerProvider>
                  ) : (
                    <UserProfileContent
                      userProfile={userProfile}
                      loading={false}
                      showContactInfo={false}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
