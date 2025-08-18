import { useEffect, useState, useCallback, useMemo } from 'react';
// import { useRealtime } from '@/contexts/RealtimeContext';
import { reactionService } from '@/services/reaction.service';
import type { Schema } from '../../../amplify/data/resource';

type MessageReaction = Schema['MessageReaction']['type'];

interface UseRealtimeReactionsProps {
  messageIds: string[];
  currentUserId: string;
  enabled?: boolean;
}

interface UseRealtimeReactionsReturn {
  messageReactions: Record<string, MessageReaction[]>;
  isLoading: boolean;
  error: string | null;
  // Utility functions
  getReactionsForMessage: (messageId: string) => MessageReaction[];
  loadReactionsForMessage: (messageId: string) => Promise<void>;
  addOptimisticReaction: (messageId: string, reaction: MessageReaction) => void;
  removeOptimisticReaction: (messageId: string, reactionId: string) => void;
  updateReactionsForMessage: (
    messageId: string,
    reactions: MessageReaction[]
  ) => void;
}

/**
 * Hook for subscribing to message reactions with lazy loading and real-time updates
 * Only loads reactions when actually needed (e.g., when user interacts with reactions)
 */
export function useRealtimeReactions({
  messageIds,
  currentUserId: _currentUserId,
  enabled = true,
}: UseRealtimeReactionsProps): UseRealtimeReactionsReturn {
  const [messageReactions, setMessageReactions] = useState<
    Record<string, MessageReaction[]>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedMessageIds] = useState(() => new Set<string>());

  // Memoize messageIds to prevent unnecessary re-subscriptions based on content, not reference
  const messageIdsKey = messageIds.join(',');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableMessageIds = useMemo(() => messageIds, [messageIdsKey]);

  // Lazy load reactions only when needed (don't load all reactions upfront)
  const loadReactionsForMessage = useCallback(
    async (messageId: string) => {
      if (!enabled || loadedMessageIds.has(messageId)) {
        return;
      }

      setIsLoading(true);
      try {
        const result = await reactionService.getMessageReactions(messageId);

        if (result.error) {
          console.error(
            'Error loading reactions for message:',
            messageId,
            result.error
          );
          setError('Failed to load reactions');
        } else {
          loadedMessageIds.add(messageId);
          setMessageReactions(prev => ({
            ...prev,
            [messageId]: result.data || [],
          }));
          setError(null);
        }
      } catch (err) {
        console.error('Network error loading reactions:', err);
        setError('Failed to load reactions');
      }
      setIsLoading(false);
    },
    [enabled, loadedMessageIds]
  );

  // Only initialize empty reaction arrays for messages (no upfront loading)
  useEffect(() => {
    if (stableMessageIds.length === 0 || !enabled) {
      return;
    }

    // Initialize empty arrays for new messages (no API calls)
    const newReactions: Record<string, MessageReaction[]> = {};
    stableMessageIds.forEach(messageId => {
      if (!messageReactions[messageId]) {
        newReactions[messageId] = [];
      }
    });

    if (Object.keys(newReactions).length > 0) {
      setMessageReactions(prev => ({ ...prev, ...newReactions }));
    }
  }, [stableMessageIds, enabled, messageReactions]);

  // Utility functions (memoized to prevent infinite loops)
  const getReactionsForMessage = useCallback(
    (messageId: string): MessageReaction[] => {
      return messageReactions[messageId] || [];
    },
    [messageReactions]
  );

  const addOptimisticReaction = useCallback(
    (messageId: string, reaction: MessageReaction) => {
      setMessageReactions(prev => {
        const currentReactions = prev[messageId] || [];
        return {
          ...prev,
          [messageId]: [...currentReactions, reaction],
        };
      });
    },
    []
  );

  const removeOptimisticReaction = useCallback(
    (messageId: string, reactionId: string) => {
      setMessageReactions(prev => {
        const currentReactions = prev[messageId] || [];
        return {
          ...prev,
          [messageId]: currentReactions.filter(r => r.id !== reactionId),
        };
      });
    },
    []
  );

  const updateReactionsForMessage = useCallback(
    (messageId: string, reactions: MessageReaction[]) => {
      setMessageReactions(prev => ({
        ...prev,
        [messageId]: reactions,
      }));
    },
    []
  );

  return {
    messageReactions,
    isLoading,
    error,
    getReactionsForMessage,
    loadReactionsForMessage,
    addOptimisticReaction,
    removeOptimisticReaction,
    updateReactionsForMessage,
  };
}
