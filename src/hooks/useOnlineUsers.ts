'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useSubscriptionStore } from '../stores/subscription-store';
import type { Schema } from '../../amplify/data/resource';

type UserPresence = Schema['UserPresence']['type'];

interface UseOnlineUsersProps {
  enabled?: boolean;
}

interface UseOnlineUsersReturn {
  onlineUsers: UserPresence[];
  isLoading: boolean;
  error: string | null;
  isUserOnline: (userId: string) => boolean;
  getUserPresence: (userId: string) => UserPresence | null;
}

/**
 * Custom hook for managing online users subscription
 * This replaces useRealtimeOnlineUsers and provides centralized state management
 *
 * Benefits:
 * - Single subscription shared across all components
 * - Reference counting prevents duplicate subscriptions
 * - Centralized state in Zustand store
 */
export function useOnlineUsers({
  enabled = true,
}: UseOnlineUsersProps = {}): UseOnlineUsersReturn {
  const {
    onlineUsers: rawOnlineUsers,
    loading,
    errors,
    subscribeToOnlineUsers,
  } = useSubscriptionStore();

  useEffect(() => {
    if (!enabled) return;

    console.log('[useOnlineUsers] Setting up subscription');

    // Subscribe to online users - this will be reference counted
    // We pass a dummy userId since the subscription doesn't actually need it
    const unsubscribe = subscribeToOnlineUsers('dummy');

    return () => {
      console.log('[useOnlineUsers] Cleaning up subscription');
      unsubscribe();
    };
  }, [enabled, subscribeToOnlineUsers]);

  // Sort online users by last seen (most recent first)
  const onlineUsers = useMemo(() => {
    if (!rawOnlineUsers) return [];

    return [...rawOnlineUsers].sort((a, b) => {
      const lastSeenA = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
      const lastSeenB = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
      return lastSeenB - lastSeenA;
    });
  }, [rawOnlineUsers]);

  const isUserOnline = useCallback(
    (userId: string): boolean => {
      return onlineUsers.some(user => user.userId === userId && user.isOnline);
    },
    [onlineUsers]
  );

  const getUserPresence = useCallback(
    (userId: string): UserPresence | null => {
      return onlineUsers.find(user => user.userId === userId) || null;
    },
    [onlineUsers]
  );

  return {
    onlineUsers,
    isLoading: loading.onlineUsers,
    error: errors.onlineUsers,
    isUserOnline,
    getUserPresence,
  };
}
