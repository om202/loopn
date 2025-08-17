import { useState, useCallback } from 'react';
import { chatService } from '../services/chat.service';

interface UseConnectionActionsProps {
  conversationId: string;
  currentUserId: string;
  otherUserId: string;
}

interface UseConnectionActionsReturn {
  sendConnectionRequest: () => Promise<void>;
  respondToConnectionRequest: (
    connectionId: string,
    status: 'ACCEPTED' | 'REJECTED'
  ) => Promise<void>;
  cancelConnectionRequest: (connectionId: string) => Promise<void>;
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
    async (connectionId: string, status: 'ACCEPTED' | 'REJECTED') => {
      if (!connectionId) {
        setError('Missing connection request ID');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await chatService.respondToConnectionRequest(
          connectionId,
          status
        );

        if (result.error) {
          setError(result.error);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to respond to connection request'
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const cancelConnectionRequest = useCallback(async (connectionId: string) => {
    if (!connectionId) {
      setError('Missing connection request ID');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await chatService.cancelConnectionRequest(connectionId);

      if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to cancel connection request'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    sendConnectionRequest,
    respondToConnectionRequest,
    cancelConnectionRequest,
    isLoading,
    error,
  };
}
