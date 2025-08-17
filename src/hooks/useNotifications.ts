import { useMemo, useCallback } from 'react';
import { useSubscriptionStore } from '../stores/subscription-store';
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
  userId: _userId,
  enabled: _enabled,
}: UseNotificationsProps): UseNotificationsReturn {
  const { notifications, loading, errors } = useSubscriptionStore();

  // Note: Subscriptions are now managed globally by GlobalSubscriptionProvider
  // This hook just provides access to the cached data

  const isLoading = loading.notifications;
  const error = errors.notifications;

  // Calculate notification count with message grouping logic
  const notificationCount = useMemo(() => {
    return notifications.reduce((total, notification) => {
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
  }, [notifications]);

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
