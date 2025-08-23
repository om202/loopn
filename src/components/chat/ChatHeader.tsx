'use client';

import { useState, useEffect, useCallback } from 'react';
import { Info, Clock } from 'lucide-react';
import Image from 'next/image';

import type { Schema } from '../../../amplify/data/resource';
import UserAvatar from '../UserAvatar';
import TrialChatInfoDialog from '../TrialChatInfoDialog';
import DialogContainer from '../DialogContainer';
import { formatPresenceTime } from '../../lib/presence-utils';
import { useUserProfile } from '../../hooks/useUserProfile';

type Conversation = Schema['Conversation']['type'];
type UserPresence = Schema['UserPresence']['type'];

interface ChatHeaderProps {
  conversation: Conversation;
  otherParticipantId: string;
  otherUserPresence: UserPresence | null;
  timeLeft: string;
  sendingConnectionRequest: boolean;
  onEndChat: () => void;
  onSendConnectionRequest: () => void;
  onReconnect: () => void;
  onBack: () => void;
}

const getDisplayName = (
  userProfile?: { fullName?: string | null; email?: string | null } | null,
  userId?: string
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
  return userId ? `User ${userId.slice(-4)}` : 'Unknown User';
};

export default function ChatHeader({
  conversation,
  otherParticipantId,
  otherUserPresence,
  timeLeft,
  sendingConnectionRequest,
  onEndChat,
  onSendConnectionRequest,
  onReconnect,
  onBack,
}: ChatHeaderProps) {
  const [showTrialInfoDialog, setShowTrialInfoDialog] = useState(false);
  const [showEndChatDialog, setShowEndChatDialog] = useState(false);
  const [showChatEndedInfoDialog, setShowChatEndedInfoDialog] = useState(false);
  const [reconnectionTime, setReconnectionTime] = useState<string | null>(null);
  // Use optimized profile hook with caching instead of local state and API calls
  const { profile: userProfile } = useUserProfile(otherParticipantId);

  const getUserDisplayName = () => {
    return getDisplayName(userProfile, otherParticipantId);
  };

  const getReconnectionTimeLeft = useCallback(() => {
    if (!conversation.endedAt) return null;

    const endedDate = new Date(conversation.endedAt);
    // TODO: when deploying change to 2 weeks (14 * 24 * 60 * 60 * 1000)
    const canReconnectAt = new Date(endedDate.getTime() + 3 * 60 * 1000); // 3 minutes for testing
    const now = new Date();
    const timeLeft = canReconnectAt.getTime() - now.getTime();

    if (timeLeft <= 0) return 'Can reconnect now';

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    if (days > 0) {
      return `Reconnection Available - ${days}d ${hours}h`;
    }
    if (hours > 0) {
      return `Reconnection Available - ${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `Reconnection Available - ${minutes}m ${seconds}s`;
    }
    return `Reconnection Available - ${seconds}s`;
  }, [conversation.endedAt]);

  // Update reconnection time with lazy updates for better performance
  useEffect(() => {
    if (conversation.chatStatus === 'ENDED' && conversation.endedAt) {
      const updateTime = () => {
        setReconnectionTime(getReconnectionTimeLeft());
      };

      // Update immediately
      updateTime();

      // Update every 10 seconds for lazy timer
      const interval = setInterval(updateTime, 10000);

      return () => clearInterval(interval);
    } else {
      setReconnectionTime(null);
    }
  }, [conversation.chatStatus, conversation.endedAt, getReconnectionTimeLeft]);

  return (
    <div
      className='flex-shrink-0 bg-white border-b border-gray-200 relative z-10'
      style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)' }}
    >
      <div className='w-full px-3 sm:px-4 lg:px-6'>
        <div className='py-2 sm:py-3'>
          <div className='flex items-center gap-2 sm:gap-3'>
            {/* Back Button */}
            <button
              onClick={onBack}
              className='p-1.5 sm:p-2 -ml-1 sm:-ml-2 text-neutral-500 hover:text-neutral-950 hover:bg-stone-100 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2'
            >
              <svg
                className='w-4 h-4 sm:w-5 sm:h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M15 19l-7-7 7-7'
                />
              </svg>
            </button>

            {/* User Avatar */}
            <UserAvatar
              email={userProfile?.email}
              userId={otherParticipantId}
              profilePictureUrl={userProfile?.profilePictureUrl}
              hasProfilePicture={userProfile?.hasProfilePicture || false}
              size='md'
              showStatus
              status={
                otherUserPresence?.status === 'ONLINE' ||
                otherUserPresence?.status === 'BUSY'
                  ? otherUserPresence.status
                  : otherUserPresence?.lastSeen &&
                      formatPresenceTime(otherUserPresence.lastSeen) ===
                        'Recently active'
                    ? 'RECENTLY_ACTIVE'
                    : 'OFFLINE'
              }
            />

            <div className='flex-1 min-w-0'>
              <h1 className='text-sm sm:text-base font-medium text-neutral-950 truncate no-email-detection'>
                {getUserDisplayName()}
              </h1>

              {/* Profession */}
              {userProfile?.jobRole && (
                <div className='text-sm sm:text-sm text-neutral-500 mb-1 truncate'>
                  {userProfile.jobRole}
                </div>
              )}

              {/* Connected Status */}
              {conversation.isConnected && (
                <div className='flex items-center text-sm sm:text-sm text-b_green-500 mb-1'>
                  <svg
                    className='w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 flex-shrink-0'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                  <span className='hidden sm:inline'>
                    Connected - Chat forever!
                  </span>
                  <span className='sm:hidden'>Connected</span>
                </div>
              )}
            </div>

            {/* Trial Chat Status and Actions - Right Side */}
            {!conversation.isConnected && (
              <>
                {/* Chat Ended State */}
                {conversation.chatStatus === 'ENDED' && (
                  <div className='flex items-center gap-2 sm:gap-3 md:gap-4'>
                    <div className='flex items-center gap-1 sm:gap-2 text-sm sm:text-sm text-neutral-950'>
                      <button
                        onClick={() => setShowChatEndedInfoDialog(true)}
                        className='flex items-center gap-1 text-neutral-500 hover:text-neutral-950 transition-colors p-1 rounded-full hover:bg-stone-100 flex-shrink-0'
                        title='Learn about ended chats'
                      >
                        <Info className='w-3 sm:w-4 h-3 sm:h-4' />
                      </button>
                      <span className='font-medium text-neutral-950 whitespace-nowrap'>
                        <span className='hidden sm:inline'>Chat Ended</span>
                        <span className='sm:hidden'>Ended</span>
                      </span>
                      {reconnectionTime && (
                        <span
                          className={`text-sm sm:text-sm ${
                            reconnectionTime === 'Can reconnect now'
                              ? 'text-neutral-500 font-medium'
                              : 'text-neutral-500'
                          } hidden md:inline`}
                        >
                          {reconnectionTime}
                        </span>
                      )}
                    </div>

                    {/* Show Reconnect button when restriction period ends */}
                    {reconnectionTime === 'Can reconnect now' && (
                      <>
                        {/* Line Separator - hidden on small screens */}
                        <div className='w-px h-4 sm:h-6 bg-stone-100 hidden sm:block'></div>

                        {/* Reconnect Button */}
                        <button
                          onClick={onReconnect}
                          className='flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3 lg:px-4 py-2 sm:py-2 bg-stone-1000 hover:bg-stone-1000 text-white rounded-lg shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-1000 focus:ring-offset-2 flex-shrink-0'
                        >
                          <Image
                            src='/connect-icon.svg'
                            alt='Reconnect'
                            width={16}
                            height={16}
                            className='flex-shrink-0 sm:w-4 sm:h-4 lg:w-[18px] lg:h-[18px]'
                          />
                          <span className='text-sm sm:text-sm lg:text-base font-medium whitespace-nowrap'>
                            Reconnect
                          </span>
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Active Trial Chat Controls */}
                {conversation.chatStatus === 'ACTIVE' &&
                  !!timeLeft &&
                  timeLeft !== 'Expired' && (
                    <div className='flex items-center gap-1 sm:gap-2 text-sm sm:text-sm'>
                      <div className='flex items-center gap-1 sm:gap-2 text-neutral-500 mr-1 sm:mr-2'>
                        <button
                          onClick={() => setShowTrialInfoDialog(true)}
                          className='flex items-center gap-1 hover:bg-stone-100 rounded-full p-1 transition-colors'
                          title='Learn about trial chat period'
                        >
                          <Clock className='w-4 h-4 text-neutral-500 sm:hidden flex-shrink-0' />
                          <Clock className='w-3 sm:w-4 h-3 sm:h-4 text-brand-600 hidden sm:block' />
                          <span className='font-medium hidden sm:inline'>
                            Trial Chat
                          </span>
                        </button>
                        <span className='text-neutral-950 text-sm font-bold whitespace-nowrap'>
                          {timeLeft}
                        </span>
                      </div>

                      {/* Line Separator - hidden on small screens */}
                      <div className='w-0.5 h-6 sm:h-8 bg-stone-100 mr-1 sm:mr-2 hidden sm:block'></div>

                      {/* Connect Button */}
                      <button
                        onClick={onSendConnectionRequest}
                        disabled={sendingConnectionRequest}
                        className='px-3 py-2 text-sm font-medium rounded-xl border transition-colors flex items-center justify-center gap-1 bg-brand-50 text-brand-600 border-brand-200 hover:bg-brand-200 hover:border-brand-400 disabled:bg-brand-50 disabled:cursor-not-allowed'
                      >
                        <svg
                          width='16'
                          height='16'
                          viewBox='30 30 160 160'
                          className='w-4 h-4 flex-shrink-0'
                          aria-hidden='true'
                        >
                          <circle cx='75' cy='110' r='35' fill='currentColor' />
                          <circle
                            cx='145'
                            cy='110'
                            r='35'
                            fill='currentColor'
                          />
                        </svg>
                        <span className='text-sm font-medium'>
                          {sendingConnectionRequest
                            ? 'Connecting...'
                            : 'Connect'}
                        </span>
                      </button>
                    </div>
                  )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Trial Chat Info Dialog */}
      <TrialChatInfoDialog
        isOpen={showTrialInfoDialog}
        onClose={() => setShowTrialInfoDialog(false)}
        onEndChat={onEndChat}
      />

      {/* End Chat Confirmation Dialog */}
      <DialogContainer
        isOpen={showEndChatDialog}
        onClose={() => setShowEndChatDialog(false)}
        maxWidth='xs'
      >
        <div className='p-4'>
          <h3 className='text-lg font-medium text-neutral-950 text-center mb-3'>
            End trial chat?
          </h3>
          <p className='text-sm text-neutral-950 text-center mb-4'>
            This will immediately end the chat. You won&apos;t be able to send
            more messages, but chat history will remain accessible until the
            trial period expires.
          </p>
          <div className='flex gap-2'>
            <button
              onClick={() => setShowEndChatDialog(false)}
              className='flex-1 px-3 py-2 text-base font-medium text-neutral-950 bg-stone-100 rounded-lg hover:bg-stone-100 focus:outline-none transition-colors'
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onEndChat();
                setShowEndChatDialog(false);
              }}
              className='flex-1 px-3 py-2 text-base font-medium text-b_red-600 bg-stone-100 rounded-lg hover:bg-stone-200 focus:outline-none transition-colors'
            >
              End Chat
            </button>
          </div>
        </div>
      </DialogContainer>

      {/* Chat Ended Info Dialog */}
      <DialogContainer
        isOpen={showChatEndedInfoDialog}
        onClose={() => setShowChatEndedInfoDialog(false)}
        maxWidth='md'
      >
        <div className='p-6'>
          <h3 className='text-lg font-semibold text-neutral-950 mb-4'>Chat Ended</h3>

          <div className='text-base text-neutral-950 space-y-3'>
            <p>
              <strong>What happened?</strong>
              <br />
              This trial chat was ended by one of the participants before the
              7-day period expired.
            </p>

            <p>
              <strong>What this means:</strong>
              <br />
              • No new messages can be sent
              <br />
              • You can still view the conversation history
              <br />
              • Chat history is permanently saved and never deleted
              <br /> • You can send a new chat request after a 3-minute waiting
              period (testing mode)
            </p>

            <p>
              <strong>Next steps:</strong>
              <br />
              • Review your conversation history anytime you want
              <br /> • You can send a new chat request after a 3-minute waiting
              period (testing mode)
            </p>

            <p className='text-neutral-950'>
              💡 <strong>Note:</strong> Ending a chat early helps both parties
              move on respectfully when the conversation isn&apos;t working out.
            </p>
          </div>

          <div className='mt-6'>
            <button
              onClick={() => setShowChatEndedInfoDialog(false)}
              className='w-full px-4 py-2 text-base font-medium text-white bg-stone-1000 rounded-lg hover:bg-stone-1000 focus:outline-none transition-colors'
            >
              Got it
            </button>
          </div>
        </div>
      </DialogContainer>
    </div>
  );
}
