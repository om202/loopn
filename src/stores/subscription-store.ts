import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Schema } from '../../amplify/data/resource';
import type { UnsubscribeFn } from '@/lib/realtime/types';

// Type definitions
type UserPresence = Schema['UserPresence']['type'];
type Conversation = Schema['Conversation']['type'];
type ChatRequest = Schema['ChatRequest']['type'];
type Notification = Schema['Notification']['type'];
type Message = Schema['Message']['type'];
type MessageReaction = Schema['MessageReaction']['type'];

// Subscription configuration
interface SubscriptionConfig {
  key: string;
  query: () => any;
  variables?: Record<string, unknown>;
}

// Subscription entry with reference counting
interface SubscriptionEntry {
  subscription: { unsubscribe: () => void };
  config: SubscriptionConfig;
  refCount: number;
  callbacks: Set<(data: any) => void>;
}

// Main store state interface
interface SubscriptionState {
  // Active subscriptions registry
  activeSubscriptions: Map<string, SubscriptionEntry>;
  
  // Data caches
  onlineUsers: UserPresence[];
  conversations: Map<string, Conversation>;
  chatRequests: {
    incoming: ChatRequest[];
    sent: ChatRequest[];
  };
  notifications: Notification[];
  messages: Map<string, Message[]>; // conversationId -> messages
  reactions: Map<string, MessageReaction[]>; // messageId -> reactions
  
  // Loading states
  loading: {
    onlineUsers: boolean;
    conversations: boolean;
    chatRequests: boolean;
    notifications: boolean;
  };
  
  // Error states
  errors: {
    onlineUsers: string | null;
    conversations: string | null;
    chatRequests: string | null;
    notifications: string | null;
  };
  
  // Actions
  subscribe: (key: string, config: SubscriptionConfig, callback: (data: any) => void) => UnsubscribeFn;
  unsubscribe: (key: string, callback: (data: any) => void) => void;
  cleanup: () => void;
  
  // Data setters
  setOnlineUsers: (users: UserPresence[]) => void;
  setOnlineUsersLoading: (loading: boolean) => void;
  setOnlineUsersError: (error: string | null) => void;
  
  updateConversations: (conversations: Conversation[]) => void;
  setConversationsLoading: (loading: boolean) => void;
  setConversationsError: (error: string | null) => void;
  
  setChatRequests: (incoming: ChatRequest[], sent: ChatRequest[]) => void;
  setChatRequestsLoading: (loading: boolean) => void;
  setChatRequestsError: (error: string | null) => void;
  
  setNotifications: (notifications: Notification[]) => void;
  setNotificationsLoading: (loading: boolean) => void;
  setNotificationsError: (error: string | null) => void;
  
  updateMessages: (conversationId: string, messages: Message[]) => void;
  updateReactions: (messageId: string, reactions: MessageReaction[]) => void;
  
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
      conversations: new Map(),
      chatRequests: {
        incoming: [],
        sent: [],
      },
      notifications: [],
      messages: new Map(),
      reactions: new Map(),
      
      loading: {
        onlineUsers: false,
        conversations: false,
        chatRequests: false,
        notifications: false,
      },
      
      errors: {
        onlineUsers: null,
        conversations: null,
        chatRequests: null,
        notifications: null,
      },
      
      // Subscription management with reference counting
      subscribe: (key: string, config: SubscriptionConfig, callback: (data: any) => void) => {
        const state = get();
        const existing = state.activeSubscriptions.get(key);
        
        if (existing) {
          // Increment reference count and add callback
          existing.refCount++;
          existing.callbacks.add(callback);
          
          console.log(`[SubscriptionStore] Reusing subscription ${key}, refCount: ${existing.refCount}`);
          
          // Return unsubscribe function
          return () => {
            get().unsubscribe(key, callback);
          };
        }
        
        try {
          // Create new subscription
          const observable = config.query();
          const subscription = observable.subscribe({
            next: (data: any) => {
              const currentEntry = get().activeSubscriptions.get(key);
              if (currentEntry) {
                // Notify all callbacks
                currentEntry.callbacks.forEach(cb => {
                  try {
                    cb(data);
                  } catch (error) {
                    console.error(`[SubscriptionStore] Callback error for ${key}:`, error);
                  }
                });
              }
            },
            error: (error: Error) => {
              console.error(`[SubscriptionStore] Subscription error for ${key}:`, error);
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
            activeSubscriptions: new Map(state.activeSubscriptions).set(key, entry),
          }));
          
          console.log(`[SubscriptionStore] Created subscription ${key}`);
          
          // Return unsubscribe function
          return () => {
            get().unsubscribe(key, callback);
          };
        } catch (error) {
          console.error(`[SubscriptionStore] Failed to create subscription ${key}:`, error);
          return () => {}; // Return no-op function
        }
      },
      
      unsubscribe: (key: string, callback: (data: any) => void) => {
        const state = get();
        const entry = state.activeSubscriptions.get(key);
        
        if (!entry) return;
        
        // Remove callback and decrement reference count
        entry.callbacks.delete(callback);
        entry.refCount--;
        
        console.log(`[SubscriptionStore] Unsubscribing from ${key}, refCount: ${entry.refCount}`);
        
        if (entry.refCount <= 0) {
          // No more references, clean up subscription
          try {
            entry.subscription.unsubscribe();
          } catch (error) {
            console.error(`[SubscriptionStore] Error unsubscribing ${key}:`, error);
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
            console.error(`[SubscriptionStore] Error cleaning up ${key}:`, error);
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
          loading: { ...state.loading, onlineUsers: loading }
        }));
      },
      
      setOnlineUsersError: (error: string | null) => {
        set(state => ({
          errors: { ...state.errors, onlineUsers: error }
        }));
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
          loading: { ...state.loading, conversations: loading }
        }));
      },
      
      setConversationsError: (error: string | null) => {
        set(state => ({
          errors: { ...state.errors, conversations: error }
        }));
      },
      
      setChatRequests: (incoming: ChatRequest[], sent: ChatRequest[]) => {
        set({ chatRequests: { incoming, sent } });
      },
      
      setChatRequestsLoading: (loading: boolean) => {
        set(state => ({
          loading: { ...state.loading, chatRequests: loading }
        }));
      },
      
      setChatRequestsError: (error: string | null) => {
        set(state => ({
          errors: { ...state.errors, chatRequests: error }
        }));
      },
      
      setNotifications: (notifications: Notification[]) => {
        set({ notifications });
      },
      
      setNotificationsLoading: (loading: boolean) => {
        set(state => ({
          loading: { ...state.loading, notifications: loading }
        }));
      },
      
      setNotificationsError: (error: string | null) => {
        set(state => ({
          errors: { ...state.errors, notifications: error }
        }));
      },
      
      updateMessages: (conversationId: string, messages: Message[]) => {
        set(state => ({
          messages: new Map(state.messages).set(conversationId, messages)
        }));
      },
      
      updateReactions: (messageId: string, reactions: MessageReaction[]) => {
        set(state => ({
          reactions: new Map(state.reactions).set(messageId, reactions)
        }));
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
