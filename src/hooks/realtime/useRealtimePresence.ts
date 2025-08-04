import { useEffect, useState, useCallback } from 'react';
import { useRealtime } from '@/contexts/RealtimeContext';
import type { Schema } from '../../../amplify/data/resource';

type UserPresence = Schema['UserPresence']['type'];

interface UseRealtimePresenceProps {
  userId: string;
  enabled?: boolean;
}

interface UseRealtimePresenceReturn {
  presence: UserPresence | null;
  isOnline: boolean;
  lastSeen: Date | null;
  error: string | null;
}

export function useRealtimePresence({
  userId,
  enabled = true,
}: UseRealtimePresenceProps): UseRealtimePresenceReturn {
  const { subscribeToPresence } = useRealtime();

  const [presence, setPresence] = useState<UserPresence | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !enabled) {
      setPresence(null);
      setError(null);
      return;
    }

    const unsubscribe = subscribeToPresence(userId, data => {
      try {
        const typedData = data as { items?: UserPresence[] } | UserPresence;
        const presenceData =
          (typedData as { items?: UserPresence[] }).items?.[0] ||
          (typedData as UserPresence);

        if (presenceData) {
          setPresence(presenceData);
          setError(null);
        } else {
          setPresence(null);
        }
      } catch (err) {
        console.error(
          '[useRealtimePresence] Error processing presence data:',
          err
        );
        setError('Failed to load user presence');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [userId, enabled, subscribeToPresence]);

  const isOnline = presence?.isOnline ?? false;
  const lastSeen = presence?.lastSeen ? new Date(presence.lastSeen) : null;

  return {
    presence,
    isOnline,
    lastSeen,
    error,
  };
}

interface UseRealtimeOnlineUsersProps {
  enabled?: boolean;
}

interface UseRealtimeOnlineUsersReturn {
  onlineUsers: UserPresence[];
  isLoading: boolean;
  error: string | null;
  isUserOnline: (userId: string) => boolean;
  getUserPresence: (userId: string) => UserPresence | null;
}

export function useRealtimeOnlineUsers({
  enabled = true,
}: UseRealtimeOnlineUsersProps = {}): UseRealtimeOnlineUsersReturn {
  const { subscribeToOnlineUsers } = useRealtime();

  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setOnlineUsers([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);

    const unsubscribe = subscribeToOnlineUsers(data => {
      try {
        const typedData = data as { items?: UserPresence[] };
        const users = typedData.items || [];
        const onlineUsers = users.filter(
          (user: UserPresence) => user.isOnline === true
        );

        const sortedOnlineUsers = onlineUsers.sort(
          (a: UserPresence, b: UserPresence) => {
            const lastSeenA = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
            const lastSeenB = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
            return lastSeenB - lastSeenA;
          }
        );

        setOnlineUsers(sortedOnlineUsers);
        setIsLoading(false);
        setError(null);
      } catch (err) {
        console.error(
          '[useRealtimeOnlineUsers] Error processing online users data:',
          err
        );
        setError('Failed to load online users');
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [enabled, subscribeToOnlineUsers]);

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
    isLoading,
    error,
    isUserOnline,
    getUserPresence,
  };
}
