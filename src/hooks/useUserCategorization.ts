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
  currentTime,
}: UseUserCategorizationProps) {
  // Helper function to check if a user can reconnect (no backend calls)
  const canUserReconnect = (userId: string): boolean => {
    const conversation = existingConversations.get(userId);
    if (
      !conversation ||
      conversation.chatStatus !== 'ENDED' ||
      !conversation.endedAt
    ) {
      return false;
    }

    // Check if restriction period has ended (3 minutes for testing)
    const endedDate = new Date(conversation.endedAt);
    // TODO: when deploying change to 2 weeks (14 * 24 * 60 * 60 * 1000)
    const canReconnectAt = new Date(endedDate.getTime() + 3 * 60 * 1000); // 3 minutes for testing

    return currentTime >= canReconnectAt;
  };

  // Helper function to get reconnection time remaining
  const getReconnectTimeRemaining = (userId: string): string | null => {
    const conversation = existingConversations.get(userId);
    if (
      !conversation ||
      conversation.chatStatus !== 'ENDED' ||
      !conversation.endedAt
    ) {
      return null;
    }

    const endedDate = new Date(conversation.endedAt);
    // TODO: when deploying change to 2 weeks (14 * 24 * 60 * 60 * 1000)
    const canReconnectAt = new Date(endedDate.getTime() + 3 * 60 * 1000); // 3 minutes for testing

    if (currentTime >= canReconnectAt) {
      return null; // Can reconnect now
    }

    const timeRemaining = canReconnectAt.getTime() - currentTime.getTime();
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor(
      (timeRemaining % (1000 * 60 * 60)) / (1000 * 60)
    );
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Helper functions to categorize users
  const connectionUsers = useMemo(() => {
    // For now, connections is empty since we only have chat trials
    // When permanent connections are implemented, this will filter for permanent connections
    return [];
  }, []);

  const activeChatTrialUsers = useMemo(() => {
    return allUsers.filter(user => {
      const conversation = existingConversations.get(user.userId);
      return conversation && conversation.chatStatus === 'ACTIVE';
    });
  }, [allUsers, existingConversations]);

  const endedChatTrialUsers = useMemo(() => {
    return allUsers.filter(user => {
      const conversation = existingConversations.get(user.userId);
      return conversation && conversation.chatStatus === 'ENDED';
    });
  }, [allUsers, existingConversations]);

  return {
    onlineUsers,
    connectionUsers,
    activeChatTrialUsers,
    endedChatTrialUsers,
    canUserReconnect,
    getReconnectTimeRemaining,
  };
}