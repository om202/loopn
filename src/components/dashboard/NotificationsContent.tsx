'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';

import { createShortChatUrl } from '../../lib/url-utils';
import { chatService } from '../../services/chat.service';
import { messageService } from '../../services/message.service';
import { notificationService } from '../../services/notification.service';

import { useChatRequests } from '../../hooks/useChatRequests';
import { useNotifications } from '../../hooks/useNotifications';
import { useConnectionActions } from '../../hooks/useConnectionActions';
import { useSubscriptionStore } from '../../stores/subscription-store';

import NotificationItem from '../notifications/NotificationItem';
import LoadingContainer from '../LoadingContainer';
import type {
  UINotification,
  NotificationFilter,
  ChatRequestNotification,
  ChatRequestWithUser,
  MessageNotificationData,
  Notification,
} from '../notifications/types';

const getDisplayName = (
  userProfile?: { fullName?: string; email?: string } | null,
  userId?: string
) => {
  // Try to get full name from profile first
  if (userProfile?.fullName) {
    return userProfile.fullName;
  }
  // Fall back to email if available
  if (userProfile?.email) {
    return userProfile.email;
  }
  // Last resort: User + last 4 chars of userId
  return userId ? `User ${userId.slice(-4)}` : 'Unknown User';
};

export default function NotificationsContent() {
  const { user } = useAuthenticator();

  // Use centralized hooks for all subscriptions (no direct subscription calls)
  const { fetchUserProfile } = useSubscriptionStore();

  // Use centralized notifications hook (handles subscriptions internally)
  const { notifications: storeNotifications, isLoading: notificationsLoading } =
    useNotifications({
      userId: user?.userId || '',
      enabled: !!user?.userId,
    });

  // Use chat requests hook for chat request notifications
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
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Connection actions hook - we'll use a dummy conversation ID since we don't need it for response actions
  const { respondToConnectionRequest } = useConnectionActions({
    conversationId: '',
    currentUserId: user?.userId || '',
    otherUserId: '',
  });

  // Much simpler: only show loading during initial load before we've processed any data
  const isLoading = isInitialLoad && notifications.length === 0;

  // Debug logging to understand the loading issue
  console.log('NotificationsContent Debug:', {
    notificationsLoading: notificationsLoading,
    chatRequestsLoading: chatRequestsLoading,
    'notifications.length': notifications.length,
    'storeNotifications.length': storeNotifications.length,
    'realtimeChatRequests?.length': realtimeChatRequests?.length,
    isInitialLoad: isInitialLoad,
    isLoading: isLoading,
  });

  const router = useRouter();

  // Set initial load to false after a reasonable timeout (no direct subscription needed)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log('Setting initial load to false after timeout');
      setIsInitialLoad(false);
    }, 3000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // Process chat requests and store notifications into local UI format
  useEffect(() => {
    console.log('Processing notifications useEffect triggered:', {
      'storeNotifications.length': storeNotifications.length,
      'realtimeChatRequests?.length': realtimeChatRequests?.length,
      chatRequestsLoading: chatRequestsLoading,
    });

    const processNotifications = async () => {
      const uiNotifications: UINotification[] = [];

      // Process store notifications (from subscription)
      // Exclude chat_request notifications since we handle those via real-time chat requests
      for (const storeNotif of storeNotifications) {
        if (storeNotif.type === 'chat_request') {
          continue; // Skip chat_request notifications to avoid duplicates
        }

        // Create a proper Notification object
        const notification: Notification = {
          id: storeNotif.id,
          type: storeNotif.type,
          title: storeNotif.title,
          content: storeNotif.content,
          timestamp: storeNotif.timestamp,
          isRead: storeNotif.isRead,
          userId: storeNotif.userId,
          createdAt: storeNotif.createdAt,
          updatedAt: storeNotif.updatedAt,
          data: storeNotif.data as
            | ChatRequestWithUser
            | MessageNotificationData
            | undefined,
        };
        uiNotifications.push(notification);
      }

      // Process chat requests into notifications
      if (realtimeChatRequests && !chatRequestsLoading) {
        for (const request of realtimeChatRequests) {
          // Fetch user profile from centralized cache
          const profileData = await fetchUserProfile(request.requesterId);
          const requesterProfile = profileData
            ? {
                fullName: profileData.fullName || undefined,
                email: profileData.email || undefined,
                profilePictureUrl: profileData.profilePictureUrl || undefined,
                hasProfilePicture: profileData.hasProfilePicture || false,
              }
            : undefined;

          const title = getDisplayName(requesterProfile, request.requesterId);
          const content = 'wants to chat with you';

          uiNotifications.push({
            id: request.id,
            type: 'chat_request' as const,
            title,
            content,
            timestamp: request.createdAt,
            isRead: false,
            data: {
              ...request,
              requesterProfile,
            },
          });
        }
      }

      // Sort by timestamp (newest first)
      uiNotifications.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setNotifications(uiNotifications);

      // Mark initial load as complete when we process notifications
      setIsInitialLoad(false);
    };

    processNotifications();
  }, [
    storeNotifications,
    realtimeChatRequests,
    chatRequestsLoading,
    fetchUserProfile,
  ]);

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

  // Process centralized notifications

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
            title: getDisplayName(
              chatRequest.requesterProfile,
              chatRequest.requesterId
            ),
            content: 'wants to connect with you',
            timestamp: chatRequest.createdAt,
            isRead: false,
            data: chatRequest,
          };
          setNotifications(prev => [...prev, chatNotification]);
          setError(result.error);
        }
      } catch (error) {
        console.error('Error responding to connection request:', error);
        const chatNotification: ChatRequestNotification = {
          id: chatRequest.id,
          type: 'chat_request',
          title: getDisplayName(
            chatRequest.requesterProfile,
            chatRequest.requesterId
          ),
          content: 'wants to connect with you',
          timestamp: chatRequest.createdAt,
          isRead: false,
          data: chatRequest,
        };
        setNotifications(prev => [...prev, chatNotification]);
        setError('Failed to respond to connection request');
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
          title: getDisplayName(
            chatRequest.requesterProfile,
            chatRequest.requesterId
          ),
          content: 'wants to connect with you',
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
        title: getDisplayName(
          chatRequest.requesterProfile,
          chatRequest.requesterId
        ),
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

  const handleRemoveNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  };

  const handleRespondToConnectionRequest = async (
    connectionRequestId: string,
    status: 'ACCEPTED' | 'REJECTED'
  ) => {
    // Find the notification that corresponds to this connection request
    const connectionNotification = notifications.find(
      notif =>
        notif.type === 'connection' &&
        notif.data &&
        'connectionRequestId' in notif.data &&
        (notif.data as { connectionRequestId: string }).connectionRequestId ===
          connectionRequestId
    );

    // Optimistically remove the notification from UI immediately
    if (connectionNotification) {
      setNotifications(prev =>
        prev.filter(notif => notif.id !== connectionNotification.id)
      );
    }

    try {
      await respondToConnectionRequest(connectionRequestId, status);

      // If successful, also remove the notification from the backend
      if (connectionNotification && user) {
        await notificationService.deleteNotification(connectionNotification.id);
      }
    } catch (error) {
      console.error('Error responding to connection request:', error);
      setError('Failed to respond to connection request');

      // If there was an error, restore the notification to the UI
      if (connectionNotification) {
        setNotifications(prev => [...prev, connectionNotification]);
      }
    }
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
      {/* Content */}
      <div className='flex-1'>
        {error && (
          <div className='p-4 text-b_red-700 bg-b_red-100 mb-4 rounded-2xl'>
            {error}
          </div>
        )}

        {isLoading ? (
          <LoadingContainer size='lg' variant='spin' />
        ) : getFilteredNotifications().length === 0 ? (
          <div className='flex flex-col items-center justify-center min-h-full text-center'>
            <div className='w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center'>
              <Bell className='w-8 h-8 text-slate-1000' />
            </div>
            <h3 className='text-lg font-medium text-slate-900 mb-2'>
              You&apos;re all caught up
            </h3>
            <p className='text-slate-1000'>No new notifications</p>
          </div>
        ) : (
          <div className='space-y-4'>
            {getFilteredNotifications().map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onNotificationClick={handleNotificationClick}
                onRespondToRequest={handleRespondToRequest}
                onRespondToConnectionRequest={handleRespondToConnectionRequest}
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
