import { useEffect, useState, useCallback } from 'react';
import { useRealtime } from '@/contexts/RealtimeContext';
import { userService } from '@/services/user.service';
import type { Schema } from '../../../amplify/data/resource';

type ChatRequest = Schema['ChatRequest']['type'];

export interface ChatRequestWithUser extends ChatRequest {
  requesterEmail?: string;
}

interface UseRealtimeChatRequestsProps {
  userId: string;
  enabled?: boolean;
}

interface UseRealtimeChatRequestsReturn {
  chatRequests: ChatRequestWithUser[];
  isLoading: boolean;
  error: string | null;
  // Utility functions
  getRequestById: (requestId: string) => ChatRequestWithUser | null;
  removeRequest: (requestId: string) => void;
  addOptimisticRequest: (request: ChatRequest) => void;
}

/**
 * Hook for subscribing to incoming chat requests with user details
 */
export function useRealtimeChatRequests({
  userId,
  enabled = true,
}: UseRealtimeChatRequestsProps): UseRealtimeChatRequestsReturn {
  const { subscribeToChatRequests } = useRealtime();

  const [chatRequests, setChatRequests] = useState<ChatRequestWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !enabled) {
      setChatRequests([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    console.log(
      `[useRealtimeChatRequests] Setting up chat requests subscription for user: ${userId}`
    );
    setIsLoading(true);

    const unsubscribe = subscribeToChatRequests(userId, async data => {
      try {
        // Handle observeQuery format
        const requests = data.items || [];

        // Fetch user details for each request
        const requestsWithUsers = await Promise.all(
          requests.map(async (request: ChatRequest) => {
            try {
              const userResult = await userService.getUserPresence(
                request.requesterId
              );
              return {
                ...request,
                requesterEmail: userResult.data?.email || undefined,
              } as ChatRequestWithUser;
            } catch (userError) {
              console.warn(
                `Failed to fetch user details for requester ${request.requesterId}:`,
                userError
              );
              return {
                ...request,
                requesterEmail: undefined,
              } as ChatRequestWithUser;
            }
          })
        );

        setChatRequests(requestsWithUsers);
        setIsLoading(false);
        setError(null);

        console.log(
          `[useRealtimeChatRequests] Received ${requestsWithUsers.length} chat requests`
        );
      } catch (err) {
        console.error(
          '[useRealtimeChatRequests] Error processing chat requests:',
          err
        );
        setError('Failed to load chat requests');
        setIsLoading(false);
      }
    });

    return () => {
      console.log(
        `[useRealtimeChatRequests] Cleaning up chat requests subscription for: ${userId}`
      );
      unsubscribe();
    };
  }, [userId, enabled, subscribeToChatRequests]);

  // Utility functions (memoized to prevent infinite loops)
  const getRequestById = useCallback(
    (requestId: string): ChatRequestWithUser | null => {
      return chatRequests.find(request => request.id === requestId) || null;
    },
    [chatRequests]
  );

  const removeRequest = useCallback((requestId: string) => {
    setChatRequests(prev => prev.filter(req => req.id !== requestId));
  }, []);

  const addOptimisticRequest = useCallback((request: ChatRequest) => {
    setChatRequests(prev => [
      ...prev,
      { ...request, requesterEmail: undefined },
    ]);
  }, []);

  return {
    chatRequests,
    isLoading,
    error,
    getRequestById,
    removeRequest,
    addOptimisticRequest,
  };
}

interface UseRealtimeNotificationsProps {
  userId: string;
  enabled?: boolean;
}

interface UseRealtimeNotificationsReturn {
  // Chat requests
  chatRequests: ChatRequestWithUser[];
  chatRequestsLoading: boolean;
  chatRequestsError: string | null;
  unreadCount: number;
  // Utility functions
  getRequestById: (requestId: string) => ChatRequestWithUser | null;
  removeRequest: (requestId: string) => void;
  addOptimisticRequest: (request: ChatRequest) => void;
  markAllAsRead: () => void;
}

/**
 * Combined hook for all notification types (currently just chat requests)
 * This can be extended in the future for other notification types
 */
export function useRealtimeNotifications({
  userId,
  enabled = true,
}: UseRealtimeNotificationsProps): UseRealtimeNotificationsReturn {
  const {
    chatRequests,
    isLoading: chatRequestsLoading,
    error: chatRequestsError,
    getRequestById,
    removeRequest,
    addOptimisticRequest,
  } = useRealtimeChatRequests({ userId, enabled });

  const [readRequestIds, setReadRequestIds] = useState<Set<string>>(new Set());

  // Calculate unread count
  const unreadCount = chatRequests.filter(
    request => !readRequestIds.has(request.id)
  ).length;

  const markAllAsRead = useCallback(() => {
    const allRequestIds = new Set(chatRequests.map(req => req.id));
    setReadRequestIds(allRequestIds);
  }, [chatRequests]);

  return {
    chatRequests,
    chatRequestsLoading,
    chatRequestsError,
    unreadCount,
    getRequestById,
    removeRequest,
    addOptimisticRequest,
    markAllAsRead,
  };
}
