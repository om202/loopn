import { useMemo } from 'react';
import { useSubscriptionStore } from '../stores/subscription-store';
import type { Schema } from '../../amplify/data/resource';

type Conversation = Schema['Conversation']['type'];

interface UseConversationsProps {
  userId: string;
  enabled: boolean;
}

interface UseConversationsReturn {
  conversations: Map<string, Conversation>;
  conversationsArray: Conversation[];
  isLoading: boolean;
  error: string | null;
  getConversationById: (conversationId: string) => Conversation | null;
  getConversationByParticipant: (participantId: string) => Conversation | null;
  getConversationMap: () => Map<string, Conversation>;
}

export function useConversations({
  userId,
  enabled: _enabled,
}: UseConversationsProps): UseConversationsReturn {
  const { conversations, loading, errors } = useSubscriptionStore();

  // Note: Subscriptions are now managed globally by GlobalSubscriptionProvider
  // This hook just provides access to the cached data

  const isLoading = loading.conversations;
  const error = errors.conversations;

  // Convert Map to Array for easier iteration
  const conversationsArray = useMemo(() => {
    return Array.from(conversations.values());
  }, [conversations]);

  // Helper function to get conversation by ID
  const getConversationById = (conversationId: string): Conversation | null => {
    return conversations.get(conversationId) || null;
  };

  // Helper function to get conversation by participant ID
  const getConversationByParticipant = (
    participantId: string
  ): Conversation | null => {
    for (const conversation of conversations.values()) {
      const otherUserId =
        conversation.participant1Id === userId
          ? conversation.participant2Id
          : conversation.participant1Id;

      if (otherUserId === participantId) {
        return conversation;
      }
    }
    return null;
  };

  // Helper function to get the full conversation map
  const getConversationMap = (): Map<string, Conversation> => {
    return conversations;
  };

  return {
    conversations,
    conversationsArray,
    isLoading,
    error,
    getConversationById,
    getConversationByParticipant,
    getConversationMap,
  };
}
