import type {
  SubscriptionCallback,
  SubscriptionKey,
  SubscriptionEntry,
  SubscriptionConfig,
  UnsubscribeFn,
  ConnectionStatus,
  ManagerEvents,
} from './types';

class SubscriptionManager {
  private subscriptions = new Map<SubscriptionKey, SubscriptionEntry>();
  private eventListeners = new Map<string, Set<(...args: unknown[]) => void>>();
  private connectionStatus: ConnectionStatus = 'disconnected';

  subscribe<T = unknown>(
    config: SubscriptionConfig,
    callback: SubscriptionCallback<T>
  ): UnsubscribeFn {
    const { key, query } = config;

    if (this.subscriptions.has(key)) {
      const entry = this.subscriptions.get(key)!;
      (entry.callbacks as Set<SubscriptionCallback<T>>).add(callback);

      return this.createUnsubscribeFunction(key, callback);
    }

    try {
      const observable = query();

      const subscription = observable.subscribe({
        next: (data: unknown) => {
          const entry = this.subscriptions.get(key);
          if (entry) {
            entry.callbacks.forEach(cb => {
              try {
                cb(data as T);
              } catch (error) {
                console.error(
                  `[SubscriptionManager] Callback error for ${key}:`,
                  error
                );
              }
            });
          }
        },
        error: (error: Error) => {
          console.error(
            `[SubscriptionManager] Subscription error for ${key}:`,
            error
          );
          this.emit('subscription:error', {
            key,
            error,
            timestamp: new Date(),
          });

          this.cleanupSubscription(key);
        },
      });

      const entry: SubscriptionEntry = {
        subscription,
        callbacks: new Set([callback]) as Set<SubscriptionCallback>,
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

  private createUnsubscribeFunction<T>(
    key: SubscriptionKey,
    callback: SubscriptionCallback<T>
  ): UnsubscribeFn {
    return () => {
      const entry = this.subscriptions.get(key);
      if (!entry) return;

      (entry.callbacks as Set<SubscriptionCallback<T>>).delete(callback);

      if (entry.callbacks.size === 0) {
        this.cleanupSubscription(key);
      }
    };
  }

  private cleanupSubscription(key: SubscriptionKey): void {
    const entry = this.subscriptions.get(key);
    if (!entry) return;

    try {
      entry.subscription.unsubscribe();
    } catch (error) {
      console.error(`[SubscriptionManager] Error unsubscribing ${key}:`, error);
    }

    this.subscriptions.delete(key);
    this.emit('subscription:destroyed', { key });
  }

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

  cleanup(): void {
    Array.from(this.subscriptions.keys()).forEach(key => {
      this.cleanupSubscription(key);
    });

    this.eventListeners.clear();
  }

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

  on<K extends keyof ManagerEvents>(
    event: K,
    listener: (data: ManagerEvents[K]) => void
  ): UnsubscribeFn {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    this.eventListeners
      .get(event)!
      .add(listener as (...args: unknown[]) => void);

    return () => {
      this.eventListeners
        .get(event)
        ?.delete(listener as (...args: unknown[]) => void);
    };
  }
}

export const subscriptionManager = new SubscriptionManager();

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
  connectionRequests: (conversationId: string) =>
    `connectionRequests:${conversationId}`,
};
