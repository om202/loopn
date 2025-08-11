'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';

import { notificationService } from '../../services/notification.service';
import { UserProfileService } from '../../services/user-profile.service';
import UserAvatar from '../UserAvatar';
import type {
  UINotification,
  ChatRequestWithUser,
  MessageNotificationData,
} from './types';

interface NotificationItemProps {
  notification: UINotification;
  onNotificationClick: (notification: UINotification) => void;
  onRespondToRequest: (
    chatRequestId: string,
    status: 'ACCEPTED' | 'REJECTED',
    chatRequest: ChatRequestWithUser
  ) => void;
  onRemoveNotification: (notificationId: string) => void;
  decliningId: string | null;
  onError: (error: string) => void;
}

const getNotificationIcon = (type: string | null) => {
  if (!type) {
    return null;
  }
  switch (type) {
    case 'chat_request':
      return (
        <svg
          className='w-4 h-4 text-brand-500'
          fill='currentColor'
          viewBox='0 0 20 20'
        >
          <path
            fillRule='evenodd'
            d='M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z'
            clipRule='evenodd'
          />
        </svg>
      );
    case 'message':
      return (
        <svg
          className='w-4 h-4 text-zinc-500'
          fill='currentColor'
          viewBox='0 0 20 20'
        >
          <path
            fillRule='evenodd'
            d='M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z'
            clipRule='evenodd'
          />
        </svg>
      );
    case 'connection':
      return <CheckCircle2 className='w-6 h-6 text-b_green-500' />;
    case 'system':
      return (
        <svg
          className='w-4 h-4 text-zinc-500'
          fill='currentColor'
          viewBox='0 0 20 20'
        >
          <path
            fillRule='evenodd'
            d='M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z'
            clipRule='evenodd'
          />
        </svg>
      );
    default:
      return (
        <svg
          className='w-4 h-4 text-zinc-500'
          fill='currentColor'
          viewBox='0 0 20 20'
        >
          <path d='M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z' />
        </svg>
      );
  }
};

const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMinutes = Math.floor(
    (now.getTime() - time.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) {
    return 'Just now';
  }
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  if (diffInMinutes < 1440) {
    return `${Math.floor(diffInMinutes / 60)}h ago`;
  }
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
};

