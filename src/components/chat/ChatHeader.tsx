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
                <div className='flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600'>
                  <span className='flex items-center'>
                    <svg className='w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 text-gray-500' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z' clipRule='evenodd' />
                    </svg>
                    <span className='hidden sm:inline'>Building connection</span>
                    <span className='sm:hidden'>Building</span>
                  </span>
                  <span className='text-gray-400 hidden sm:inline'>•</span>
                  <span className='font-medium text-blue-600 truncate max-w-20 sm:max-w-none'>{timeLeft}</span>
                  <span className='text-gray-400 hidden sm:inline'>•</span>
                  <button
                    onClick={onEndChat}
                    className='text-red-500 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded px-1 text-xs sm:text-sm'
                  >
                    <span className='hidden sm:inline'>End Now</span>
                    <span className='sm:hidden'>End</span>
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
