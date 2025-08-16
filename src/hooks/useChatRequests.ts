import { useEffect, useMemo, useCallback } from 'react';
import { useSubscriptionStore } from '../stores/subscription-store';
import type { Schema } from '../../amplify/data/resource';

type ChatRequest = Schema['ChatRequest']['type'];

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

interface UseChatRequestsReturn {
  incomingRequests: ChatRequest[];
  sentRequests: ChatRequest[];
  isLoading: boolean;
  isLoadingIncoming: boolean;
  isLoadingSent: boolean;
  error: string | null;
  pendingReceiverIds: Set<string>;
  hasPendingRequestTo: (receiverId: string) => boolean;
  getIncomingRequestById: (requestId: string) => ChatRequest | null;
  getSentRequestById: (requestId: string) => ChatRequest | null;
}

export function useChatRequests({
  userId,
  enabled,
}: UseChatRequestsProps): UseChatRequestsReturn {
  const {
    incomingChatRequests,
    sentChatRequests,
    loading,
    errors,
    subscribeToIncomingChatRequests,
    subscribeToSentChatRequests,
  } = useSubscriptionStore();

  // Subscribe to incoming chat requests
  useEffect(() => {
    if (!enabled || !userId) return;

    console.log(
      '[useChatRequests] Setting up incoming chat requests subscription'
    );
    const unsubscribe = subscribeToIncomingChatRequests(userId);

    return () => {
      console.log(
        '[useChatRequests] Cleaning up incoming chat requests subscription'
      );
      unsubscribe();
    };
  }, [enabled, userId, subscribeToIncomingChatRequests]);

  // Subscribe to sent chat requests
  useEffect(() => {
    if (!enabled || !userId) return;

    console.log('[useChatRequests] Setting up sent chat requests subscription');
    const unsubscribe = subscribeToSentChatRequests(userId);

    return () => {
      console.log(
        '[useChatRequests] Cleaning up sent chat requests subscription'
      );
      unsubscribe();
    };
  }, [enabled, userId, subscribeToSentChatRequests]);

  const isLoadingIncoming = loading.incomingChatRequests;
  const isLoadingSent = loading.sentChatRequests;
  const isLoading = isLoadingIncoming || isLoadingSent;
  const error = errors.incomingChatRequests || errors.sentChatRequests;

  const pendingReceiverIds = useMemo((): Set<string> => {
    return new Set(
      sentChatRequests
        .filter(req => req.status === 'PENDING')
        .map(req => req.receiverId)
    );
  }, [sentChatRequests]);

  const hasPendingRequestTo = useCallback(
    (receiverId: string): boolean => {
      return sentChatRequests.some(
        req => req.receiverId === receiverId && req.status === 'PENDING'
      );
    },
    [sentChatRequests]
  );

  const getIncomingRequestById = useCallback(
    (requestId: string): ChatRequest | null => {
      return incomingChatRequests.find(req => req.id === requestId) || null;
    },
    [incomingChatRequests]
  );

  const getSentRequestById = useCallback(
    (requestId: string): ChatRequest | null => {
      return sentChatRequests.find(req => req.id === requestId) || null;
    },
    [sentChatRequests]
  );

  return {
    incomingRequests: incomingChatRequests,
    sentRequests: sentChatRequests,
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
