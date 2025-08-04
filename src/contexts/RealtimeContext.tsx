'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import {
  subscriptionManager,
  createSubscriptionKey,
} from '@/lib/realtime/subscription-manager';
import type { SubscriptionCallback, UnsubscribeFn } from '@/lib/realtime/types';

interface RealtimeContextType {
  // Message subscriptions
  subscribeToMessages: (
    conversationId: string,
    callback: SubscriptionCallback
  ) => UnsubscribeFn;

  // User presence subscriptions
  subscribeToPresence: (
    userId: string,
    callback: SubscriptionCallback
  ) => UnsubscribeFn;

  // Notification subscriptions
  subscribeToNotifications: (
    userId: string,
    callback: SubscriptionCallback
  ) => UnsubscribeFn;

  // Reaction subscriptions
  subscribeToReactions: (
    messageIds: string[],
    callback: SubscriptionCallback
  ) => UnsubscribeFn;

  // Chat request subscriptions (incoming)
  subscribeToChatRequests: (
    userId: string,
    callback: SubscriptionCallback
  ) => UnsubscribeFn;

  // Sent chat request subscriptions (outgoing)
  subscribeSentChatRequests: (
    userId: string,
    callback: SubscriptionCallback
  ) => UnsubscribeFn;

  // Conversation subscriptions
  subscribeToConversations: (
    userId: string,
    callback: SubscriptionCallback
  ) => UnsubscribeFn;

  // Online users subscriptions
  subscribeToOnlineUsers: (callback: SubscriptionCallback) => UnsubscribeFn;

  // Get subscription statistics
  getStats: () => any;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

interface RealtimeProviderProps {
  children: React.ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const client = generateClient<Schema>();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      subscriptionManager.cleanup();
    };
  }, []);

  // Message subscriptions
  const subscribeToMessages = (
    conversationId: string,
    callback: SubscriptionCallback
  ): UnsubscribeFn => {
    return subscriptionManager.subscribe(
      {
        key: createSubscriptionKey.messages(conversationId),
        query: () =>
          client.models.Message.observeQuery({
            filter: { conversationId: { eq: conversationId } },
          }),
        variables: { filter: { conversationId: { eq: conversationId } } },
      },
      callback
    );
  };

  // User presence subscriptions
  const subscribeToPresence = (
    userId: string,
    callback: SubscriptionCallback
  ): UnsubscribeFn => {
    return subscriptionManager.subscribe(
      {
        key: createSubscriptionKey.presence(userId),
        query: () =>
          client.models.UserPresence.observeQuery({
            filter: { userId: { eq: userId } },
          }),
        variables: { filter: { userId: { eq: userId } } },
      },
      callback
    );
  };

  // Notification subscriptions
  const subscribeToNotifications = (
    userId: string,
    callback: SubscriptionCallback
  ): UnsubscribeFn => {
    return subscriptionManager.subscribe(
      {
        key: createSubscriptionKey.notifications(userId),
        query: () =>
          client.models.Notification.observeQuery({
            filter: { userId: { eq: userId } },
          }),
        variables: { filter: { userId: { eq: userId } } },
      },
      callback
    );
  };

  // Reaction subscriptions for multiple messages
  const subscribeToReactions = (
    messageIds: string[],
    callback: SubscriptionCallback
  ): UnsubscribeFn => {
    if (messageIds.length === 0) {
      return () => {};
    }

    // For now, subscribe to all reactions without filtering by messageId
    // This is less efficient but will work with AppSync's filter limitations
    // TODO: Optimize this when AppSync supports better filtering
    return subscriptionManager.subscribe(
      {
        key: createSubscriptionKey.reactions(messageIds),
        query: () => client.models.MessageReaction.observeQuery({}),
        variables: {},
      },
      data => {
        // Filter reactions on the client side to only include relevant messages
        if (data.items) {
          const filteredData = {
            ...data,
            items: data.items.filter((reaction: any) =>
              messageIds.includes(reaction.messageId)
            ),
          };
          callback(filteredData);
        } else {
          callback(data);
        }
      }
    );
  };

  // Chat request subscriptions (incoming) - all status changes for proper real-time updates
  const subscribeToChatRequests = (
    userId: string,
    callback: SubscriptionCallback
  ): UnsubscribeFn => {
    return subscriptionManager.subscribe(
      {
        key: createSubscriptionKey.chatRequests(userId),
        query: () =>
          client.models.ChatRequest.observeQuery({
            filter: {
              receiverId: { eq: userId },
            },
          }),
        variables: {
          filter: {
            receiverId: { eq: userId },
          },
        },
      },
      // Filter for PENDING requests on the client side
      data => {
        const filteredData = {
          ...data,
          items: (data.items || []).filter(
            (request: any) => request.status === 'PENDING'
          ),
        };
        callback(filteredData);
      }
    );
  };

  // Sent chat request subscriptions (outgoing) - all status changes for proper real-time updates
  const subscribeSentChatRequests = (
    userId: string,
    callback: SubscriptionCallback
  ): UnsubscribeFn => {
    return subscriptionManager.subscribe(
      {
        key: createSubscriptionKey.sentChatRequests(userId),
        query: () =>
          client.models.ChatRequest.observeQuery({
            filter: {
              requesterId: { eq: userId },
            },
          }),
        variables: {
          filter: { requesterId: { eq: userId } },
        },
      },
      // Filter for PENDING requests on the client side
      data => {
        const filteredData = {
          ...data,
          items: (data.items || []).filter(
            (request: any) => request.status === 'PENDING'
          ),
        };
        callback(filteredData);
      }
    );
  };

  // Conversation subscriptions
  const subscribeToConversations = (
    userId: string,
    callback: SubscriptionCallback
  ): UnsubscribeFn => {
    return subscriptionManager.subscribe(
      {
        key: createSubscriptionKey.conversations(userId),
        query: () =>
          client.models.Conversation.observeQuery({
            filter: {
              or: [
                { participant1Id: { eq: userId } },
                { participant2Id: { eq: userId } },
              ],
            },
          }),
        variables: {
          filter: {
            or: [
              { participant1Id: { eq: userId } },
              { participant2Id: { eq: userId } },
            ],
          },
        },
      },
      callback
    );
  };

  // Online users subscriptions
  const subscribeToOnlineUsers = (
    callback: SubscriptionCallback
  ): UnsubscribeFn => {
    return subscriptionManager.subscribe(
      {
        key: createSubscriptionKey.onlineUsers(),
        query: () =>
          client.models.UserPresence.observeQuery({
            // Remove filter to listen to ALL presence changes (online and offline)
            // We'll filter for online users client-side in the hook
          }),
        variables: {},
      },
      callback
    );
  };

  // Get subscription statistics
  const getStats = () => subscriptionManager.getStats();

  const contextValue: RealtimeContextType = {
    subscribeToMessages,
    subscribeToPresence,
    subscribeToNotifications,
    subscribeToReactions,
    subscribeToChatRequests,
    subscribeSentChatRequests,
    subscribeToConversations,
    subscribeToOnlineUsers,
    getStats,
  };

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime(): RealtimeContextType {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}

// Debug hook for development
export function useRealtimeStats() {
  const { getStats } = useRealtime();
  return getStats();
}
