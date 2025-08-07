'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';

import { notificationService } from '../../services/notification.service';
import NotificationItem from './NotificationItem';
import type {
  UINotification,
  NotificationFilter,
  ChatRequestWithUser,
  MessageNotificationData,
} from './types';

interface NotificationDropdownProps {
  isOpen: boolean;
  notifications: UINotification[];
  activeFilter: NotificationFilter;
  error: string | null;
  decliningId: string | null;
  onNotificationClick: (notification: UINotification) => void;
  onRespondToRequest: (
    chatRequestId: string,
    status: 'ACCEPTED' | 'REJECTED',
    chatRequest: ChatRequestWithUser
  ) => void;
  onRemoveNotification: (notificationId: string) => void;
  onMarkAllAsRead: () => void;

  onError: (error: string) => void;
}

export default function NotificationDropdown({
  isOpen,
  notifications,
  activeFilter,
  error,
  decliningId,
  onNotificationClick,
  onRespondToRequest,
  onRemoveNotification,
  onMarkAllAsRead,

  onError,
}: NotificationDropdownProps) {
  const { user } = useAuthenticator();

  const getFilteredNotifications = () => {
    if (activeFilter === 'all') {
      return notifications;
    }
    return notifications.filter(notif => notif.type === activeFilter);
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      const markPromises = notifications.map(notification => {
        // Handle message notifications differently - delete them instead of marking as read
        if (
          notification.type === 'message' &&
          notification.data &&
          'conversationId' in notification.data
        ) {
          return notificationService.deleteNotificationsForConversation(
            user.userId,
            (notification.data as MessageNotificationData).conversationId
          );
        } else {
          // For other notification types, mark as read
          return notificationService.markNotificationAsRead(notification.id);
        }
      });
      const results = await Promise.all(markPromises);

      // Check if any marking failed
      const failedResults = results.filter(result => result.error);
      if (failedResults.length > 0) {
        console.error(
          'Some notifications failed to be processed:',
          failedResults
        );
        onError('Some notifications failed to be processed');
        return;
      }

      onMarkAllAsRead();
    } catch (error) {
      console.error('Error processing notifications:', error);
      onError('Failed to process notifications');
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className='origin-top-right absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] rounded-2xl shadow-sm bg-white border border-slate-200 focus:outline-none z-20'
      role='menu'
      aria-orientation='vertical'
      aria-labelledby='user-menu-button'
    >
      <div className='p-3 sm:p-4 border-b border-slate-200'>
        <h3 className='text-base sm:text-lg font-semibold text-slate-900'>
          Notifications
        </h3>
      </div>

      {/* Content */}
      <div className='max-h-[60vh] overflow-y-auto'>
        {error && (
          <div className='p-3 sm:p-4 text-red-700 bg-red-50 m-3 sm:m-4 rounded-2xl'>
            {error}
          </div>
        )}

        {getFilteredNotifications().length === 0 ? (
          <div className='py-12 sm:py-16 text-center text-slate-500'>
            <div className='w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center'>
              <svg
                className='w-8 h-8 text-slate-500'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={1.5}
                  d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
                />
              </svg>
            </div>
            <h4 className='text-base font-medium text-slate-900'>
              You&apos;re all caught up
            </h4>
            <p className='text-sm text-slate-500 mt-1'>No new notifications</p>
          </div>
        ) : (
          <div className='divide-y divide-slate-100'>
            {getFilteredNotifications().map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onNotificationClick={onNotificationClick}
                onRespondToRequest={onRespondToRequest}
                onRemoveNotification={onRemoveNotification}
                decliningId={decliningId}
                onError={onError}
              />
            ))}
          </div>
        )}
      </div>

      {getFilteredNotifications().length > 0 && (
        <div className='p-2 border-t border-slate-200 bg-slate-100'>
          <button
            onClick={handleMarkAllAsRead}
            className='w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2 rounded-2xl hover:bg-slate-100 transition-colors'
          >
            Mark all as read
          </button>
        </div>
      )}
    </div>
  );
}
