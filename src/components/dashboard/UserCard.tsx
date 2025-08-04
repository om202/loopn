'use client';

import { MessageCircle, CheckCircle2, Trash2, Clock } from 'lucide-react';

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
      className='bg-white rounded-2xl border border-slate-200 px-3 lg:px-4 py-3 lg:py-4 group hover:bg-slate-50 transition-all duration-200'
    >
      <div className='flex items-center gap-3 lg:gap-4'>
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
          <div className='font-medium text-slate-900 text-sm lg:text-base mb-1 truncate no-email-detection'>
            {getDisplayName(userPresence)}
          </div>
          <div
            className={`text-sm lg:text-sm ${
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
                    ? 'text-blue-600'
                    : 'text-slate-600'
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
            const conversation = existingConversations.get(userPresence.userId);
            const isEndedWithTimer =
              conversation?.chatStatus === 'ENDED' &&
              !canUserReconnect(userPresence.userId) &&
              getReconnectTimeRemaining(userPresence.userId);

            if (isEndedWithTimer) {
              const timeRemaining = getReconnectTimeRemaining(
                userPresence.userId
              );
              return (
                <div className='text-sm lg:text-sm text-right'>
                  <div className='text-slate-500'>Can connect</div>
                  <div className='text-slate-500 flex items-center justify-end gap-1'>
                    <Clock className='w-3 h-3 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors' />
                    {timeRemaining}
                  </div>
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
                className='px-2 lg:px-3 py-1.5 text-sm lg:text-sm font-medium rounded-xl border transition-colors bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 flex items-center gap-1 lg:gap-2 flex-shrink-0'
              >
                {pendingRequests.has(userPresence.userId) ? (
                  <>
                    <Trash2 className='w-4 lg:w-4 h-4 lg:h-4 text-red-600 flex-shrink-0' />
                    <span className='text-red-600 hidden sm:inline'>
                      Cancel Chat Request
                    </span>
                    <span className='text-red-600 sm:hidden'>Cancel</span>
                  </>
                ) : existingConversations.has(userPresence.userId) ? (
                  <>
                    <MessageCircle className='w-4 lg:w-4 h-4 lg:h-4 text-slate-600 flex-shrink-0' />
                    {existingConversations.get(userPresence.userId)
                      ?.chatStatus === 'ENDED' ? (
                      canUserReconnect(userPresence.userId) ? (
                        <>
                          <span className='hidden sm:inline'>
                            Send Chat Request
                          </span>
                          <span className='sm:hidden'>Request</span>
                        </>
                      ) : (
                        (() => {
                          const timeRemaining = getReconnectTimeRemaining(
                            userPresence.userId
                          );
                          return timeRemaining ? (
                            <div className='text-right'>
                              <div className='hidden sm:block'>Can connect</div>
                              <div className='sm:hidden'>Wait</div>
                              <div className='flex items-center justify-end gap-1'>
                                {timeRemaining}
                                <Clock
                                  className='w-4 h-4 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors'
                                  onClick={e => {
                                    e.stopPropagation();
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            'View'
                          );
                        })()
                      )
                    ) : (
                      'Chat'
                    )}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className='w-4 lg:w-4 h-4 lg:h-4 text-slate-600 flex-shrink-0' />
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
