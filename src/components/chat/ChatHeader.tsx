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
    <div className='flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4'>
      <div className='flex items-center gap-3'>
        {/* Back Button */}
        <button
          onClick={onBack}
          className='text-gray-500 hover:text-gray-700 mr-2'
        >
          <svg
            className='w-6 h-6'
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

        {/* Custom UserAvatar */}
        <UserAvatar
          email={otherUserPresence?.email}
          userId={otherParticipantId}
          size='md'
          showStatus
          status={otherUserPresence?.status}
        />

        <div className='flex-1'>
          <div className='font-semibold text-gray-900'>
            {getUserDisplayName()}
          </div>
          <div className='flex items-center gap-2'>
            {!conversation.isConnected && timeLeft && timeLeft !== 'Expired' ? (
              <span className='text-sm text-gray-600'>
                Building connection · {timeLeft} remaining ·{' '}
                <button
                  onClick={onEndChat}
                  className='text-gray-500 hover:text-gray-700 underline transition-colors cursor-pointer'
                >
                  End Now
                </button>
              </span>
            ) : conversation.isConnected ? (
              <span className='text-sm text-green-600'>
                Connected - Chat forever!
              </span>
            ) : (
              <span className={`text-sm ${getPresenceDisplay().color}`}>
                {getPresenceDisplay().text}
              </span>
            )}
          </div>
        </div>

        {/* Connect Button - Right Side */}
        {!conversation.isConnected && !!timeLeft && timeLeft !== 'Expired' && (
          <button
            onClick={onSendConnectionRequest}
            disabled={sendingConnectionRequest}
            className='flex items-center gap-3 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <Image
              src='/connect-icon.svg'
              alt='Connect'
              width={20}
              height={20}
              className='flex-shrink-0'
            />
            <span className='text-base font-medium text-white'>
              {sendingConnectionRequest ? 'Connecting...' : 'Connect'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
