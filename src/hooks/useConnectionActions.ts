import { useState, useCallback } from 'react';
import { chatService } from '../services/chat.service';
import { useSubscriptionStore } from '../stores/subscription-store';
import { useAnalytics } from '../hooks/useAnalytics';

interface UseConnectionActionsProps {
  conversationId: string;
  currentUserId: string;
  otherUserId: string;
}

interface UseConnectionActionsReturn {
  sendConnectionRequest: () => Promise<void>;
  respondToConnectionRequest: (
    connectionId: string,
    status: 'ACCEPTED' | 'REJECTED',
    optimisticConversationId?: string
  ) => Promise<void>;
  cancelConnectionRequest: (connectionId: string) => Promise<void>;
  removeConnection: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useConnectionActions({
  conversationId,
  currentUserId,
  otherUserId,
}: UseConnectionActionsProps): UseConnectionActionsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { removeConnectionRequest, updateConversationConnectionStatus } =
    useSubscriptionStore();
  const analytics = useAnalytics();

  const sendConnectionRequest = useCallback(async () => {
    if (!conversationId || !currentUserId || !otherUserId) {
      setError('Missing required information to send connection request');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await chatService.sendConnectionRequest(
        currentUserId,
        otherUserId,
        conversationId
      );

      if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to send connection request'
      );
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, currentUserId, otherUserId]);

  const respondToConnectionRequest = useCallback(
    async (
      connectionId: string,
      status: 'ACCEPTED' | 'REJECTED',
      optimisticConversationId?: string
    ) => {
      if (!connectionId) {
        setError('Missing connection request ID');
        return;
      }

      setIsLoading(true);
      setError(null);

      // Optimistically update the conversation status if accepting and we have the conversation ID
      if (status === 'ACCEPTED' && optimisticConversationId) {
        updateConversationConnectionStatus(
          optimisticConversationId,
          true,
          'ACTIVE'
        );
      }

      try {
        const result = await chatService.respondToConnectionRequest(
          connectionId,
          status
        );

        if (result.error) {
          setError(result.error);

          // Revert optimistic update on error
          if (status === 'ACCEPTED' && optimisticConversationId) {
            updateConversationConnectionStatus(optimisticConversationId, false);
          }
        } else if (status === 'ACCEPTED') {
          // Track successful connection when user accepts
          analytics.trackConnectionMade();
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to respond to connection request'
        );

        // Revert optimistic update on error
        if (status === 'ACCEPTED' && optimisticConversationId) {
          updateConversationConnectionStatus(optimisticConversationId, false);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [updateConversationConnectionStatus]
  );

  const cancelConnectionRequest = useCallback(
    async (connectionId: string) => {
      if (!connectionId) {
        setError('Missing connection request ID');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Optimistically remove from store immediately for instant UI update
        removeConnectionRequest(conversationId, connectionId);

        const result = await chatService.cancelConnectionRequest(connectionId);

        if (result.error) {
          setError(result.error);
          // TODO: Could add rollback logic here if needed
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to cancel connection request'
        );
        // TODO: Could add rollback logic here if needed
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, removeConnectionRequest]
  );

  const removeConnection = useCallback(async () => {
    if (!conversationId) {
      setError('Missing conversation ID to remove connection');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Optimistically update the store immediately for instant UI update
      updateConversationConnectionStatus(conversationId, false, 'ENDED');

      const result = await chatService.removeConnection(conversationId);

      if (result.error) {
        setError(result.error);
        // If there's an error, we could revert the optimistic update here if needed
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to remove connection'
      );
      // If there's an error, we could revert the optimistic update here if needed
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, updateConversationConnectionStatus]);

  return {
    sendConnectionRequest,
    respondToConnectionRequest,
    cancelConnectionRequest,
    removeConnection,
    isLoading,
    error,
  };
}
