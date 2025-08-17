import { useState, useEffect, useCallback } from 'react';
import { useRealtime } from '../../contexts/RealtimeContext';
import type { Schema } from '../../../amplify/data/resource';

type UserConnection = Schema['UserConnection']['type'];

interface UseRealtimeConnectionRequestsProps {
  conversationId: string;
  enabled?: boolean;
}

interface UseRealtimeConnectionRequestsReturn {
  connectionRequests: UserConnection[];
  isLoading: boolean;
  error: string | null;
  pendingRequest: UserConnection | null;
  hasAcceptedConnection: boolean;
}

export function useRealtimeConnectionRequests({
  conversationId,
  enabled = true,
}: UseRealtimeConnectionRequestsProps): UseRealtimeConnectionRequestsReturn {
  const { subscribeToConnectionRequests } = useRealtime();

  const [connectionRequests, setConnectionRequests] = useState<
    UserConnection[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId || !enabled) {
      setConnectionRequests([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToConnectionRequests(conversationId, data => {
      try {
        const typedData = data as { items?: UserConnection[] };
        const requests = typedData.items || [];

        setConnectionRequests(requests);
        setIsLoading(false);
        setError(null);
      } catch (err) {
        console.error(
          '[useRealtimeConnectionRequests] Error processing connection request data:',
          err
        );
        setError('Failed to load connection requests');
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [conversationId, enabled, subscribeToConnectionRequests]);

  // Get the pending connection request (if any)
  const pendingRequest = useCallback(() => {
    return connectionRequests.find(req => req.status === 'PENDING') || null;
  }, [connectionRequests]);

  // Check if there's an accepted connection
  const hasAcceptedConnection = useCallback(() => {
    return connectionRequests.some(req => req.status === 'ACCEPTED');
  }, [connectionRequests]);

  return {
    connectionRequests,
    isLoading,
    error,
    pendingRequest: pendingRequest(),
    hasAcceptedConnection: hasAcceptedConnection(),
  };
}
