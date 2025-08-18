import { useState, useEffect, useMemo } from 'react';
import type { Schema } from '../../../amplify/data/resource';
import { useRealtime } from '../../contexts/RealtimeContext';
import { useSubscriptionStore } from '../../stores/subscription-store';

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

export function useRealtimeChatRequests({
  userId,
  enabled,
}: UseChatRequestsProps) {
  const [incomingRequests, setIncomingRequests] = useState<
    ChatRequestWithUser[]
  >([]);
  const [sentRequests, setSentRequests] = useState<ChatRequestWithUser[]>([]);
  const [isLoadingIncoming, setIsLoadingIncoming] = useState(true);
  const [isLoadingSent, setIsLoadingSent] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { subscribeToChatRequests, subscribeSentChatRequests } = useRealtime();
  const { fetchUserProfile } = useSubscriptionStore();

  useEffect(() => {
    if (!enabled || !userId) {
      setIsLoadingIncoming(false);
      setIncomingRequests([]);
      return;
    }

    setIsLoadingIncoming(true);
    setError(null);

    const unsubscribe = subscribeToChatRequests(userId, async data => {
      try {
        const typedData = data as { items?: Schema['ChatRequest']['type'][] };
        const requests = typedData.items || [];
        const requestsWithUsers = await Promise.all(
          requests.map(async request => {
            try {
              const profile = await fetchUserProfile(request.requesterId);
              return {
                id: request.id,
                requesterId: request.requesterId,
                receiverId: request.receiverId,
                status: request.status,
                createdAt: request.createdAt,
                updatedAt: request.updatedAt,
                requesterEmail: profile?.email || undefined,
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
          })
        );

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
      unsubscribe();
    };
  }, [userId, enabled, subscribeToChatRequests, fetchUserProfile]);

  useEffect(() => {
    if (!enabled || !userId) {
      setIsLoadingSent(false);
      setSentRequests([]);
      return;
    }

    setIsLoadingSent(true);

    const unsubscribe = subscribeSentChatRequests(userId, async data => {
      try {
        const typedData = data as { items?: Schema['ChatRequest']['type'][] };
        const requests = typedData.items || [];
        const requestsWithUsers = await Promise.all(
          requests.map(async request => {
            try {
              const profile = await fetchUserProfile(request.receiverId);
              return {
                id: request.id,
                requesterId: request.requesterId,
                receiverId: request.receiverId,
                status: request.status,
                createdAt: request.createdAt,
                updatedAt: request.updatedAt,
                receiverEmail: profile?.email || undefined,
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
          })
        );

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
      unsubscribe();
    };
  }, [userId, enabled, subscribeSentChatRequests, fetchUserProfile]);

  const isLoading = isLoadingIncoming || isLoadingSent;

  const pendingReceiverIds = useMemo((): Set<string> => {
    return new Set(
      sentRequests
        .filter(req => req.status === 'PENDING')
        .map(req => req.receiverId)
    );
  }, [sentRequests]);

  const hasPendingRequestTo = (receiverId: string): boolean => {
    return sentRequests.some(
      req => req.receiverId === receiverId && req.status === 'PENDING'
    );
  };

  const getIncomingRequestById = (
    requestId: string
  ): ChatRequestWithUser | null => {
    return incomingRequests.find(req => req.id === requestId) || null;
  };

  const getSentRequestById = (
    requestId: string
  ): ChatRequestWithUser | null => {
    return sentRequests.find(req => req.id === requestId) || null;
  };

  return {
    incomingRequests,
    sentRequests,
    isLoading,
    isLoadingIncoming,
    isLoadingSent,
    error,
    pendingReceiverIds,
    hasPendingRequestTo,
    getIncomingRequestById,
    getSentRequestById,
  };
}
