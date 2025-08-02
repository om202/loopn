'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Info } from 'lucide-react';

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
  onBack,
}: ChatHeaderProps) {
  const [showTrialInfoDialog, setShowTrialInfoDialog] = useState(false);
  const [showEndChatDialog, setShowEndChatDialog] = useState(false);
  const getPresenceDisplay = () => {
    if (!otherUserPresence) {
      return {
        text: 'Unknown',
        color: 'text-gray-500',
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
        color: 'text-green-600',
      };
    }

    // For offline users, calculate status bucket
    if (otherUserPresence.lastSeen) {
      const presenceText = formatPresenceTime(otherUserPresence.lastSeen);
      const color =
        presenceText === 'Recently active' ? 'text-sky-500' : 'text-gray-500';
      return {
        text: presenceText,
        color,
      };
    }

    // Fallback for users without lastSeen data
    return {
      text: 'Offline',
      color: 'text-gray-500',
    };
  };

  const getUserDisplayName = () => {
    return otherUserPresence?.email || `User ${otherParticipantId.slice(-4)}`;
  };

  return (
    <div
      className='flex-shrink-0 bg-white border-b border-gray-200 relative z-10'
      style={{ filter: 'drop-shadow(0 12px 24px rgba(249, 250, 251, 1))' }}
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='py-2 sm:py-3'>
          <div className='flex items-center gap-2 sm:gap-3'>
            {/* Back Button */}
            <button
              onClick={onBack}
              className='p-1.5 sm:p-2 -ml-1 sm:-ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
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
              <h1 className='text-xs sm:text-sm font-medium text-black truncate no-email-detection'>
                {getUserDisplayName()}
              </h1>
              <div className='flex items-center gap-1 sm:gap-2 mt-0.5'>
                {conversation.isConnected ? (
                  <div className='flex items-center text-xs sm:text-sm text-green-600'>
                    <svg
                      className='w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1'
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
                  <div
                    className={`flex items-center text-xs sm:text-sm ${getPresenceDisplay().color}`}
                  >
                    {getPresenceDisplay().text}
                  </div>
                )}
              </div>
            </div>

            {/* Trial Chat Countdown and Connect Button - Right Side */}
            {!conversation.isConnected &&
              !!timeLeft &&
              timeLeft !== 'Expired' && (
                <div className='flex items-center gap-3 sm:gap-4 md:gap-6'>
                  <div className='flex items-center gap-2 text-xs sm:text-sm text-gray-600'>
                    <button
                      onClick={() => setShowTrialInfoDialog(true)}
                      className='flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-blue-50'
                      title='Learn about trial chat period'
                    >
                      <Info className='w-4 h-4' />
                    </button>
                    <span className='font-medium'>Trial Chat</span>
                    <span className='text-gray-500'>6d 1h</span>
                    <button
                      onClick={() => setShowEndChatDialog(true)}
                      className='text-red-500 hover:text-red-600 font-medium transition-colors border-b border-dotted border-red-300 hover:border-red-400'
                    >
                      End Now
                    </button>
                  </div>

                  {/* Line Separator */}
                  <div className='w-px h-6 bg-gray-300'></div>

                  {/* Connect Button */}
                  <button
                    onClick={onSendConnectionRequest}
                    disabled={sendingConnectionRequest}
                    className='flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed'
                  >
                    <Image
                      src='/connect-icon.svg'
                      alt='Connect'
                      width={16}
                      height={16}
                      className='flex-shrink-0 sm:w-[18px] sm:h-[18px]'
                    />
                    <span className='text-xs sm:text-sm font-medium'>
                      <span className='hidden sm:inline'>
                        {sendingConnectionRequest ? 'Connecting...' : 'Connect'}
                      </span>
                      <span className='sm:hidden'>
                        {sendingConnectionRequest ? '...' : 'Connect'}
                      </span>
                    </span>
                  </button>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Trial Chat Info Dialog */}
      <TrialChatInfoDialog
        isOpen={showTrialInfoDialog}
        onClose={() => setShowTrialInfoDialog(false)}
      />

      {/* End Chat Confirmation Dialog */}
      <DialogContainer
        isOpen={showEndChatDialog}
        onClose={() => setShowEndChatDialog(false)}
        maxWidth='xs'
      >
        <div className='p-4'>
          <h3 className='text-base font-medium text-gray-900 text-center mb-3'>
            End trial chat?
          </h3>
          <p className='text-sm text-gray-600 text-center mb-4'>
            This will immediately end the chat. You won&apos;t be able to send
            more messages, but chat history will remain accessible until the
            trial period expires.
          </p>
          <div className='flex gap-2'>
            <button
              onClick={() => setShowEndChatDialog(false)}
              className='flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none transition-colors'
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onEndChat();
                setShowEndChatDialog(false);
              }}
              className='flex-1 px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none transition-colors'
            >
              End Chat
            </button>
          </div>
        </div>
      </DialogContainer>
    </div>
  );
}
