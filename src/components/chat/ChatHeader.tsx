'use client';

import Image from 'next/image';

import type { Schema } from '../../../amplify/data/resource';
import UserAvatar from '../UserAvatar';

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
  const getPresenceDisplay = () => {
    if (!otherUserPresence) {
      return { text: 'Unknown', color: 'text-gray-500', dot: 'bg-gray-400' };
    }

    const now = new Date();
    const lastSeen = otherUserPresence.lastSeen
      ? new Date(otherUserPresence.lastSeen)
      : null;
    const isRecent =
      lastSeen && now.getTime() - lastSeen.getTime() < 5 * 60 * 1000; // 5 minutes

    switch (otherUserPresence.status) {
      case 'ONLINE':
        return { text: 'Online', color: 'text-green-600', dot: 'bg-green-500' };
      case 'BUSY':
        return { text: 'Busy', color: 'text-red-600', dot: 'bg-red-500' };
      case 'OFFLINE':
      default:
        if (isRecent) {
          return {
            text: 'Recently active',
            color: 'text-yellow-600',
            dot: 'bg-yellow-500',
          };
        }
        return { text: 'Offline', color: 'text-gray-500', dot: 'bg-gray-400' };
    }
  };

  const getUserDisplayName = () => {
    return otherUserPresence?.email || `User ${otherParticipantId.slice(-4)}`;
  };

  return (
    <div className='flex-shrink-0 bg-white shadow-sm border-b border-gray-200'>
      <div className='px-3 sm:px-6 py-3 sm:py-4'>
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
            status={otherUserPresence?.status}
          />

          <div className='flex-1 min-w-0'>
            <h1 className='text-sm sm:text-base font-semibold text-gray-900 truncate no-email-detection'>
              {getUserDisplayName()}
            </h1>
            <div className='flex items-center gap-1 sm:gap-2 mt-0.5'>
              {!conversation.isConnected && timeLeft && timeLeft !== 'Expired' ? (
                <div className='flex items-center gap-1 sm:gap-2'>
                  <span className='text-xs sm:text-sm text-gray-600'>
                    <span className='hidden sm:inline'>Trial Chat</span>
                    <span className='sm:hidden'>Trial</span>
                  </span>
                  <span className='font-medium text-blue-600 text-xs sm:text-sm ml-1'>
                    {timeLeft}
                  </span>
                  <button
                    onClick={onEndChat}
                    className='inline-flex ml-1 items-center px-2 py-0 rounded-full bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 hover:border-red-300 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-red-500 focus:ring-offset-1'
                    style={{ fontSize: '12px' }}
                  >
                    <span className='hidden sm:inline'>End Now</span>
                    <span className='sm:hidden'>End Now</span>
                  </button>
                </div>
              ) : conversation.isConnected ? (
                <div className='flex items-center text-xs sm:text-sm text-green-600'>
                  <svg className='w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                  </svg>
                  <span className='hidden sm:inline'>Connected - Chat forever!</span>
                  <span className='sm:hidden'>Connected</span>
                </div>
              ) : (
                <div className={`flex items-center text-xs sm:text-sm ${getPresenceDisplay().color}`}>
                  <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1 sm:mr-2 ${getPresenceDisplay().dot}`}></span>
                  {getPresenceDisplay().text}
                </div>
              )}
            </div>
          </div>

          {/* Connect Button - Right Side */}
          {!conversation.isConnected && !!timeLeft && timeLeft !== 'Expired' && (
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
          )}
        </div>
      </div>
    </div>
  );
}
