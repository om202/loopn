import { useState, useEffect, useMemo } from 'react';
import { useRealtime } from '../../contexts/RealtimeContext';
import { userService } from '../../services/user.service';

export interface ChatRequestWithUser {
  id: string;
  requesterId: string;
  receiverId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | null | undefined;
  createdAt: string;
  updatedAt: string;
  requesterEmail?: string;
  receiverEmail?: string;
}

interface UseChatRequestsProps {
  userId: string;
  enabled: boolean;
}

export function useChatRequests({ userId, enabled }: UseChatRequestsProps) {
  const [incomingRequests, setIncomingRequests] = useState<
    ChatRequestWithUser[]
  >([]);
  const [sentRequests, setSentRequests] = useState<ChatRequestWithUser[]>([]);
  const [isLoadingIncoming, setIsLoadingIncoming] = useState(true);
  const [isLoadingSent, setIsLoadingSent] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { subscribeToChatRequests, subscribeSentChatRequests } = useRealtime();

  // Subscribe to incoming chat requests (where user is receiver)
  useEffect(() => {
    if (!enabled || !userId) {
      setIsLoadingIncoming(false);
      setIncomingRequests([]);
      return;
    }

    setIsLoadingIncoming(true);
    setError(null);

    console.log(
      '[useChatRequests] Setting up incoming requests subscription for:',
      userId
    );

    const unsubscribe = subscribeToChatRequests(userId, async data => {
      try {
        const requests = data.items || [];
        // Convert and fetch user details for each request
        const requestsWithUsers = await Promise.all(
          requests.map(
            async (request: {
              id: string;
              requesterId: string;
              recipientId: string;
              status: string;
              requestMessage?: string;
              timestamp: string;
            }) => {
              try {
                const userResult = await userService.getUserPresence(
                  request.requesterId
                );
                return {
                  id: request.id,
                  requesterId: request.requesterId,
                  receiverId: request.receiverId,
                  status: request.status,
                  createdAt: request.createdAt,
                  updatedAt: request.updatedAt,
                  requesterEmail: userResult.data?.email || undefined,
                };
              } catch (userError) {
                console.warn(
                  `Failed to fetch user details for requester ${request.requesterId}:`,
                  userError
                );
                return {
                  id: request.id,
                  requesterId: request.requesterId,
                  receiverId: request.receiverId,
                  status: request.status,
                  createdAt: request.createdAt,
                  updatedAt: request.updatedAt,
                  requesterEmail: undefined,
                };
              }
            }
          )
        );

        console.log('[useChatRequests] Received incoming requests:', {
          total: requestsWithUsers.length,
          requests: requestsWithUsers.map(r => ({
            id: r.id.slice(-6),
            requesterId: r.requesterId.slice(-6),
            status: r.status,
          })),
        });

        setIncomingRequests(requestsWithUsers);
        setIsLoadingIncoming(false);
      } catch (err) {
        console.error(
          '[useChatRequests] Error processing incoming requests:',
          err,
          'Raw data:',
          data
        );
        setError('Failed to process incoming chat requests');
        setIsLoadingIncoming(false);
      }
    });

    return () => {
      console.log(
        '[useChatRequests] Cleaning up incoming requests subscription for:',
        userId
      );
      unsubscribe();
    };
  }, [userId, enabled, subscribeToChatRequests]);

  // Subscribe to sent chat requests (where user is requester)
  useEffect(() => {
    if (!enabled || !userId) {
      setIsLoadingSent(false);
      setSentRequests([]);
      return;
    }

    setIsLoadingSent(true);

    console.log(
      '[useChatRequests] Setting up sent requests subscription for:',
      userId
    );

    const unsubscribe = subscribeSentChatRequests(userId, async data => {
      try {
        const requests = data.items || [];
        // Convert and fetch user details for each request
        const requestsWithUsers = await Promise.all(
          requests.map(
            async (request: {
              id: string;
              requesterId: string;
              receiverId: string;
              status: string;
              requestMessage?: string;
              timestamp: string;
            }) => {
              try {
                const userResult = await userService.getUserPresence(
                  request.receiverId
                );
                return {
                  id: request.id,
                  requesterId: request.requesterId,
                  receiverId: request.receiverId,
                  status: request.status,
                  createdAt: request.createdAt,
                  updatedAt: request.updatedAt,
                  receiverEmail: userResult.data?.email || undefined,
                };
              } catch (userError) {
                console.warn(
                  `Failed to fetch user details for receiver ${request.receiverId}:`,
                  userError
                );
                return {
                  id: request.id,
                  requesterId: request.requesterId,
                  receiverId: request.receiverId,
                  status: request.status,
                  createdAt: request.createdAt,
                  updatedAt: request.updatedAt,
                  receiverEmail: undefined,
                };
              }
            }
          )
        );

        console.log('[useChatRequests] Received sent requests:', {
          total: requestsWithUsers.length,
          requests: requestsWithUsers.map(r => ({
            id: r.id.slice(-6),
            receiverId: r.receiverId.slice(-6),
            status: r.status,
          })),
        });

        setSentRequests(requestsWithUsers);
        setIsLoadingSent(false);
      } catch (err) {
        console.error(
          '[useChatRequests] Error processing sent requests:',
          err,
          'Raw data:',
          data
        );
        setError('Failed to process sent chat requests');
        setIsLoadingSent(false);
      }
    });

    return () => {
      console.log(
        '[useChatRequests] Cleaning up sent requests subscription for:',
        userId
      );
      unsubscribe();
    };
  }, [userId, enabled, subscribeSentChatRequests]);

  // Computed values
  const isLoading = isLoadingIncoming || isLoadingSent;

  // Get pending receiver IDs for easy lookup (for UI buttons)
  const pendingReceiverIds = useMemo((): Set<string> => {
    return new Set(
      sentRequests
        .filter(req => req.status === 'PENDING')
        .map(req => req.receiverId)
    );
  }, [sentRequests]);

  // Helper to check if there's a pending request to a specific user
  const hasPendingRequestTo = (receiverId: string): boolean => {
    return sentRequests.some(
      req => req.receiverId === receiverId && req.status === 'PENDING'
    );
  };

  // Helper to get a specific incoming request by ID
  const getIncomingRequestById = (
    requestId: string
  ): ChatRequestWithUser | null => {
    return incomingRequests.find(req => req.id === requestId) || null;
  };

  // Helper to get a specific sent request by ID
  const getSentRequestById = (
    requestId: string
  ): ChatRequestWithUser | null => {
    return sentRequests.find(req => req.id === requestId) || null;
  };

  return {
    // Incoming requests (where user is receiver)
    incomingRequests,

    // Sent requests (where user is requester)
    sentRequests,

    // Combined loading state
    isLoading,
    isLoadingIncoming,
    isLoadingSent,

    // Error state
    error,

    // Computed helpers
    pendingReceiverIds,
    hasPendingRequestTo,

    // Request lookups
    getIncomingRequestById,
    getSentRequestById,
  };
}
