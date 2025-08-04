import type { Schema } from '../../../amplify/data/resource';

type ChatRequest = Schema['ChatRequest']['type'];
type Message = Schema['Message']['type'];

export interface ChatRequestWithUser extends ChatRequest {
  requesterEmail?: string;
}

export interface MessageNotificationData {
  conversationId: string;
  message: Message;
  senderEmail?: string;
  messageCount: number;
}

export interface Notification {
  id: string;
  type: 'chat_request' | 'message' | 'connection' | 'system' | null | undefined;
  title: string;
  content: string;
  timestamp: string;
  isRead: boolean | null;
  data?: ChatRequestWithUser | MessageNotificationData;
}

export type NotificationFilter =
  | 'all'
  | 'chat_request'
  | 'message'
  | 'connection'
  | 'system';
