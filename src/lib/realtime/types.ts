// Core types for the realtime subscription system

export type SubscriptionCallback<T = any> = (data: T) => void;
export type SubscriptionKey = string;
export type UnsubscribeFn = () => void;

// Subscription configuration
export interface SubscriptionConfig {
  query: any;
  variables?: any;
  key: SubscriptionKey;
}

// Subscription registry entry
export interface SubscriptionEntry {
  subscription: any; // The actual AppSync subscription
  callbacks: Set<SubscriptionCallback>;
  config: SubscriptionConfig;
}

// Error types
export interface SubscriptionError {
  key: SubscriptionKey;
  error: any;
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
