import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import type {
  SubscriptionCallback,
  SubscriptionKey,
  SubscriptionEntry,
  SubscriptionConfig,
  UnsubscribeFn,
  ConnectionStatus,
  ManagerEvents,
} from './types';

/**
 * Centralized subscription manager for AppSync GraphQL subscriptions
 * Manages subscription lifecycle, deduplication, and cleanup
 */
class SubscriptionManager {
  private client = generateClient<Schema>();
  private subscriptions = new Map<SubscriptionKey, SubscriptionEntry>();
  private eventListeners = new Map<keyof ManagerEvents, Set<Function>>();
  private connectionStatus: ConnectionStatus = 'disconnected';

  /**
   * Subscribe to a model's observeQuery with automatic deduplication
   */
  subscribe<T = any>(
    config: SubscriptionConfig,
    callback: SubscriptionCallback<T>
  ): UnsubscribeFn {
    const { key, query, variables } = config;

    // If subscription already exists, just add the callback
    if (this.subscriptions.has(key)) {
      const entry = this.subscriptions.get(key)!;
      entry.callbacks.add(callback);

      console.log(
        `[SubscriptionManager] Added callback to existing subscription: ${key}`
      );

      return this.createUnsubscribeFunction(key, callback);
    }

    // Create new subscription
    console.log(`[SubscriptionManager] Creating new subscription: ${key}`);

    try {
      // Call the query function to get the observable
      const observable = query();

      // Subscribe to the observable
      const subscription = observable.subscribe({
        next: (data: any) => {
          const entry = this.subscriptions.get(key);
          if (entry) {
            // Notify all callbacks for this subscription
            entry.callbacks.forEach(cb => {
              try {
                cb(data);
              } catch (error) {
                console.error(
                  `[SubscriptionManager] Callback error for ${key}:`,
                  error
                );
              }
            });
          }
        },
        error: (error: any) => {
          console.error(
            `[SubscriptionManager] Subscription error for ${key}:`,
            error
          );
          this.emit('subscription:error', {
            key,
            error,
            timestamp: new Date(),
          });

          // Clean up failed subscription
          this.cleanupSubscription(key);
        },
      });

      // Store subscription entry
      const entry: SubscriptionEntry = {
        subscription,
        callbacks: new Set([callback]),
        config,
      };

      this.subscriptions.set(key, entry);
      this.emit('subscription:created', { key });

      return this.createUnsubscribeFunction(key, callback);
    } catch (error) {
      console.error(
        `[SubscriptionManager] Failed to create subscription ${key}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Create unsubscribe function for a specific callback
   */
  private createUnsubscribeFunction(
    key: SubscriptionKey,
    callback: SubscriptionCallback
  ): UnsubscribeFn {
    return () => {
      const entry = this.subscriptions.get(key);
      if (!entry) return;

      // Remove this specific callback
      entry.callbacks.delete(callback);

      console.log(
        `[SubscriptionManager] Removed callback from ${key}. Remaining: ${entry.callbacks.size}`
      );

      // If no more callbacks, clean up the subscription
      if (entry.callbacks.size === 0) {
        this.cleanupSubscription(key);
      }
    };
  }

  /**
   * Clean up and remove a subscription
   */
  private cleanupSubscription(key: SubscriptionKey): void {
    const entry = this.subscriptions.get(key);
    if (!entry) return;

    console.log(`[SubscriptionManager] Cleaning up subscription: ${key}`);

    try {
      entry.subscription.unsubscribe();
    } catch (error) {
      console.error(`[SubscriptionManager] Error unsubscribing ${key}:`, error);
    }

    this.subscriptions.delete(key);
    this.emit('subscription:destroyed', { key });
  }

  /**
   * Get subscription statistics
   */
  getStats() {
    return {
      activeSubscriptions: this.subscriptions.size,
      subscriptionKeys: Array.from(this.subscriptions.keys()),
      connectionStatus: this.connectionStatus,
      totalCallbacks: Array.from(this.subscriptions.values()).reduce(
        (total, entry) => total + entry.callbacks.size,
        0
      ),
    };
  }

  /**
   * Clean up all subscriptions (useful for app cleanup)
   */
  cleanup(): void {
    console.log(
      `[SubscriptionManager] Cleaning up all ${this.subscriptions.size} subscriptions`
    );

    Array.from(this.subscriptions.keys()).forEach(key => {
      this.cleanupSubscription(key);
    });

    this.eventListeners.clear();
  }

  /**
   * Event emitter functionality
   */
  private emit<K extends keyof ManagerEvents>(
    event: K,
    data: ManagerEvents[K]
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`[SubscriptionManager] Event listener error:`, error);
        }
      });
    }
  }

  /**
   * Add event listener
   */
  on<K extends keyof ManagerEvents>(
    event: K,
    listener: (data: ManagerEvents[K]) => void
  ): UnsubscribeFn {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    this.eventListeners.get(event)!.add(listener);

    return () => {
      this.eventListeners.get(event)?.delete(listener);
    };
  }
}

// Export singleton instance
export const subscriptionManager = new SubscriptionManager();

// Helper functions for creating subscription keys
export const createSubscriptionKey = {
  messages: (conversationId: string) => `messages:${conversationId}`,
  presence: (userId: string) => `presence:${userId}`,
  notifications: (userId: string) => `notifications:${userId}`,
  reactions: (messageIds: string[]) =>
    `reactions:${messageIds.sort().join(',')}`,
  chatRequests: (userId: string) => `chatRequests:${userId}`,
  sentChatRequests: (userId: string) => `sentChatRequests:${userId}:PENDING`,
  conversations: (userId: string) => `conversations:${userId}`,
  onlineUsers: () => 'onlineUsers:global',
};
