'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { CheckCircle2 } from 'lucide-react';

import { notificationService } from '../../services/notification.service';
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
          className='w-4 h-4 text-blue-500'
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
          className='w-4 h-4 text-gray-500'
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
      return <CheckCircle2 className='w-6 h-6 text-green-500' />;
    case 'system':
      return (
        <svg
          className='w-4 h-4 text-gray-500'
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
          className='w-4 h-4 text-gray-500'
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

  const isClickable =
    notification.type === 'message' || notification.type === 'connection';

  return (
    <div
      key={notification.id}
      className='w-full text-left p-3 sm:p-4 hover:bg-gray-50 transition-colors'
    >
      <div className='flex items-start gap-4'>
        {notification.type === 'chat_request' ? (
          <div className='relative flex-shrink-0'>
            <UserAvatar
              email={(notification.data as ChatRequestWithUser)?.requesterEmail}
              userId={(notification.data as ChatRequestWithUser)?.requesterId}
              size='md'
            />
          </div>
        ) : notification.type === 'message' &&
          notification.data &&
          'senderEmail' in notification.data ? (
          <div className='relative flex-shrink-0'>
            <UserAvatar
              email={
                (notification.data as MessageNotificationData)?.senderEmail
              }
              userId={
                (notification.data as MessageNotificationData)?.message
                  ?.senderId
              }
              size='sm'
            />
          </div>
        ) : (
          <div className='flex-shrink-0'>
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
              <h4 className='text-sm font-semibold text-gray-800 truncate pr-2 no-email-detection'>
                {notification.title}
              </h4>
              <span className='text-sm text-gray-500 flex-shrink-0 font-medium'>
                {formatTimeAgo(notification.timestamp)}
              </span>
            </div>
            <p className='text-sm text-gray-600 leading-normal'>
              {notification.content}
            </p>
          </div>

          {notification.type === 'chat_request' &&
          notification.data &&
          'requesterId' in notification.data ? (
            (() => {
              const chatRequestData = notification.data as ChatRequestWithUser;
              return (
                <div className='flex items-center gap-2 mt-3'>
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
                    className='px-3 py-1.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors'
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
                    className='px-3 py-1.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors'
                  >
                    Confirm
                  </button>
                </div>
              );
            })()
          ) : notification.type === 'message' ? (
            <div className='flex items-center gap-2 mt-3'>
              <button
                onClick={e => {
                  e.stopPropagation();
                  onNotificationClick(notification);
                }}
                className='px-3 py-1.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-colors'
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
                className='px-3 py-1.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors'
              >
                Mark as Read
              </button>
            </div>
          ) : notification.type === 'connection' ? (
            <div className='flex items-center gap-2 mt-3'>
              <button
                onClick={e => {
                  e.stopPropagation();
                  onNotificationClick(notification);
                }}
                className='px-3 py-1.5 bg-green-500 text-white text-sm font-semibold rounded-lg hover:bg-green-600 transition-colors'
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
                className='px-3 py-1.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors'
              >
                Mark as Read
              </button>
            </div>
          ) : (
            <div className='flex items-center gap-2 mt-3'>
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
                className='px-3 py-1.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors'
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