export default function NotificationItem({
  notification,
  onNotificationClick,
  onRespondToRequest,
  onRemoveNotification,
  decliningId,
  onError,
}: NotificationItemProps) {
  const { user } = useAuthenticator();
  const [userProfile, setUserProfile] = useState<{
    fullName?: string;
    email?: string;
    profilePictureUrl?: string;
    hasProfilePicture?: boolean;
  } | null>(null);

  const isClickable =
    notification.type === 'message' || notification.type === 'connection';

  // Load profile data for user avatar - similar to UserCard
  useEffect(() => {
    let mounted = true;

    const loadProfileData = async () => {
      // Only load for chat_request notifications where we need user profile data
      if (notification.type !== 'chat_request' || !notification.data || !('requesterId' in notification.data)) {
        return;
      }

      const chatRequestData = notification.data as ChatRequestWithUser;
      const userId = chatRequestData.requesterId;
      
      if (!userId) return;

      try {
        const profileResult = await new UserProfileService().getUserProfile(userId);
        
        if (mounted && profileResult.data) {
          setUserProfile({
            fullName: profileResult.data.fullName || undefined,
            email: profileResult.data.email || undefined,
            profilePictureUrl: profileResult.data.profilePictureUrl || undefined,
            hasProfilePicture: profileResult.data.hasProfilePicture || false,
          });
        }
      } catch (error) {
        console.error('Error loading profile data for notification:', error);
      }
    };

    loadProfileData();

    return () => {
      mounted = false;
    };
  }, [notification.type, notification.data]);

  return (
    <div
      key={notification.id}
      className='w-full bg-white border border-zinc-200 rounded-2xl px-3 py-3 hover:bg-zinc-50 transition-all duration-200'
    >
      <div className='flex items-start gap-3'>
        {notification.type === 'chat_request' ? (
          <div className='flex-shrink-0'>
            <UserAvatar
              email={
                userProfile?.email ||
                (notification.data as ChatRequestWithUser)?.requesterProfile
                  ?.email
              }
              userId={(notification.data as ChatRequestWithUser)?.requesterId}
              profilePictureUrl={
                userProfile?.profilePictureUrl ||
                (notification.data as ChatRequestWithUser)?.requesterProfile
                  ?.profilePictureUrl
              }
              hasProfilePicture={
                userProfile?.hasProfilePicture ||
                (notification.data as ChatRequestWithUser)?.requesterProfile
                  ?.hasProfilePicture ||
                false
              }
              size='md'
            />
          </div>
        ) : notification.type === 'message' &&
          notification.data &&
          'senderEmail' in notification.data ? (
          <div className='flex-shrink-0'>
            <UserAvatar
              email={
                (notification.data as MessageNotificationData)?.senderProfile
                  ?.email ||
                (notification.data as MessageNotificationData)?.senderEmail
              }
              userId={
                (notification.data as MessageNotificationData)?.message
                  ?.senderId
              }
              profilePictureUrl={
                (notification.data as MessageNotificationData)?.senderProfile
                  ?.profilePictureUrl
              }
              hasProfilePicture={
                (notification.data as MessageNotificationData)?.senderProfile
                  ?.hasProfilePicture
              }
              size='md'
            />
          </div>
        ) : (
          <div className='flex-shrink-0 w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center'>
            {getNotificationIcon(notification.type || null)}
          </div>
        )}

        <div className='flex-1 min-w-0'>
          <div
            className={`${isClickable ? 'cursor-pointer' : ''}`}
            {...(isClickable && {
              onClick: () => onNotificationClick(notification),
            })}
          >
            <div className='flex items-start justify-between mb-1'>
              <div className='flex-1 min-w-0'>
                <h4 className='text-sm font-medium text-zinc-900 truncate no-email-detection'>
                  {notification.title}
                </h4>
                <p className='text-sm text-zinc-700 mb-1.5'>
                  {notification.content}
                </p>
              </div>
              <div className='flex flex-col items-end ml-2'>
                <span className='text-sm text-zinc-500 font-medium'>
                  {formatTimeAgo(notification.timestamp)}
                </span>
              </div>
            </div>
          </div>

          {notification.type === 'chat_request' &&
          notification.data &&
          'requesterId' in notification.data ? (
            (() => {
              const chatRequestData = notification.data as ChatRequestWithUser;
              return (
                <div className='flex items-center gap-1.5 mt-3'>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onRespondToRequest(
                        notification.id,
                        'REJECTED',
                        chatRequestData
                      );
                    }}
                    disabled={decliningId === notification.id}
                    className='px-2.5 py-2 text-sm font-medium text-zinc-900 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 disabled:opacity-50 transition-colors'
                  >
                    {decliningId === notification.id
                      ? 'Declining...'
                      : 'Decline'}
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onRespondToRequest(
                        notification.id,
                        'ACCEPTED',
                        chatRequestData
                      );
                    }}
                    disabled={decliningId === notification.id}
                    className='px-2.5 py-2 bg-brand-500 text-white text-sm font-medium rounded-xl hover:bg-brand-600 disabled:opacity-50 transition-colors border border-brand-500'
                  >
                    Accept
                  </button>
                </div>
              );
            })()
          ) : notification.type === 'message' ? (
            <div className='flex items-center gap-1.5 mt-3'>
              <button
                onClick={e => {
                  e.stopPropagation();
                  onNotificationClick(notification);
                }}
                className='px-2.5 py-2 bg-brand-500 text-white text-sm font-medium rounded-xl hover:bg-brand-600 transition-colors border border-brand-500'
              >
                Reply
              </button>
              <button
                onClick={async e => {
                  e.stopPropagation();
                  if (!user) return;
                  try {
                    if (
                      notification.data &&
                      'conversationId' in notification.data
                    ) {
                      await notificationService.deleteNotificationsForConversation(
                        user.userId,
                        (notification.data as MessageNotificationData)
                          .conversationId
                      );
                    }
                    // Remove from local state via parent callback
                    onRemoveNotification(notification.id);
                  } catch (error) {
                    console.error(
                      'Error marking message notification as read:',
                      error
                    );
                    onError('Failed to mark notification as read');
                  }
                }}
                className='px-2.5 py-2 text-sm font-medium text-zinc-900 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors'
              >
                Mark as Read
              </button>
            </div>
          ) : notification.type === 'connection' ? (
            <div className='flex items-center gap-1.5 mt-3'>
              <button
                onClick={e => {
                  e.stopPropagation();
                  onNotificationClick(notification);
                }}
                className='px-2.5 py-2 bg-b_green-500 text-white text-sm font-medium rounded-xl hover:bg-b_green-600 transition-colors border border-b_green-500'
              >
                Start Chat
              </button>
              <button
                onClick={async e => {
                  e.stopPropagation();
                  if (!user) return;
                  try {
                    await notificationService.markNotificationAsRead(
                      notification.id
                    );
                    // Remove from local state via parent callback
                    onRemoveNotification(notification.id);
                  } catch (error) {
                    console.error(
                      'Error marking connection notification as read:',
                      error
                    );
                    onError('Failed to mark notification as read');
                  }
                }}
                className='px-2.5 py-2 text-sm font-medium text-zinc-900 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors'
              >
                Mark as Read
              </button>
            </div>
          ) : (
            <div className='flex items-center gap-1.5 mt-3'>
              <button
                onClick={async e => {
                  e.stopPropagation();
                  if (!user) return;
                  try {
                    await notificationService.markNotificationAsRead(
                      notification.id
                    );
                    // Remove from local state via parent callback
                    onRemoveNotification(notification.id);
                  } catch (error) {
                    console.error('Error marking notification as read:', error);
                    onError('Failed to mark notification as read');
                  }
                }}
                className='px-2.5 py-2 text-sm font-medium text-zinc-900 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors'
              >
                Mark as Read
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
