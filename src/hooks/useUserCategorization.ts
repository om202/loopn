'use client';

import { useMemo } from 'react';

import type { Schema } from '../../amplify/data/resource';

type UserPresence = Schema['UserPresence']['type'];
type Conversation = Schema['Conversation']['type'];

interface UseUserCategorizationProps {
  onlineUsers: UserPresence[];
  allUsers: UserPresence[];
  existingConversations: Map<string, Conversation>;
}

export function useUserCategorization({
  onlineUsers,
  allUsers,
  existingConversations,
}: UseUserCategorizationProps) {
  // Helper functions to categorize users - simplified for permanent connections
  const connectionUsers = useMemo(() => {
    // All users with existing conversations (all conversations are now permanent)
    return allUsers.filter(user => {
      const conversation = existingConversations.get(user.userId);
      return conversation; // No need to check isConnected - all conversations are permanent
    });
  }, [allUsers, existingConversations]);

  return {
    onlineUsers,
    connectionUsers,
  };
}
