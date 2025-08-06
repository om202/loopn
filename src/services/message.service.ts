import type { Schema } from '../../amplify/data/resource';
import { getClient } from '../lib/amplify-config';
import { notificationService } from './notification.service';
import { userService } from './user.service';

// Type definitions from schema
type Message = Schema['Message']['type'];
// type _CreateMessageInput = Schema['Message']['createType'];
// type _UpdateMessageInput = Schema['Message']['updateType'];

// Result types
type DataResult<T> = { data: T | null; error: string | null };
type ListResult<T> = { data: T[]; error: string | null };

export class MessageService {
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    replyToMessageId?: string
  ): Promise<DataResult<Message>> {
    try {
      // Get conversation to determine receiverId
      const conversationResult = await getClient().models.Conversation.get({
        id: conversationId,
      });

      if (!conversationResult.data) {
        return {
          data: null,
          error: 'Conversation not found',
        };
      }

      // Determine receiverId (the other participant)
      const receiverId =
        conversationResult.data.participant1Id === senderId
          ? conversationResult.data.participant2Id
          : conversationResult.data.participant1Id;

      const timestamp = new Date();
      const sortKey = `${timestamp.toISOString()}_${crypto.randomUUID()}`;

      // Create the message with proper authorization
      const result = await getClient().models.Message.create({
        conversationId,
        senderId,
        receiverId,
        content,
        messageType: 'TEXT',
        timestamp: timestamp.toISOString(),
        sortKey,
        replyToMessageId,
        // Set participants to include both sender and receiver for authorization
        participants: [senderId, receiverId],
      });

      // Create notification for the receiver (works for both online and offline users)
      if (result.data) {
        try {
          // Get sender's information for notification
          const senderResult = await userService.getUserPresence(senderId);
          const senderEmail = senderResult.data?.email;
          const senderName = senderEmail || `User ${senderId.slice(-4)}`;

          // Truncate long messages for notification
          const notificationContent =
            content.length > 50 ? `${content.substring(0, 50)}...` : content;

          const notificationData = {
            conversationId,
            message: result.data,
            senderEmail,
            messageCount: 1, // Individual message count
          };

          await notificationService.createNotification(
            receiverId,
            'message',
            senderName,
            notificationContent,
            notificationData,
            { conversationId }
          );
        } catch (notificationError) {
          // Don't fail the message send if notification creation fails
          console.error(
            'Failed to create message notification:',
            notificationError
          );
        }
      }

      return {
        data: result.data,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error ? error.message : 'Failed to send message',
      };
    }
  }

  async getConversationMessages(
    conversationId: string,
    limit = 50,
    nextToken?: string
  ): Promise<ListResult<Message> & { nextToken?: string }> {
    try {
      const result = await getClient().models.Message.list({
        filter: {
          conversationId: { eq: conversationId },
        },
        limit,
        nextToken,
      });

      // Sort by timestamp (newest first) - AppSync should handle this via sortKey but ensuring client-side
      const sortedMessages = (result.data || []).sort((a, b) => {
        const timestampA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timestampB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timestampB - timestampA;
      });

      return {
        data: sortedMessages,
        error: null,
        nextToken: result.nextToken || undefined,
      };
    } catch (error) {
      return {
        data: [],
        error:
          error instanceof Error ? error.message : 'Failed to fetch messages',
        nextToken: undefined,
      };
    }
  }

  // New method for getting recent messages (for real-time subscription initialization)
  async getRecentMessages(
    conversationId: string,
    limit = 50
  ): Promise<ListResult<Message>> {
    const result = await this.getConversationMessages(conversationId, limit);
    return {
      data: result.data,
      error: result.error,
    };
  }

  async markMessageAsRead(messageId: string): Promise<DataResult<Message>> {
    try {
      const result = await getClient().models.Message.update({
        id: messageId,
        isRead: true,
        readAt: new Date().toISOString(),
      });

      return {
        data: result.data,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to mark message as read',
      };
    }
  }

  async deleteMessage(messageId: string): Promise<DataResult<void>> {
    try {
      await getClient().models.Message.update({
        id: messageId,
        isDeleted: true,
        deletedAt: new Date().toISOString(),
      });
      return {
        data: null,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error ? error.message : 'Failed to delete message',
      };
    }
  }

  // Real-time message subscription for a conversation
  observeMessages(
    conversationId: string,
    callback: (messages: Message[]) => void,
    onError?: (error: Error) => void
  ) {
    return getClient()
      .models.Message.observeQuery({
        filter: {
          conversationId: { eq: conversationId },
        },
      })
      .subscribe({
        next: data => {
          // Sort messages by timestamp (oldest first for chat display)
          // Create a new array to avoid mutating the original and ensure React detects changes
          const typedData = data as { items: Message[] };
          const sortedMessages = [...typedData.items].sort((a, b) => {
            const timestampA = a.timestamp
              ? new Date(a.timestamp).getTime()
              : 0;
            const timestampB = b.timestamp
              ? new Date(b.timestamp).getTime()
              : 0;
            return timestampA - timestampB;
          });
          callback(sortedMessages);
        },
        error: error => {
          if (onError) {
            onError(error);
          }
        },
      });
  }

  // Subscribe to new messages across all conversations for a user
  subscribeToNewMessages(
    userId: string,
    callback: (message: Message) => void,
    onError?: (error: Error) => void
  ) {
    return getClient()
      .models.Message.onCreate()
      .subscribe({
        next: message => {
          // Only notify for messages not sent by the current user
          if (message.senderId !== userId) {
            callback(message);
          }
        },
        error: error => {
          if (onError) {
            onError(error);
          }
        },
      });
  }
}

export const messageService = new MessageService();
