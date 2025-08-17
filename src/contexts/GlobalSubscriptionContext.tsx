'use client';

import { createContext, useContext, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useSubscriptionStore } from '../stores/subscription-store';

interface GlobalSubscriptionContextType {
  // This context doesn't expose any methods - it just manages subscriptions globally
  isInitialized: boolean;
}

const GlobalSubscriptionContext = createContext<GlobalSubscriptionContextType>({
  isInitialized: false,
});

interface GlobalSubscriptionProviderProps {
  children: React.ReactNode;
}

/**
 * GlobalSubscriptionProvider automatically sets up and maintains persistent subscriptions
 * for the authenticated user across all page navigation. This prevents the need for
 * individual components to set up their own subscriptions, reducing duplicate GraphQL calls.
 */
export function GlobalSubscriptionProvider({
  children,
}: GlobalSubscriptionProviderProps) {
  const { user, authStatus } = useAuthenticator();
  const {
    subscribeToOnlineUsers,
    subscribeToIncomingChatRequests,
    subscribeToSentChatRequests,
    subscribeToNotifications,
    subscribeToConversations,
    cleanup,
  } = useSubscriptionStore();

  // Set up persistent subscriptions when user is authenticated
  useEffect(() => {
    if (authStatus !== 'authenticated' || !user?.userId) {
      return;
    }

    console.log(
      '[GlobalSubscriptionProvider] Setting up persistent subscriptions for user:',
      user.userId
    );

    // Set up all core subscriptions that should persist across page navigation
    const unsubscribeOnlineUsers = subscribeToOnlineUsers(user.userId);
    const unsubscribeIncomingRequests = subscribeToIncomingChatRequests(
      user.userId
    );
    const unsubscribeSentRequests = subscribeToSentChatRequests(user.userId);
    const unsubscribeNotifications = subscribeToNotifications(user.userId);
    const unsubscribeConversations = subscribeToConversations(user.userId);

    console.log(
      '[GlobalSubscriptionProvider] All persistent subscriptions established'
    );

    // Cleanup when user logs out or component unmounts
    return () => {
      console.log(
        '[GlobalSubscriptionProvider] Cleaning up persistent subscriptions'
      );
      unsubscribeOnlineUsers();
      unsubscribeIncomingRequests();
      unsubscribeSentRequests();
      unsubscribeNotifications();
      unsubscribeConversations();
    };
  }, [
    authStatus,
    user?.userId,
    subscribeToOnlineUsers,
    subscribeToIncomingChatRequests,
    subscribeToSentChatRequests,
    subscribeToNotifications,
    subscribeToConversations,
  ]);

  // Cleanup all subscriptions when user logs out
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      console.log(
        '[GlobalSubscriptionProvider] User logged out, cleaning up all subscriptions'
      );
      cleanup();
    }
  }, [authStatus, cleanup]);

  const contextValue: GlobalSubscriptionContextType = {
    isInitialized: authStatus === 'authenticated' && !!user?.userId,
  };

  return (
    <GlobalSubscriptionContext.Provider value={contextValue}>
      {children}
    </GlobalSubscriptionContext.Provider>
  );
}

export function useGlobalSubscriptions(): GlobalSubscriptionContextType {
  const context = useContext(GlobalSubscriptionContext);
  if (!context) {
    throw new Error(
      'useGlobalSubscriptions must be used within a GlobalSubscriptionProvider'
    );
  }
  return context;
}
