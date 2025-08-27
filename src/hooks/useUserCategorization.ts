'use client';

import { useMemo } from 'react';

import type { Schema } from '../../amplify/data/resource';

type UserPresence = Schema['UserPresence']['type'];
type Conversation = Schema['Conversation']['type'];

interface UseUserCategorizationProps {
  onlineUsers: UserPresence[];
  allUsers: UserPresence[];
  existingConversations: Map<string, Conversation>;
  currentTime: Date;
}

export function useUserCategorization({
  onlineUsers,
  allUsers,
  existingConversations,
  currentTime: _currentTime, // No longer needed for permanent connections
}: UseUserCategorizationProps) {
  // Helper functions to categorize users - simplified for permanent connections
  const connectionUsers = useMemo(() => {
    // All users with existing conversations (all are now permanent by default)
    return allUsers.filter(user => {
      const conversation = existingConversations.get(user.userId);
      return conversation && conversation.isConnected === true;
    });
  }, [allUsers, existingConversations]);

  return {
    onlineUsers,
    connectionUsers,
  };
}
