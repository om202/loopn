'use client';

import { useCallback, useMemo, useEffect } from 'react';
import { useSubscriptionStore } from '../stores/subscription-store';
import type { Schema } from '../../amplify/data/resource';

type UserPresence = Schema['UserPresence']['type'];

interface UseOnlineUsersProps {
  enabled?: boolean;
  currentUserId?: string;
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
  currentUserId,
}: UseOnlineUsersProps = {}): UseOnlineUsersReturn {
  const {
    onlineUsers: rawOnlineUsers,
    loading,
    errors,
    conversations,
    subscribeToConnectionsPresence,
  } = useSubscriptionStore();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const connectionUserIds = Array.from(conversations.values())
      .map(conv => {
        if (currentUserId === conv.participant1Id) {
          return conv.participant2Id;
        } else if (currentUserId === conv.participant2Id) {
          return conv.participant1Id;
        }
        return null;
      })
      .filter((id): id is string => !!id)
      .filter((id, index, array) => array.indexOf(id) === index);

    const unsubscribe = subscribeToConnectionsPresence(connectionUserIds);
    
    return () => {
      unsubscribe();
    };
  }, [enabled, conversations, subscribeToConnectionsPresence, currentUserId]);


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
