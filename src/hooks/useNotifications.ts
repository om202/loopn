import { useMemo, useCallback } from 'react';
import { useSubscriptionStore } from '../stores/subscription-store';
import { useChatRequests } from './useChatRequests';
import type { Schema } from '../../amplify/data/resource';

type Notification = Schema['Notification']['type'];

interface UseNotificationsProps {
  userId: string;
  enabled: boolean;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
  notificationCount: number;
  getNotificationCount: () => number;
}

export function useNotifications({
  userId,
  enabled,
}: UseNotificationsProps): UseNotificationsReturn {
  const { notifications, loading, errors } = useSubscriptionStore();

  // Get chat requests to include in notification count
  const { incomingRequests } = useChatRequests({
    userId,
    enabled,
  });

  // Note: Subscriptions are now managed globally by GlobalSubscriptionProvider
  // This hook just provides access to the cached data

  const isLoading = loading.notifications;
  const error = errors.notifications;

  // Calculate notification count with message grouping logic
  // Include both store notifications (excluding chat_request type) and incoming chat requests
  const notificationCount = useMemo(() => {
    // Count store notifications (excluding chat_request to avoid duplicates)
    const storeNotificationCount = notifications
      .filter(notification => notification.type !== 'chat_request')
      .reduce((total, notification) => {
        if (
          notification.type === 'message' &&
          notification.data &&
          typeof notification.data === 'object' &&
          notification.data !== null &&
          'messageCount' in notification.data
        ) {
          const messageCount = (notification.data as { messageCount?: number })
            .messageCount;
          return total + (typeof messageCount === 'number' ? messageCount : 1);
        }
        return total + 1;
      }, 0);

    // Count pending incoming chat requests
    const chatRequestCount = incomingRequests.filter(
      req => req.status === 'PENDING'
    ).length;

    return storeNotificationCount + chatRequestCount;
  }, [notifications, incomingRequests]);

  const getNotificationCount = useCallback(() => {
    return notificationCount;
  }, [notificationCount]);

  return {
    notifications,
    isLoading,
    error,
    notificationCount,
    getNotificationCount,
  };
}
