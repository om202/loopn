import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Schema } from '../../amplify/data/resource';
import type { UnsubscribeFn } from '@/lib/realtime/types';
import { getClient } from '../lib/amplify-config';

// Type definitions
type UserPresence = Schema['UserPresence']['type'];
type UserProfile = Schema['UserProfile']['type'];
type Conversation = Schema['Conversation']['type'];
type ChatRequest = Schema['ChatRequest']['type'];
type Notification = Schema['Notification']['type'];
type Message = Schema['Message']['type'];
type MessageReaction = Schema['MessageReaction']['type'];
type UserConnection = Schema['UserConnection']['type'];

// Subscription configuration
interface SubscriptionConfig {
  key: string;
  query: () => {
    subscribe: (callbacks: {
      next: (data: unknown) => void;
      error: (error: Error) => void;
    }) => { unsubscribe: () => void };
  };
  variables?: Record<string, unknown>;
}

// Subscription entry with reference counting
interface SubscriptionEntry {
  subscription: { unsubscribe: () => void };
  config: SubscriptionConfig;
  refCount: number;
  callbacks: Set<(data: unknown) => void>;
}

// Main store state interface
interface SubscriptionState {
  // Active subscriptions registry
  activeSubscriptions: Map<string, SubscriptionEntry>;

  // Data caches
  onlineUsers: UserPresence[];
  userProfiles: Map<string, UserProfile>; // userId -> profile
  incomingChatRequests: ChatRequest[];
  sentChatRequests: ChatRequest[];
  conversations: Map<string, Conversation>;
  notifications: Notification[];
  messages: Map<string, Message[]>; // conversationId -> messages
  reactions: Map<string, MessageReaction[]>; // messageId -> reactions
  connectionRequests: Map<string, UserConnection[]>; // conversationId -> connection requests

  // Loading states
  loading: {
    onlineUsers: boolean;
    incomingChatRequests: boolean;
    sentChatRequests: boolean;
    conversations: boolean;
    notifications: boolean;
  };

  // Error states
  errors: {
    onlineUsers: string | null;
    incomingChatRequests: string | null;
    sentChatRequests: string | null;
    conversations: string | null;
    notifications: string | null;
  };

  // Actions
  subscribe: (
    key: string,
    config: SubscriptionConfig,
    callback: (data: unknown) => void
  ) => UnsubscribeFn;
  unsubscribe: (key: string, callback: (data: unknown) => void) => void;
  cleanup: () => void;

  // High-level subscription methods
  subscribeToOnlineUsers: (userId: string) => UnsubscribeFn;
  subscribeToIncomingChatRequests: (userId: string) => UnsubscribeFn;
  subscribeToSentChatRequests: (userId: string) => UnsubscribeFn;
  subscribeToNotifications: (userId: string) => UnsubscribeFn;
  subscribeToConversations: (userId: string) => UnsubscribeFn;

  // Data setters
  setOnlineUsers: (users: UserPresence[]) => void;
  setOnlineUsersLoading: (loading: boolean) => void;
  setOnlineUsersError: (error: string | null) => void;

  // Chat request setters
  setIncomingChatRequests: (requests: ChatRequest[]) => void;
  setIncomingChatRequestsLoading: (loading: boolean) => void;
  setIncomingChatRequestsError: (error: string | null) => void;
  setSentChatRequests: (requests: ChatRequest[]) => void;
  setSentChatRequestsLoading: (loading: boolean) => void;
  setSentChatRequestsError: (error: string | null) => void;

  // Notification setters
  setNotifications: (notifications: Notification[]) => void;
  setNotificationsLoading: (loading: boolean) => void;
  setNotificationsError: (error: string | null) => void;

  // User profile methods
  getUserProfile: (userId: string) => UserProfile | null;
  setUserProfile: (userId: string, profile: UserProfile) => void;
  fetchUserProfile: (userId: string) => Promise<UserProfile | null>;

  updateConversations: (conversations: Conversation[]) => void;
  setConversationsLoading: (loading: boolean) => void;
  setConversationsError: (error: string | null) => void;

  updateMessages: (conversationId: string, messages: Message[]) => void;
  updateReactions: (messageId: string, reactions: MessageReaction[]) => void;
  updateConnectionRequests: (
    conversationId: string,
    connections: UserConnection[]
  ) => void;
  getConnectionRequestsForConversation: (
    conversationId: string
  ) => UserConnection[];
  removeConnectionRequest: (
    conversationId: string,
    connectionId: string
  ) => void;

  // Debug helpers
  getStats: () => {
    activeSubscriptions: number;
    subscriptionKeys: string[];
    totalCallbacks: number;
  };
}

