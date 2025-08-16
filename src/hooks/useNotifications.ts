import { useEffect, useMemo, useCallback } from 'react';
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
  userId,
  enabled,
}: UseNotificationsProps): UseNotificationsReturn {
  const { notifications, loading, errors, subscribeToNotifications } =
    useSubscriptionStore();

  // Subscribe to notifications
  useEffect(() => {
    if (!enabled || !userId) return;

    console.log('[useNotifications] Setting up notifications subscription');
    const unsubscribe = subscribeToNotifications(userId);

    return () => {
      console.log('[useNotifications] Cleaning up notifications subscription');
      unsubscribe();
    };
  }, [enabled, userId, subscribeToNotifications]);

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
