'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { Info, Clock } from 'lucide-react';

import type { Schema } from '../../../amplify/data/resource';
import UserAvatar from '../UserAvatar';
import TrialChatInfoDialog from '../TrialChatInfoDialog';
import DialogContainer from '../DialogContainer';
import { formatPresenceTime } from '../../lib/presence-utils';

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
  const getPresenceDisplay = () => {
    if (!otherUserPresence) {
      return {
        text: 'Unknown',
        color: 'text-slate-500',
      };
    }

    // If user is busy, show "Busy" (takes priority over online status)
    if (otherUserPresence.status === 'BUSY') {
      return {
        text: 'Busy',
        color: 'text-red-600',
      };
    }

    // If user is currently online, show "Online" in green
    if (otherUserPresence.status === 'ONLINE') {
      return {
        text: 'Online',
        color: 'text-green-500',
      };
    }

    // For offline users, calculate status bucket
    if (otherUserPresence.lastSeen) {
      const presenceText = formatPresenceTime(otherUserPresence.lastSeen);
      const color =
        presenceText === 'Recently active'
          ? 'text-slate-500'
          : 'text-slate-500';
      return {
        text: presenceText,
        color,
      };
    }

    // Fallback for users without lastSeen data
    return {
      text: 'Offline',
      color: 'text-slate-500',
    };
  };

  const getUserDisplayName = () => {
    return otherUserPresence?.email || `User ${otherParticipantId.slice(-4)}`;
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

  // Update reconnection time every second for real-time countdown
  useEffect(() => {
    if (conversation.chatStatus === 'ENDED' && conversation.endedAt) {
      const updateTime = () => {
        setReconnectionTime(getReconnectionTimeLeft());
      };

      // Update immediately
      updateTime();

      // Update every second
      const interval = setInterval(updateTime, 1000);

      return () => clearInterval(interval);
    } else {
      setReconnectionTime(null);
    }
  }, [conversation.chatStatus, conversation.endedAt, getReconnectionTimeLeft]);

  return (
    <div
      className='flex-shrink-0 bg-white border-b border-slate-200 relative z-10'
      style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)' }}
    >
      <div className='w-full px-3 sm:px-4 lg:px-6'>
        <div className='py-2 sm:py-3'>
          <div className='flex items-center gap-2 sm:gap-3'>
            {/* Back Button */}
            <button
              onClick={onBack}
              className='p-1.5 sm:p-2 -ml-1 sm:-ml-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2'
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
              email={otherUserPresence?.email}
              userId={otherParticipantId}
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
              <h1 className='text-sm sm:text-base font-medium text-slate-900 truncate no-email-detection'>
                {getUserDisplayName()}
              </h1>
              <div className='flex items-center gap-1 sm:gap-2 mt-0.5'>
                {conversation.isConnected ? (
                  <div className='flex items-center text-sm sm:text-sm text-green-500'>
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
                ) : (
                  <div className='flex items-center gap-1 sm:gap-2 text-sm sm:text-sm'>
                    <div
                      className={`flex items-center ${getPresenceDisplay().color}`}
                    >
                      {getPresenceDisplay().text}
                    </div>

                    {/* Trial Chat Text Only */}
                    {conversation.chatStatus === 'ACTIVE' &&
                      !!timeLeft &&
                      timeLeft !== 'Expired' && (
                        <>
                          <span className='text-slate-500 hidden sm:inline'>
                            •
                          </span>
                          <span className='text-blue-600 hidden sm:inline'>
                            Trial Chat
                          </span>
                        </>
                      )}
                  </div>
                )}
              </div>
            </div>

            {/* Trial Chat Status and Actions - Right Side */}
            {!conversation.isConnected && (
              <>
                {/* Chat Ended State */}
                {conversation.chatStatus === 'ENDED' && (
                  <div className='flex items-center gap-2 sm:gap-3 md:gap-4'>
                    <div className='flex items-center gap-1 sm:gap-2 text-sm sm:text-sm text-slate-900'>
                      <button
                        onClick={() => setShowChatEndedInfoDialog(true)}
                        className='flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors p-1 rounded-full hover:bg-slate-100 flex-shrink-0'
                        title='Learn about ended chats'
                      >
                        <Info className='w-3 sm:w-4 h-3 sm:h-4' />
                      </button>
                      <span className='font-medium text-slate-900 whitespace-nowrap'>
                        <span className='hidden sm:inline'>Chat Ended</span>
                        <span className='sm:hidden'>Ended</span>
                      </span>
                      {reconnectionTime && (
                        <span
                          className={`text-sm sm:text-sm ${
                            reconnectionTime === 'Can reconnect now'
                              ? 'text-slate-500 font-medium'
                              : 'text-slate-500'
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
                        <div className='w-px h-4 sm:h-6 bg-slate-100 hidden sm:block'></div>

                        {/* Reconnect Button */}
                        <button
                          onClick={onReconnect}
                          className='flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3 lg:px-4 py-2 sm:py-2 bg-slate-500 hover:bg-slate-500 text-white rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 flex-shrink-0'
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
                      <div className='flex items-center gap-1 sm:gap-2 text-slate-500 mr-1 sm:mr-2'>
                        <button
                          onClick={() => setShowTrialInfoDialog(true)}
                          className='flex items-center gap-1 hover:bg-slate-100 rounded-full p-1 transition-colors'
                          title='Learn about trial chat period'
                        >
                          <Clock className='w-4 h-4 text-slate-500 sm:hidden flex-shrink-0' />
                          <Info className='w-3 sm:w-4 h-3 sm:h-4 text-blue-600 hidden sm:block' />
                          <span className='font-medium hidden sm:inline'>
                            Time Left
                          </span>
                        </button>
                        <span className='text-slate-900 text-sm font-bold whitespace-nowrap'>
                          {timeLeft}
                        </span>
                      </div>

                      {/* Line Separator - hidden on small screens */}
                      <div className='w-0.5 h-6 sm:h-8 bg-slate-100 mr-1 sm:mr-2 hidden sm:block'></div>

                      {/* Connect Button */}
                      <button
                        onClick={onSendConnectionRequest}
                        disabled={sendingConnectionRequest}
                        className='flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3 lg:px-4 py-2 sm:py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed flex-shrink-0'
                      >
                        <Image
                          src='/connect-icon.svg'
                          alt='Connect'
                          width={16}
                          height={16}
                          className='flex-shrink-0 sm:w-4 sm:h-4 lg:w-[18px] lg:h-[18px]'
                        />
                        <span className='text-sm sm:text-sm lg:text-base font-medium whitespace-nowrap'>
                          <span className='hidden sm:inline'>
                            {sendingConnectionRequest
                              ? 'Connecting...'
                              : 'Connect'}
                          </span>
                          <span className='sm:hidden'>
                            {sendingConnectionRequest ? '...' : 'Connect'}
                          </span>
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
          <h3 className='text-lg font-medium text-slate-900 text-center mb-3'>
            End trial chat?
          </h3>
          <p className='text-sm text-slate-900 text-center mb-4'>
            This will immediately end the chat. You won&apos;t be able to send
            more messages, but chat history will remain accessible until the
            trial period expires.
          </p>
          <div className='flex gap-2'>
            <button
              onClick={() => setShowEndChatDialog(false)}
              className='flex-1 px-3 py-2 text-base font-medium text-slate-900 bg-slate-100 rounded-lg hover:bg-slate-100 focus:outline-none transition-colors'
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onEndChat();
                setShowEndChatDialog(false);
              }}
              className='flex-1 px-3 py-2 text-base font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none transition-colors'
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
          <h3 className='text-lg font-semibold text-slate-900 mb-4'>
            Chat Ended
          </h3>

          <div className='text-base text-slate-900 space-y-3'>
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

            <p className='text-slate-900'>
              💡 <strong>Note:</strong> Ending a chat early helps both parties
              move on respectfully when the conversation isn&apos;t working out.
            </p>
          </div>

          <div className='mt-6'>
            <button
              onClick={() => setShowChatEndedInfoDialog(false)}
              className='w-full px-4 py-2 text-base font-medium text-white bg-slate-500 rounded-lg hover:bg-slate-500 focus:outline-none transition-colors'
            >
              Got it
            </button>
          </div>
        </div>
      </DialogContainer>
    </div>
  );
}
