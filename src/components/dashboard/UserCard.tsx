'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, MessageCircle, Info } from 'lucide-react';

import type { Schema } from '../../../amplify/data/resource';
import { formatPresenceTime } from '../../lib/presence-utils';
import { UserProfileService } from '../../services/user-profile.service';

import DialogContainer from '../DialogContainer';
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
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [profileSummary, setProfileSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const isOnline = onlineUsers.some(ou => ou.userId === userPresence.userId);

  // Load profile summary when component mounts
  useEffect(() => {
    let mounted = true;

    const loadProfileSummary = async () => {
      setLoadingSummary(true);
      try {
        const summary = await UserProfileService.getProfileSummary(
          userPresence.userId
        );
        if (mounted) {
          setProfileSummary(summary);
        }
      } catch (error) {
        console.error('Error loading profile summary:', error);
      } finally {
        if (mounted) {
          setLoadingSummary(false);
        }
      }
    };

    loadProfileSummary();

    return () => {
      mounted = false;
    };
  }, [userPresence.userId]);

  return (
    <div
      key={userPresence.userId}
      className='bg-white rounded-2xl border border-slate-200 px-3 lg:px-4 py-3 lg:py-4 group transition-all duration-200'
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
            className={`text-sm lg:text-sm mb-2 ${
              existingConversations.has(userPresence.userId) &&
              existingConversations.get(userPresence.userId)?.chatStatus ===
                'ENDED'
                ? canUserReconnect(userPresence.userId)
                  ? 'text-blue-600'
                  : 'text-slate-500'
                : isOnline
                  ? 'text-green-500'
                  : userPresence.lastSeen &&
                      formatPresenceTime(userPresence.lastSeen) ===
                        'Recently active'
                    ? 'text-slate-500'
                    : 'text-slate-500'
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

        <div className='flex-shrink-0 flex items-center gap-2'>
          {/* Profile Summary Info Button */}
          {(loadingSummary || profileSummary) && (
            <button
              onClick={() => setShowProfileDialog(true)}
              className='px-2 lg:px-3 py-1.5 text-sm lg:text-sm font-medium rounded-xl border transition-colors bg-white text-slate-900 border-slate-200 hover:bg-slate-100 hover:border-slate-200 flex items-center gap-1 lg:gap-2 flex-shrink-0'
              disabled={loadingSummary}
            >
              <Info className='w-4 lg:w-4 h-4 lg:h-4 text-slate-900 flex-shrink-0' />
              <span className='hidden sm:inline'>Profile</span>
            </button>
          )}

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
                  <div className='text-slate-500'>Reconnect in</div>
                  <div className='text-slate-500 flex items-center justify-end gap-1'>
                    <Clock className='w-3 h-3 text-slate-500 hover:text-slate-900 cursor-pointer transition-colors' />
                    {timeRemaining}
                  </div>
                </div>
              );
            }

            return (
              <button
                onClick={() => {
                  if (pendingRequests.has(userPresence.userId)) {
                    setShowCancelDialog(true);
                  } else {
                    onChatAction(userPresence.userId);
                  }
                }}
                className='px-2 lg:px-3 py-1.5 text-sm lg:text-sm font-medium rounded-xl border transition-colors bg-white text-blue-600 border-slate-200 hover:bg-blue-100 hover:border-slate-200 flex items-center gap-1 lg:gap-2 flex-shrink-0'
              >
                {pendingRequests.has(userPresence.userId) ? (
                  <>
                    <span className='text-gray-600 text-sm sm:inline'>
                      Cancel Request
                    </span>
                  </>
                ) : existingConversations.has(userPresence.userId) ? (
                  <>
                    {existingConversations.get(userPresence.userId)
                      ?.chatStatus === 'ENDED' ? (
                      canUserReconnect(userPresence.userId) ? (
                        <>
                          <span className='hidden text-sm sm:inline'>
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
                              <div className='hidden sm:block'>
                                Reconnect in
                              </div>
                              <div className='sm:hidden'>Wait</div>
                              <div className='flex items-center justify-end gap-1'>
                                {timeRemaining}
                                <Clock
                                  className='w-4 h-4 text-slate-500 hover:text-slate-900 cursor-pointer transition-colors'
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
                      <>
                        <MessageCircle className='w-4 lg:w-4 h-4 lg:h-4 text-blue-600 flex-shrink-0' />
                        Chat
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className='w-4 lg:w-4 h-4 lg:h-4 text-slate-900 flex-shrink-0' />
                    Start
                  </>
                )}
              </button>
            );
          })()}
        </div>
      </div>

      {/* Profile Summary Dialog */}
      <DialogContainer
        isOpen={showProfileDialog}
        onClose={() => setShowProfileDialog(false)}
        maxWidth='md'
      >
        <div className='p-6'>
          <h3 className='text-lg font-medium text-slate-900 mb-4'>
            Profile Summary
          </h3>
          <div className='mb-4'>
            <div className='text-sm text-slate-500 mb-2'>
              {getDisplayName(userPresence)}
            </div>
            {loadingSummary ? (
              <div className='flex items-center gap-2 text-sm text-slate-500'>
                <div className='w-3 h-3 bg-slate-100 rounded-full animate-pulse'></div>
                <span>Loading profile summary...</span>
              </div>
            ) : profileSummary ? (
              <div className='text-sm text-slate-900 leading-relaxed bg-slate-100 rounded-lg p-4 border border-slate-200'>
                {profileSummary}
              </div>
            ) : (
              <div className='text-sm text-slate-500'>
                No profile summary available.
              </div>
            )}
          </div>
          <div className='flex'>
            <button
              onClick={() => setShowProfileDialog(false)}
              className='w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-slate-200 rounded-lg focus:outline-none transition-colors'
            >
              OK
            </button>
          </div>
        </div>
      </DialogContainer>

      {/* Cancel Request Confirmation Dialog */}
      <DialogContainer
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        maxWidth='xs'
      >
        <div className='p-4'>
          <h3 className='text-lg font-medium text-slate-900 text-center mb-3'>
            Cancel Chat Request?
          </h3>
          <p className='text-sm text-slate-900 text-center mb-4'>
            This will cancel your pending chat request to{' '}
            {getDisplayName(userPresence)}.
          </p>
          <div className='flex gap-2'>
            <button
              onClick={() => setShowCancelDialog(false)}
              className='flex-1 px-3 py-2 text-base font-medium text-slate-900 bg-slate-100 rounded-lg hover:bg-slate-100 focus:outline-none transition-colors'
            >
              Done
            </button>
            <button
              onClick={() => {
                onCancelChatRequest(userPresence.userId);
                setShowCancelDialog(false);
              }}
              className='flex-1 px-3 py-2 text-base font-medium text-white bg-red-600 rounded-lg hover:bg-red-600 focus:outline-none transition-colors'
            >
              Cancel
            </button>
          </div>
        </div>
      </DialogContainer>
    </div>
  );
}
