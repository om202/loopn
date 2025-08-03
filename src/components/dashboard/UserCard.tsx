'use client';

import {
  MessageCircle,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

import type { Schema } from '../../../amplify/data/resource';
import { formatPresenceTime } from '../../lib/presence-utils';

import UserAvatar from '../UserAvatar';

type UserPresence = Schema['UserPresence']['type'];
type Conversation = Schema['Conversation']['type'];

interface UserCardProps {
  userPresence: UserPresence;
  onlineUsers: UserPresence[];
  existingConversations: Map<string, Conversation>;
  pendingRequests: Set<string>;
  onChatAction: (userId: string) => void;
  onCancelChatRequest: (userId: string) => void;
  canUserReconnect: (userId: string) => boolean;
  getReconnectTimeRemaining: (userId: string) => string | null;
}

const getDisplayName = (userPresence: UserPresence) => {
  if (userPresence.email) {
    return userPresence.email;
  }
  return `User${userPresence.userId.slice(-4)}`;
};

export default function UserCard({
  userPresence,
  onlineUsers,
  existingConversations,
  pendingRequests,
  onChatAction,
  onCancelChatRequest,
  canUserReconnect,
  getReconnectTimeRemaining,
}: UserCardProps) {
  const isOnline = onlineUsers.some(ou => ou.userId === userPresence.userId);

  return (
    <div
      key={userPresence.userId}
      className='bg-white rounded-2xl border border-gray-200 px-4 py-4 group hover:bg-gray-50 transition-all duration-200'
    >
      <div className='flex items-center gap-4'>
        <div className='flex-shrink-0'>
          <UserAvatar
            email={userPresence.email}
            userId={userPresence.userId}
            size='md'
            showStatus
            status={
              isOnline
                ? userPresence.status
                : userPresence.lastSeen &&
                    formatPresenceTime(userPresence.lastSeen) ===
                      'Recently active'
                  ? 'RECENTLY_ACTIVE'
                  : 'OFFLINE'
            }
          />
        </div>

        <div className='flex-1 min-w-0'>
          <div className='font-medium text-gray-900 text-base mb-1 line-clamp-2 no-email-detection break-words'>
            {getDisplayName(userPresence)}
          </div>
          <div
            className={`text-sm ${
              existingConversations.has(userPresence.userId) &&
              existingConversations.get(userPresence.userId)?.chatStatus ===
                'ENDED'
                ? canUserReconnect(userPresence.userId)
                  ? 'text-blue-600'
                  : 'text-orange-600'
                : isOnline
                  ? 'text-green-600'
                  : userPresence.lastSeen &&
                      formatPresenceTime(userPresence.lastSeen) ===
                        'Recently active'
                    ? 'text-sky-500'
                    : 'text-gray-600'
            }`}
          >
            {existingConversations.has(userPresence.userId) &&
            existingConversations.get(userPresence.userId)?.chatStatus ===
              'ENDED'
              ? 'Chat Trial Ended'
              : isOnline
                ? 'Online now'
                : userPresence.lastSeen
                  ? formatPresenceTime(userPresence.lastSeen)
                  : 'Offline'}
          </div>
        </div>

        <div className='flex-shrink-0'>
          {(() => {
            const conversation = existingConversations.get(
              userPresence.userId
            );
            const isEndedWithTimer =
              conversation?.chatStatus === 'ENDED' &&
              !canUserReconnect(userPresence.userId) &&
              getReconnectTimeRemaining(userPresence.userId);

            if (isEndedWithTimer) {
              const timeRemaining = getReconnectTimeRemaining(
                userPresence.userId
              );
              return (
                <div className='text-sm text-gray-500'>
                  Can reconnect in {timeRemaining}
                </div>
              );
            }

            return (
              <button
                onClick={() => {
                  if (pendingRequests.has(userPresence.userId)) {
                    onCancelChatRequest(userPresence.userId);
                  } else {
                    onChatAction(userPresence.userId);
                  }
                }}
                className='px-3 py-1.5 text-sm font-medium rounded-xl border transition-colors bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300 flex items-center gap-2'
              >
                {pendingRequests.has(userPresence.userId) ? (
                  <>
                    <Trash2 className='w-4 h-4 mr-1 text-red-600' />
                    <span className='text-red-600'>Cancel Chat Request</span>
                  </>
                ) : existingConversations.has(userPresence.userId) ? (
                  <>
                    <MessageCircle className='w-4 h-4 text-gray-600 mr-1' />
                    {existingConversations.get(userPresence.userId)
                      ?.chatStatus === 'ENDED'
                      ? canUserReconnect(userPresence.userId)
                        ? 'Send New Request'
                        : (() => {
                            const timeRemaining = getReconnectTimeRemaining(
                              userPresence.userId
                            );
                            return timeRemaining
                              ? `Can reconnect in ${timeRemaining}`
                              : 'View';
                          })()
                      : 'Chat'}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className='w-3 h-3 text-gray-600' />
                    Start
                  </>
                )}
              </button>
            );
          })()}
        </div>
      </div>
    </div>
  );
}