// Create the store
export const useSubscriptionStore = create<SubscriptionState>()(
  devtools(
    (set, get) => ({
      // Initial state
      activeSubscriptions: new Map(),
      onlineUsers: [],
      userProfiles: new Map(),
      incomingChatRequests: [],
      sentChatRequests: [],
      conversations: new Map(),
      notifications: [],
      messages: new Map(),
      reactions: new Map(),
      connectionRequests: new Map(),

      loading: {
        onlineUsers: false,
        incomingChatRequests: false,
        sentChatRequests: false,
        conversations: false,
        notifications: false,
      },

      errors: {
        onlineUsers: null,
        incomingChatRequests: null,
        sentChatRequests: null,
        conversations: null,
        notifications: null,
      },

      // Subscription management with reference counting
      subscribe: (
        key: string,
        config: SubscriptionConfig,
        callback: (data: unknown) => void
      ) => {
        const state = get();
        const existing = state.activeSubscriptions.get(key);

        if (existing) {
          // Increment reference count and add callback
          existing.refCount++;
          existing.callbacks.add(callback);

          console.log(
            `[SubscriptionStore] Reusing subscription ${key}, refCount: ${existing.refCount}`
          );

          // Return unsubscribe function
          return () => {
            get().unsubscribe(key, callback);
          };
        }

        try {
          // Create new subscription
          const observable = config.query();
          const subscription = observable.subscribe({
            next: (data: unknown) => {
              const currentEntry = get().activeSubscriptions.get(key);
              if (currentEntry) {
                // Notify all callbacks
                currentEntry.callbacks.forEach(cb => {
                  try {
                    cb(data);
                  } catch (error) {
                    console.error(
                      `[SubscriptionStore] Callback error for ${key}:`,
                      error
                    );
                  }
                });
              }
            },
            error: (error: Error) => {
              console.error(
                `[SubscriptionStore] Subscription error for ${key}:`,
                error
              );
              // Clean up failed subscription
              get().cleanup();
            },
          });

          // Create subscription entry
          const entry: SubscriptionEntry = {
            subscription,
            config,
            refCount: 1,
            callbacks: new Set([callback]),
          };

          // Update store
          set(state => ({
            activeSubscriptions: new Map(state.activeSubscriptions).set(
              key,
              entry
            ),
          }));

          console.log(`[SubscriptionStore] Created subscription ${key}`);

          // Return unsubscribe function
          return () => {
            get().unsubscribe(key, callback);
          };
        } catch (error) {
          console.error(
            `[SubscriptionStore] Failed to create subscription ${key}:`,
            error
          );
          return () => {}; // Return no-op function
        }
      },

      unsubscribe: (key: string, callback: (data: unknown) => void) => {
        const state = get();
        const entry = state.activeSubscriptions.get(key);

        if (!entry) return;

        // Remove callback and decrement reference count
        entry.callbacks.delete(callback);
        entry.refCount--;

        console.log(
          `[SubscriptionStore] Unsubscribing from ${key}, refCount: ${entry.refCount}`
        );

        if (entry.refCount <= 0) {
          // No more references, clean up subscription
          try {
            entry.subscription.unsubscribe();
          } catch (error) {
            console.error(
              `[SubscriptionStore] Error unsubscribing ${key}:`,
              error
            );
          }

          // Remove from store
          const newSubscriptions = new Map(state.activeSubscriptions);
          newSubscriptions.delete(key);

          set({ activeSubscriptions: newSubscriptions });

          console.log(`[SubscriptionStore] Cleaned up subscription ${key}`);
        }
      },

      cleanup: () => {
        const state = get();

        // Unsubscribe from all active subscriptions
        state.activeSubscriptions.forEach((entry, key) => {
          try {
            entry.subscription.unsubscribe();
          } catch (error) {
            console.error(
              `[SubscriptionStore] Error cleaning up ${key}:`,
              error
            );
          }
        });

        // Clear all subscriptions
        set({ activeSubscriptions: new Map() });

        console.log('[SubscriptionStore] Cleaned up all subscriptions');
      },

      // Data setters
      setOnlineUsers: (users: UserPresence[]) => {
        set({ onlineUsers: users });
      },

      setOnlineUsersLoading: (loading: boolean) => {
        set(state => ({
          loading: { ...state.loading, onlineUsers: loading },
        }));
      },

      setOnlineUsersError: (error: string | null) => {
        set(state => ({
          errors: { ...state.errors, onlineUsers: error },
        }));
      },

      // Chat request setters
      setIncomingChatRequests: (requests: ChatRequest[]) => {
        set({ incomingChatRequests: requests });
      },

      setIncomingChatRequestsLoading: (loading: boolean) => {
        set(state => ({
          loading: { ...state.loading, incomingChatRequests: loading },
        }));
      },

      setIncomingChatRequestsError: (error: string | null) => {
        set(state => ({
          errors: { ...state.errors, incomingChatRequests: error },
        }));
      },

      setSentChatRequests: (requests: ChatRequest[]) => {
        set({ sentChatRequests: requests });
      },

      setSentChatRequestsLoading: (loading: boolean) => {
        set(state => ({
          loading: { ...state.loading, sentChatRequests: loading },
        }));
      },

      setSentChatRequestsError: (error: string | null) => {
        set(state => ({
          errors: { ...state.errors, sentChatRequests: error },
        }));
      },

      // Notification setters
      setNotifications: (notifications: Notification[]) => {
        set({ notifications });
      },

      setNotificationsLoading: (loading: boolean) => {
        set(state => ({
          loading: { ...state.loading, notifications: loading },
        }));
      },

      setNotificationsError: (error: string | null) => {
        set(state => ({
          errors: { ...state.errors, notifications: error },
        }));
      },

      // User profile methods
      getUserProfile: (userId: string) => {
        const state = get();
        return state.userProfiles.get(userId) || null;
      },

      setUserProfile: (userId: string, profile: UserProfile) => {
        set(state => ({
          userProfiles: new Map(state.userProfiles).set(userId, profile),
        }));
      },

      fetchUserProfile: async (userId: string) => {
        const state = get();

        // Return cached profile if available
        const cached = state.userProfiles.get(userId);
        if (cached) {
          return cached;
        }

        try {
          // Import here to avoid circular dependencies
          const { UserProfileService } = await import(
            '../services/user-profile.service'
          );

          const result = await new UserProfileService().getUserProfile(userId);
          if (result.data) {
            // Cache the profile
            get().setUserProfile(userId, result.data);
            return result.data;
          }
          return null;
        } catch (error) {
          console.error(
            `[SubscriptionStore] Error fetching profile for ${userId}:`,
            error
          );
          return null;
        }
      },

      updateConversations: (conversations: Conversation[]) => {
        const conversationMap = new Map<string, Conversation>();
        conversations.forEach(conv => {
          conversationMap.set(conv.id, conv);
        });
        set({ conversations: conversationMap });
      },

      setConversationsLoading: (loading: boolean) => {
        set(state => ({
          loading: { ...state.loading, conversations: loading },
        }));
      },

      setConversationsError: (error: string | null) => {
        set(state => ({
          errors: { ...state.errors, conversations: error },
        }));
      },

      updateMessages: (conversationId: string, messages: Message[]) => {
        set(state => ({
          messages: new Map(state.messages).set(conversationId, messages),
        }));
      },

      updateReactions: (messageId: string, reactions: MessageReaction[]) => {
        set(state => ({
          reactions: new Map(state.reactions).set(messageId, reactions),
        }));
      },

      updateConnectionRequests: (
        conversationId: string,
        connections: UserConnection[]
      ) => {
        set(state => ({
          connectionRequests: new Map(state.connectionRequests).set(
            conversationId,
            connections
          ),
        }));
      },

      getConnectionRequestsForConversation: (conversationId: string) => {
        const state = get();
        return state.connectionRequests.get(conversationId) || [];
      },

      removeConnectionRequest: (
        conversationId: string,
        connectionId: string
      ) => {
        set(state => {
          const currentRequests =
            state.connectionRequests.get(conversationId) || [];
          const filteredRequests = currentRequests.filter(
            req => req.id !== connectionId
          );
          return {
            connectionRequests: new Map(state.connectionRequests).set(
              conversationId,
              filteredRequests
            ),
          };
        });
      },

      // High-level subscription methods
      subscribeToOnlineUsers: (_userId: string) => {
        const key = 'online-users';
        const state = get();
        const existing = state.activeSubscriptions.get(key);

        const config: SubscriptionConfig = {
          key,
          query: () => {
            return getClient().models.UserPresence.observeQuery({});
          },
        };

        const callback = (data: unknown) => {
          const typedData = data as { items: UserPresence[] };
          const { items } = typedData;
          const onlineUsers = items.filter(
            (user: UserPresence) => user.isOnline === true
          );

          // Update the store with new online users
          get().setOnlineUsers(onlineUsers);
          get().setOnlineUsersLoading(false);
          get().setOnlineUsersError(null);
        };

        // Only set loading state if creating a new subscription
        if (!existing) {
          get().setOnlineUsersLoading(true);
          get().setOnlineUsersError(null);
        }

        return get().subscribe(key, config, callback);
      },

      subscribeToIncomingChatRequests: (userId: string) => {
        const key = `incoming-chat-requests-${userId}`;
        const state = get();
        const existing = state.activeSubscriptions.get(key);

        const config: SubscriptionConfig = {
          key,
          query: () => {
            return getClient().models.ChatRequest.observeQuery({
              filter: {
                receiverId: { eq: userId },
              },
            });
          },
        };

        const callback = (data: unknown) => {
          const typedData = data as { items: ChatRequest[] };
          const { items } = typedData;
          // Filter for PENDING requests on the client side
          const pendingRequests = items.filter(
            (request: ChatRequest) => request.status === 'PENDING'
          );

          // Update the store with new incoming chat requests
          get().setIncomingChatRequests(pendingRequests);
          get().setIncomingChatRequestsLoading(false);
          get().setIncomingChatRequestsError(null);
        };

        // Only set loading state if creating a new subscription
        if (!existing) {
          get().setIncomingChatRequestsLoading(true);
          get().setIncomingChatRequestsError(null);
        }

        return get().subscribe(key, config, callback);
      },

      subscribeToSentChatRequests: (userId: string) => {
        const key = `sent-chat-requests-${userId}`;
        const state = get();
        const existing = state.activeSubscriptions.get(key);

        const config: SubscriptionConfig = {
          key,
          query: () => {
            return getClient().models.ChatRequest.observeQuery({
              filter: {
                requesterId: { eq: userId },
              },
            });
          },
        };

        const callback = (data: unknown) => {
          const typedData = data as { items: ChatRequest[] };
          const { items } = typedData;
          // Filter for PENDING requests on the client side
          const pendingRequests = items.filter(
            (request: ChatRequest) => request.status === 'PENDING'
          );

          // Update the store with new sent chat requests
          get().setSentChatRequests(pendingRequests);
          get().setSentChatRequestsLoading(false);
          get().setSentChatRequestsError(null);
        };

        // Only set loading state if creating a new subscription
        if (!existing) {
          get().setSentChatRequestsLoading(true);
          get().setSentChatRequestsError(null);
        }

        return get().subscribe(key, config, callback);
      },

      subscribeToNotifications: (userId: string) => {
        const key = `notifications-${userId}`;
        const state = get();
        const existing = state.activeSubscriptions.get(key);

        const config: SubscriptionConfig = {
          key,
          query: () => {
            return getClient().models.Notification.observeQuery({
              filter: {
                userId: { eq: userId },
                // Remove isRead filter to get all notifications, then filter client-side
              },
            });
          },
        };

        const callback = (data: unknown) => {
          const typedData = data as { items: Notification[] };
          const { items } = typedData;

          // Filter for unread notifications only (client-side)
          const unreadNotifications = items.filter(notif => !notif.isRead);

          // Sort by timestamp descending (newest first)
          const sortedNotifications = unreadNotifications.sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );

          // Parse JSON data field back to objects
          const notificationsWithParsedData = sortedNotifications.map(
            notif => ({
              ...notif,
              data: notif.data ? JSON.parse(notif.data as string) : undefined,
            })
          );

          // Update the store with new notifications
          get().setNotifications(notificationsWithParsedData);
          get().setNotificationsLoading(false);
          get().setNotificationsError(null);
        };

        // Only set loading state if creating a new subscription
        if (!existing) {
          get().setNotificationsLoading(true);
          get().setNotificationsError(null);
        }

        return get().subscribe(key, config, callback);
      },

      subscribeToConversations: (userId: string) => {
        const key = `conversations-${userId}`;
        const state = get();
        const existing = state.activeSubscriptions.get(key);

        const config: SubscriptionConfig = {
          key,
          query: () => {
            return getClient().models.Conversation.observeQuery({
              filter: {
                or: [
                  { participant1Id: { eq: userId } },
                  { participant2Id: { eq: userId } },
                ],
              },
            });
          },
        };

        const callback = (data: unknown) => {
          const typedData = data as { items: Conversation[] };
          const { items } = typedData;

          // Sort conversations by creation date (newest first)
          const sortedConversations = items.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });

          // Update the store with new conversations
          get().updateConversations(sortedConversations);
          get().setConversationsLoading(false);
          get().setConversationsError(null);
        };

        // Only set loading state if creating a new subscription
        if (!existing) {
          get().setConversationsLoading(true);
          get().setConversationsError(null);
        }

        return get().subscribe(key, config, callback);
      },

      // Debug helpers
      getStats: () => {
        const state = get();
        return {
          activeSubscriptions: state.activeSubscriptions.size,
          subscriptionKeys: Array.from(state.activeSubscriptions.keys()),
          totalCallbacks: Array.from(state.activeSubscriptions.values()).reduce(
            (total, entry) => total + entry.callbacks.size,
            0
          ),
        };
      },
    }),
    {
      name: 'subscription-store',
    }
  )
);

// Export types for use in components
export type { SubscriptionState, SubscriptionConfig, SubscriptionEntry };
