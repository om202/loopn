'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';

import { createShortChatUrl } from '../../lib/url-utils';
import { chatService } from '../../services/chat.service';
import { messageService } from '../../services/message.service';
import { notificationService } from '../../services/notification.service';
import { useChatRequests } from '../../hooks/realtime/useChatRequests';
import { userPresenceService } from '../../services/user.service';

import NotificationItem from '../notifications/NotificationItem';
import LoadingContainer from '../LoadingContainer';
import type {
  UINotification,
  NotificationFilter,
  ChatRequestNotification,
  ChatRequestWithUser,
} from '../notifications/types';

export default function NotificationsContent() {
  const { user } = useAuthenticator();
  const {
    incomingRequests: realtimeChatRequests,
    isLoadingIncoming: chatRequestsLoading,
  } = useChatRequests({
    userId: user?.userId || '',
    enabled: !!user?.userId,
  });

  const [notifications, setNotifications] = useState<UINotification[]>([]);
  const [activeFilter] = useState<NotificationFilter>('all');
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, setAcceptingRequestId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  const groupMessageNotifications = useCallback(
    (notifications: UINotification[]) => {
      return notifications;
    },
    []
  );

  useEffect(() => {
    if (!user) {
      return;
    }

    const loadNotifications = async () => {
      const result = await notificationService.getUnreadNotifications(
        user.userId
      );
      if (result.data) {
        setNotifications(result.data);
      } else if (result.error) {
        setError(result.error);
      }
      setIsLoading(false);
    };

    const timeoutId = setTimeout(loadNotifications, 100);
    return () => clearTimeout(timeoutId);
  }, [user]);

  useEffect(() => {
    if (!realtimeChatRequests || chatRequestsLoading) {
      return;
    }

    const processRequests = async () => {
      const requestsWithUsers: ChatRequestWithUser[] = await Promise.all(
        realtimeChatRequests.map(async request => {
          const userResult = await userPresenceService.getUserPresence(
            request.requesterId
          );
          return {
            ...request,
            requesterEmail: undefined, // Email moved to UserProfile
          };
        })
      );

      setNotifications(prevNotifications => {
        const currentRequestIds = new Set(requestsWithUsers.map(req => req.id));
        const filteredNotifications = prevNotifications.filter(notif => {
          if (notif.type === 'chat_request') {
            const requestId =
              notif.id || (notif.data && 'id' in notif.data && notif.data.id);
            return currentRequestIds.has(requestId as string);
          }
          return true;
        });

        const chatNotifications: ChatRequestNotification[] = [];
        for (const request of requestsWithUsers) {
          const existingNotification = filteredNotifications.find(
            notif => notif.type === 'chat_request' && notif.id === request.id
          );

          if (!existingNotification) {
            const title =
              request.requesterEmail || `User ${request.requesterId.slice(-4)}`;
            const content = 'wants to chat with you';

            chatNotifications.push({
              id: request.id,
              type: 'chat_request' as const,
              title,
              content,
              timestamp: request.createdAt,
              isRead: false,
              data: request,
            });
          }
        }

        const newNotifications = [
          ...filteredNotifications,
          ...chatNotifications,
        ];

        return newNotifications;
      });
    };

    processRequests();
  }, [realtimeChatRequests, chatRequestsLoading]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const timeoutId = setTimeout(() => {
      const messageSubscription = messageService.subscribeToNewMessages(
        user.userId,
        async () => {
          // Sound disabled for notifications
          // No sound will play when receiving notifications
        },
        error => {
          console.error('Error subscribing to messages:', error);
        }
      );

      return () => {
        messageSubscription.unsubscribe();
      };
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const timeoutId = setTimeout(() => {
      const notificationSubscription =
        notificationService.observeUserNotifications(
          user.userId,
          notifications => {
            const groupedNotifications =
              groupMessageNotifications(notifications);
            setNotifications(groupedNotifications);
          },
          error => {
            console.error('Error observing notifications:', error);
            setError('Failed to load notifications');
          }
        );

      return () => {
        notificationSubscription.unsubscribe();
      };
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [user, groupMessageNotifications]);

  const handleNotificationClick = async (notification: UINotification) => {
    if (
      (notification.type === 'message' || notification.type === 'connection') &&
      notification.data &&
      'conversationId' in notification.data
    ) {
      const notificationData = notification.data as { conversationId: string };
      router.push(createShortChatUrl(notificationData.conversationId));

      if (user) {
        const isActualNotification = 'userId' in notification;
        if (isActualNotification) {
          if (notification.type === 'message') {
            const messageData = notification.data as { conversationId: string };
            await notificationService.deleteNotificationsForConversation(
              user.userId,
              messageData.conversationId
            );
          } else if (notification.type === 'connection') {
            await notificationService.deleteNotification(notification.id);
          } else {
            await notificationService.markNotificationAsRead(notification.id);
          }
        }
      }

      setNotifications(prevNotifications =>
        prevNotifications.filter(notif => notif.id !== notification.id)
      );
    }
  };

  const handleRespondToRequest = async (
    chatRequestId: string,
    status: 'ACCEPTED' | 'REJECTED',
    chatRequest: ChatRequestWithUser
  ) => {
    if (status === 'ACCEPTED') {
      setAcceptingRequestId(chatRequestId);

      setNotifications(prev =>
        prev.filter(notif => notif.id !== chatRequestId)
      );

      try {
        const result = await chatService.respondToChatRequest(
          chatRequestId,
          status
        );

        if (result.error) {
          const chatNotification: ChatRequestNotification = {
            id: chatRequest.id,
            type: 'chat_request',
            title:
              chatRequest.requesterEmail ||
              `User ${chatRequest.requesterId.slice(-4)}`,
            content: 'wants to chat with you',
            timestamp: chatRequest.createdAt,
            isRead: false,
            data: chatRequest,
          };
          setNotifications(prev => [...prev, chatNotification]);
          setError(result.error);
        }
      } catch (error) {
        console.error('Error responding to chat request:', error);
        const chatNotification: ChatRequestNotification = {
          id: chatRequest.id,
          type: 'chat_request',
          title:
            chatRequest.requesterEmail ||
            `User ${chatRequest.requesterId.slice(-4)}`,
          content: 'wants to chat with you',
          timestamp: chatRequest.createdAt,
          isRead: false,
          data: chatRequest,
        };
        setNotifications(prev => [...prev, chatNotification]);
        setError('Failed to respond to chat request');
      } finally {
        setAcceptingRequestId(null);
      }

      return;
    }

    setDecliningId(chatRequestId);
    setNotifications(prev => prev.filter(notif => notif.id !== chatRequestId));

    try {
      const result = await chatService.respondToChatRequest(
        chatRequestId,
        status
      );

      if (result.error) {
        const chatNotification: ChatRequestNotification = {
          id: chatRequest.id,
          type: 'chat_request',
          title:
            chatRequest.requesterEmail ||
            `User ${chatRequest.requesterId.slice(-4)}`,
          content: 'wants to chat with you',
          timestamp: chatRequest.createdAt,
          isRead: false,
          data: chatRequest,
        };
        setNotifications(prev => [...prev, chatNotification]);
        setError(result.error);
      }
    } catch {
      const chatNotification: ChatRequestNotification = {
        id: chatRequest.id,
        type: 'chat_request',
        title:
          chatRequest.requesterEmail ||
          `User ${chatRequest.requesterId.slice(-4)}`,
        content: 'wants to chat with you',
        timestamp: chatRequest.createdAt,
        isRead: false,
        data: chatRequest,
      };
      setNotifications(prev => [...prev, chatNotification]);
      setError('Failed to respond to chat request');
    }

    setDecliningId(null);
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      const markPromises = notifications.map(notification => {
        if (
          notification.type === 'message' &&
          notification.data &&
          'conversationId' in notification.data
        ) {
          return notificationService.deleteNotificationsForConversation(
            user.userId,
            (notification.data as { conversationId: string }).conversationId
          );
        } else {
          return notificationService.markNotificationAsRead(notification.id);
        }
      });
      const results = await Promise.all(markPromises);

      const failedResults = results.filter(result => result.error);
      if (failedResults.length > 0) {
        console.error(
          'Some notifications failed to be processed:',
          failedResults
        );
        setError('Some notifications failed to be processed');
        return;
      }

      setNotifications([]);
    } catch (error) {
      console.error('Error processing notifications:', error);
      setError('Failed to process notifications');
    }
  };

  const handleRemoveNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  };

  const getFilteredNotifications = () => {
    if (activeFilter === 'all') {
      return notifications;
    }
    return notifications.filter(notif => notif.type === activeFilter);
  };

  // Removed unused getTotalMessageCount function

  return (
    <div className='h-full flex flex-col'>
      {/* Header */}
      <div className='mb-6'>
        <div className='flex items-center justify-between mb-1'>
          <div className='flex items-center gap-3'>
            <h1 className='text-2xl font-bold text-zinc-900'>Notifications</h1>
          </div>
          {getFilteredNotifications().length > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className='text-sm text-brand-500 hover:text-brand-700 font-medium py-2 px-3 rounded-lg hover:bg-brand-50 transition-colors'
            >
              Mark all as read
            </button>
          )}
        </div>
        <p className='text-zinc-600 text-sm'>
          Keep up with your latest activity
        </p>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto'>
        {error && (
          <div className='p-4 text-b_red-700 bg-b_red-100 mb-4 rounded-2xl'>
            {error}
          </div>
        )}

        {isLoading ? (
          <LoadingContainer size='lg' variant='spin' />
        ) : getFilteredNotifications().length === 0 ? (
          <div className='flex flex-col items-center justify-center min-h-full text-center'>
            <div className='w-16 h-16 mx-auto mb-4 bg-zinc-100 rounded-full flex items-center justify-center'>
              <Bell className='w-8 h-8 text-zinc-500' />
            </div>
            <h3 className='text-lg font-medium text-zinc-900 mb-2'>
              You&apos;re all caught up
            </h3>
            <p className='text-zinc-500'>No new notifications</p>
          </div>
        ) : (
          <div className='space-y-4'>
            {getFilteredNotifications().map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onNotificationClick={handleNotificationClick}
                onRespondToRequest={handleRespondToRequest}
                onRemoveNotification={handleRemoveNotification}
                decliningId={decliningId}
                onError={setError}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
