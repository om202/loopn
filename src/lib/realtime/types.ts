// Core types for the realtime subscription system

export type SubscriptionCallback<T = unknown> = (data: T) => void;
export type SubscriptionKey = string;
export type UnsubscribeFn = () => void;

// Subscription configuration
export interface SubscriptionConfig {
  query: () => { subscribe: (observer: { next: (data: unknown) => void; error: (error: Error) => void }) => { unsubscribe: () => void } };
  variables?: Record<string, unknown>;
  key: SubscriptionKey;
}

// Subscription registry entry
export interface SubscriptionEntry {
  subscription: { unsubscribe: () => void }; // The actual AppSync subscription
  callbacks: Set<SubscriptionCallback>;
  config: SubscriptionConfig;
}

// Error types
export interface SubscriptionError {
  key: SubscriptionKey;
  error: Error;
  timestamp: Date;
}

// Connection status
export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'reconnecting';

// Manager events
export interface ManagerEvents {
  'subscription:created': { key: SubscriptionKey };
  'subscription:destroyed': { key: SubscriptionKey };
  'subscription:error': SubscriptionError;
  'connection:status': { status: ConnectionStatus };
}
