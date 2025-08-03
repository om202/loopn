// Simple test file to verify subscription manager works
// You can delete this file after testing

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import {
  subscriptionManager,
  createSubscriptionKey,
} from './subscription-manager';

const client = generateClient<Schema>();

export const testMessageSubscription = (conversationId: string) => {
  console.log('Testing message subscription for conversation:', conversationId);

  const unsubscribe = subscriptionManager.subscribe(
    {
      key: createSubscriptionKey.messages(conversationId),
      query: () =>
        client.models.Message.observeQuery({
          filter: { conversationId: { eq: conversationId } },
        }),
      variables: { filter: { conversationId: { eq: conversationId } } },
    },
    data => {
      console.log('📨 New message data received:', data);
    }
  );

  // Return stats and unsubscribe function for testing
  return {
    unsubscribe,
    getStats: () => subscriptionManager.getStats(),
  };
};

export const testPresenceSubscription = (userId: string) => {
  console.log('Testing presence subscription for user:', userId);

  const unsubscribe = subscriptionManager.subscribe(
    {
      key: createSubscriptionKey.presence(userId),
      query: () =>
        client.models.UserPresence.observeQuery({
          filter: { userId: { eq: userId } },
        }),
      variables: { filter: { userId: { eq: userId } } },
    },
    data => {
      console.log('👤 Presence data received:', data);
    }
  );

  return {
    unsubscribe,
    getStats: () => subscriptionManager.getStats(),
  };
};
