import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRealtime } from '@/contexts/RealtimeContext';
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
  addOptimisticReaction: (messageId: string, reaction: MessageReaction) => void;
  removeOptimisticReaction: (messageId: string, reactionId: string) => void;
  updateReactionsForMessage: (
    messageId: string,
    reactions: MessageReaction[]
  ) => void;
}

/**
 * Hook for subscribing to message reactions with batch loading and real-time updates
 */
export function useRealtimeReactions({
  messageIds,
  currentUserId,
  enabled = true,
}: UseRealtimeReactionsProps): UseRealtimeReactionsReturn {
  const { subscribeToReactions } = useRealtime();

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

  // Load initial batch reactions when new messages appear
  useEffect(() => {
    const loadReactionsForNewMessages = async () => {
      if (stableMessageIds.length === 0 || !enabled) {
        setIsLoading(false);
        return;
      }

      const messageIdsToLoad = stableMessageIds.filter(
        msgId => !loadedMessageIds.has(msgId)
      );

      if (messageIdsToLoad.length === 0) {
        setIsLoading(false);
        return;
      }

      console.log(
        `[useRealtimeReactions] Loading reactions for ${messageIdsToLoad.length} new messages`
      );
      setIsLoading(true);

      try {
        const result =
          await reactionService.getBatchMessageReactions(messageIdsToLoad);

        if (result.error) {
          console.error('Error loading batch reactions:', result.error);
          setError('Failed to load reactions');
        } else {
          messageIdsToLoad.forEach(messageId => {
            loadedMessageIds.add(messageId);
          });

          const newReactionsMap = result.data;
          setMessageReactions(prev => ({ ...prev, ...newReactionsMap }));
          setError(null);
        }
      } catch (err) {
        console.error('Network error loading reactions:', err);
        setError('Failed to load reactions');
      }

      setIsLoading(false);
    };

    loadReactionsForNewMessages();
  }, [stableMessageIds, enabled, loadedMessageIds]);

  // Subscribe to real-time reaction changes
  useEffect(() => {
    if (stableMessageIds.length === 0 || !enabled) {
      return;
    }

    console.log(
      `[useRealtimeReactions] Setting up reactions subscription for ${stableMessageIds.length} messages`
    );

    const unsubscribe = subscribeToReactions(stableMessageIds, data => {
      try {
        // Handle the observeQuery format from AppSync
        const typedData = data as { items?: MessageReaction[] };
        const reactions = typedData.items || [];

        console.log(
          `[useRealtimeReactions] Received ${reactions.length} reactions update`
        );

        // Update all reactions for messages in this update
        setMessageReactions(prev => {
          const updated = { ...prev };

          // Group reactions by messageId
          const reactionsByMessage: Record<string, MessageReaction[]> = {};

          reactions.forEach((reaction: MessageReaction) => {
            if (!reactionsByMessage[reaction.messageId]) {
              reactionsByMessage[reaction.messageId] = [];
            }
            reactionsByMessage[reaction.messageId].push(reaction);
          });

          // Update the state with new reactions
          Object.keys(reactionsByMessage).forEach(messageId => {
            updated[messageId] = reactionsByMessage[messageId];
          });

          return updated;
        });
      } catch (err) {
        console.error(
          '[useRealtimeReactions] Error processing reaction data:',
          err
        );
        setError('Failed to process reaction updates');
      }
    });

    return () => {
      console.log('[useRealtimeReactions] Cleaning up reactions subscription');
      unsubscribe();
    };
  }, [stableMessageIds, currentUserId, enabled, subscribeToReactions]);

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
    addOptimisticReaction,
    removeOptimisticReaction,
    updateReactionsForMessage,
  };
}
