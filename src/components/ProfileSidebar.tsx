'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  ArrowLeft,
  Info,
  UserX,
  Plus,
  MessageCircle,
  Briefcase,
  Building2,
  Factory,
  GraduationCap,
  User,
  Target,
  Heart,
} from 'lucide-react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import Image from 'next/image';
import UserAvatar from './UserAvatar';
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
  // Chat-specific props
  conversation?: Conversation;
  timeLeft?: string;
  sendingConnectionRequest?: boolean;
  onBack?: () => void;
  onEndChat?: () => void;
  onSendConnectionRequest?: () => void;
  onCancelConnectionRequest?: (connectionId: string) => void;
  onReconnect?: () => void;
  onRemoveConnection?: () => void;
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
  conversation,
  timeLeft,
  sendingConnectionRequest,
  onBack,
  onEndChat,
  onSendConnectionRequest,
  onCancelConnectionRequest,
  onReconnect,
  onRemoveConnection,
}: ProfileSidebarProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showEndChatDialog, setShowEndChatDialog] = useState(false);
  const [showCancelRequestDialog, setShowCancelRequestDialog] = useState(false);
  const [showRemoveConnectionDialog, setShowRemoveConnectionDialog] =
    useState(false);
  const [optimisticRequestSent, setOptimisticRequestSent] = useState(false);
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
    return (
      existingConversations &&
      existingConversations.has(userId) &&
      !existingConversations.get(userId)?.isConnected &&
      existingConversations.get(userId)?.chatStatus === 'ACTIVE'
    );
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
        <div className='text-base text-center p-3 bg-stone-100 rounded-lg'>
          <div className='text-neutral-500 mb-1'>Reconnect in</div>
          <div className='text-neutral-500 flex items-center justify-center gap-1'>
            <Clock className='w-3 h-3' />
            <span className='font-medium'>{timeRemaining}</span>
          </div>
        </div>
      );
    }

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
          className={`px-3 py-1.5 text-base font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            pendingRequests.has(userId)
              ? 'text-neutral-500 hover:bg-stone-100'
              : 'bg-brand-50 text-brand-600 hover:bg-brand-50'
          }`}
        >
          {pendingRequests.has(userId) ? (
            <>
              <Clock className='w-4 h-4 text-neutral-500' />
              <span className='text-neutral-500 text-base font-medium'>
                Cancel Request
              </span>
            </>
          ) : existingConversations.has(userId) ? (
            existingConversations.get(userId)?.chatStatus === 'ENDED' ? (
              canUserReconnect && canUserReconnect(userId) ? (
                <>
                  <Plus className='w-4 h-4 stroke-[2]' />
                  <span className='text-base font-medium'>Connect</span>
                </>
              ) : (
                <>
                  <MessageCircle className='w-4 h-4 stroke-[2]' />
                  <span className='text-base font-medium'>View Chat</span>
                </>
              )
            ) : (
              <>
                <MessageCircle className='w-4 h-4 stroke-[2]' />
                <span className='text-base font-medium'>Message</span>
              </>
            )
          ) : (
            <>
              <Plus className='w-4 h-4 stroke-[2]' />
              <span className='text-base font-medium'>Connect</span>
            </>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className='bg-white rounded-2xl shadow-md w-full h-full flex flex-col relative'>
      {/* Back Button - Top of sidebar */}
      {onBack && (
        <div className='p-4 pb-2 border-b border-gray-200 flex items-center justify-between'>
          <button
            onClick={onBack}
            className='flex items-center gap-2 text-neutral-500 hover:text-neutral-950 transition-colors'
          >
            <ArrowLeft className='w-4 h-4' />
            <span className='text-base font-medium'>Back</span>
          </button>

          {/* Remove Connection Button - Top Right */}
          {onEndChat && (
            <button
              onClick={() => setShowEndChatDialog(true)}
              className='text-base text-neutral-500 hover:text-neutral-950 transition-colors font-medium flex items-center gap-2'
            >
              <UserX className='w-4 h-4' />
              Remove
            </button>
          )}
        </div>
      )}

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
          <div className='mt-1'>
            <div className='mb-0'>
              <div className='font-bold text-neutral-950 text-lg flex items-center justify-center gap-2'>
                {getUserDisplayName()}
                {isTrialConversation() && (
                  <Tooltip content='Trial Chat' position='bottom'>
                    <Clock className='w-4 h-4 text-neutral-500' />
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Header Section - when in chat context */}
      {conversation && (
        <div className='px-6 pb-4 border-b border-gray-200'>
          {/* Connection Status */}
          {conversation.isConnected && (
            <div className='flex items-center justify-center text-base text-neutral-500 mb-3'>
              <button
                onClick={() => setShowRemoveConnectionDialog(true)}
                className='flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-stone-100 transition-colors'
              >
                <svg
                  className='w-4 h-4'
                  viewBox='30 30 160 160'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <circle cx='110' cy='110' r='80' fill='#D9D9D9' />
                  <circle cx='75' cy='110' r='35' fill='#0099fc' />
                  <circle cx='145' cy='110' r='35' fill='#0099fc' />
                </svg>
                <span className='font-medium'>Connected</span>
              </button>
            </div>
          )}

          {/* Trial Chat Status */}
          {!conversation.isConnected &&
            conversation.chatStatus === 'ACTIVE' &&
            timeLeft &&
            timeLeft !== 'Expired' && (
              <div className='mb-1 mt-1'>
                {/* Trial Chat Info with End Chat Icon - Centered */}
                <div className='text-center text-sm text-neutral-500 mb-3'>
                  <span className='font-medium'>
                    Connection Expires in{' '}
                    <span className='font-bold text-neutral-950 text-sm'>{timeLeft}</span>
                  </span>
                </div>

                {/* Connect Button */}
                <div className='flex justify-center mb-0'>
                  {hasAcceptedConnection ? (
                    <div className='px-6 py-2 text-base font-medium rounded-lg flex items-center justify-center gap-2 text-neutral-500'>
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
                      className='px-6 py-2 text-base font-medium rounded-lg flex items-center justify-center gap-2 text-neutral-500 hover:bg-stone-100 transition-colors disabled:cursor-not-allowed disabled:hover:bg-transparent'
                    >
                      <span>Request Sent</span>
                    </button>
                  ) : (
                    <Tooltip
                      content='Add to your professional network'
                      position='bottom'
                    >
                      <button
                        onClick={handleOptimisticConnect}
                        disabled={
                          sendingConnectionRequest || connectionRequestsLoading
                        }
                        className='px-6 py-2 text-base font-medium rounded-lg transition-colors flex items-center justify-center gap-2 bg-brand-50 text-brand-600 hover:bg-brand-50 disabled:bg-brand-50 disabled:cursor-not-allowed'
                      >
                        <span>Add to Network</span>
                      </button>
                    </Tooltip>
                  )}
                </div>
              </div>
            )}

          {/* Chat Ended Status */}
          {conversation.chatStatus === 'ENDED' && (
            <div className='mb-2'>
              <div className='flex items-center gap-2 text-base text-neutral-500 mb-2'>
                <Info className='w-4 h-4' />
                <span className='font-medium text-neutral-950'>Chat Ended</span>
              </div>

              {/* Reconnect Button - if available */}
              {onReconnect && (
                <button
                  onClick={onReconnect}
                  className='w-full px-4 py-2 text-base font-medium rounded-lg bg-stone-1000 hover:bg-stone-600 text-white transition-colors flex items-center justify-center gap-2'
                >
                  <Image
                    src='/connect-icon.svg'
                    alt='Reconnect'
                    width={16}
                    height={16}
                  />
                  <span>Reconnect</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

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
        <div className='px-6 pb-8 pt-3'>
          {profileLoading ? (
            <ShimmerProvider>
              <ProfileDetails_Shimmer />
            </ShimmerProvider>
          ) : userProfile ? (
            <div>
              {/* Professional Info Section */}
              {(userProfile.jobRole ||
                userProfile.companyName ||
                userProfile.industry ||
                userProfile.yearsOfExperience !== null ||
                userProfile.education ||
                userProfile.about ||
                (userProfile.skills && userProfile.skills.length > 0) ||
                (userProfile.interests && userProfile.interests.length > 0)) && (
                <div className='pb-6'>
                  <h4 className='text-sm font-semibold text-neutral-500 mb-4'>
                    Profile Details
                  </h4>
                  <div className='divide-y divide-gray-100'>
                    {userProfile.jobRole && (
                      <div className='py-3'>
                        <dt className='text-sm font-medium text-neutral-500 mb-1.5 flex items-center gap-1'>
                          <User className='w-3.5 h-3.5' />
                          Role
                        </dt>
                        <dd className='text-base text-neutral-950'>
                          {userProfile.jobRole}
                        </dd>
                      </div>
                    )}
                    {userProfile.companyName && (
                      <div className='py-3'>
                        <dt className='text-sm font-medium text-neutral-500 mb-1.5 flex items-center gap-1'>
                          <Building2 className='w-3.5 h-3.5' />
                          Company
                        </dt>
                        <dd className='text-base text-neutral-950'>
                          {userProfile.companyName}
                        </dd>
                      </div>
                    )}
                    {userProfile.industry && (
                      <div className='py-3'>
                        <dt className='text-sm font-medium text-neutral-500 mb-1.5 flex items-center gap-1'>
                          <Factory className='w-3.5 h-3.5' />
                          Industry
                        </dt>
                        <dd className='text-base text-neutral-950'>
                          {userProfile.industry}
                        </dd>
                      </div>
                    )}
                    {userProfile.yearsOfExperience !== null &&
                      userProfile.yearsOfExperience !== undefined && (
                        <div className='py-3'>
                          <dt className='text-sm font-medium text-neutral-500 mb-1.5 flex items-center gap-1'>
                            <Clock className='w-3.5 h-3.5' />
                            Experience
                          </dt>
                          <dd className='text-base text-neutral-950'>
                            {userProfile.yearsOfExperience} years
                          </dd>
                        </div>
                      )}
                    {userProfile.education && (
                      <div className='py-3'>
                        <dt className='text-sm font-medium text-neutral-500 mb-1.5 flex items-center gap-1'>
                          <GraduationCap className='w-3.5 h-3.5' />
                          Education
                        </dt>
                        <dd className='text-base text-neutral-950'>
                          {userProfile.education}
                        </dd>
                      </div>
                    )}
                    {userProfile.about && (
                      <div className='py-3'>
                        <dt className='text-sm font-medium text-neutral-500 mb-1.5 flex items-center gap-1'>
                          <Info className='w-3.5 h-3.5' />
                          About
                        </dt>
                        <dd className='text-base text-neutral-950'>
                          {userProfile.about}
                        </dd>
                      </div>
                    )}
                    {userProfile.skills && userProfile.skills.length > 0 && (
                      <div className='py-3'>
                        <dt className='text-sm font-medium text-neutral-500 mb-1.5 flex items-center gap-1'>
                          <Target className='w-3.5 h-3.5' />
                          Skills
                        </dt>
                        <dd className='flex flex-wrap gap-2'>
                          {userProfile.skills.map((skill, index) => (
                            <span
                              key={index}
                              className='px-3 py-1.5 text-base bg-transparent text-neutral-950 border border-gray-200 rounded-lg font-medium'
                            >
                              {skill}
                            </span>
                          ))}
                        </dd>
                      </div>
                    )}
                    {userProfile.interests && userProfile.interests.length > 0 && (
                      <div className='py-3'>
                        <dt className='text-sm font-medium text-neutral-500 mb-1.5 flex items-center gap-1'>
                          <Heart className='w-3.5 h-3.5' />
                          Interests
                        </dt>
                        <dd className='flex flex-wrap gap-2'>
                          {userProfile.interests.map((interest, index) => (
                            <span
                              key={index}
                              className='px-3 py-1.5 text-base bg-transparent text-neutral-950 border border-gray-200 rounded-lg font-medium'
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
            <div className='text-base text-neutral-500 text-center py-8'>
              No profile details available.
            </div>
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
          <h3 className='text-lg font-medium text-neutral-950 text-center mb-3'>
            Remove {getUserDisplayName()} from your connection?
          </h3>
          <p className='text-base text-neutral-500 text-center mb-4'>
            This will end your trial chat immediately. Chat history will remain
            accessible until the trial expires.
          </p>
          <div className='flex gap-2'>
            <button
              onClick={() => setShowEndChatDialog(false)}
              className='flex-1 px-3 py-2 text-base font-medium text-neutral-950 bg-stone-100 rounded-lg hover:bg-stone-200 focus:outline-none transition-colors'
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onEndChat?.();
                setShowEndChatDialog(false);
              }}
              className='flex-1 px-3 py-2 text-base font-medium text-b_red-600 bg-stone-100 rounded-lg hover:bg-stone-200 focus:outline-none transition-colors'
            >
              Remove Connection
            </button>
          </div>
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
    </div>
  );
}
