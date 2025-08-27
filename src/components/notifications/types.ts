import type { Schema } from '../../../amplify/data/resource';

type ChatRequest = Schema['ChatRequest']['type'];
type Message = Schema['Message']['type'];

export interface ChatRequestWithUser extends ChatRequest {
  requesterEmail?: string;
  requesterProfile?: {
    fullName?: string;
    email?: string;
    profilePictureUrl?: string;
    hasProfilePicture?: boolean;
  };
}

export interface MessageNotificationData {
  conversationId: string;
  message: Message;
  senderEmail?: string;
  messageCount: number;
  senderProfile?: {
    fullName?: string;
    email?: string;
    profilePictureUrl?: string;
    hasProfilePicture?: boolean;
  };
}

export interface ConnectionRequestNotificationData {
  connectionRequestId: string;
  requesterId: string;
  conversationId: string;
}

// Raw Amplify-generated type
type AmplifyNotification = Schema['Notification']['type'];

// Processed notification type with parsed data
export interface Notification extends Omit<AmplifyNotification, 'data'> {
  data?:
    | ChatRequestWithUser
    | MessageNotificationData
    | ConnectionRequestNotificationData;
}

// Connection request notification - a virtual notification for displaying connection requests
export interface ChatRequestNotification {
  id: string;
  type: 'chat_request';
  title: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  data: ChatRequestWithUser;
}

// Union type for all notifications used in the UI
export type UINotification = Notification | ChatRequestNotification;

export type NotificationFilter =
  | 'all'
  | 'chat_request'
  | 'message'
  | 'connection'
  | 'system';
