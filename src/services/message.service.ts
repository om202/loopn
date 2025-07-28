import type { Schema } from '../../amplify/data/resource';
import { client } from '../lib/amplify-config';

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
      const conversationResult = await client.models.Conversation.get({
        id: conversationId,
      });

      if (!conversationResult.data) {
        return {
          data: null,
          error: 'Conversation not found',
        };
      }

      // Determine receiverId (the other participant)
      const receiverId = conversationResult.data.participant1Id === senderId
        ? conversationResult.data.participant2Id
        : conversationResult.data.participant1Id;

      const timestamp = new Date();
      const sortKey = `${timestamp.toISOString()}_${crypto.randomUUID()}`;

      const result = await client.models.Message.create({
        conversationId,
        senderId,
        receiverId,
        content,
        messageType: 'TEXT',
        timestamp: timestamp.toISOString(),
        sortKey,
        replyToMessageId,
      });

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
    limit = 50
  ): Promise<ListResult<Message>> {
    try {
      const result = await client.models.Message.list({
        filter: {
          conversationId: { eq: conversationId },
        },
        limit,
      });

      // Sort by timestamp (newest first)
      const sortedMessages = (result.data || []).sort((a, b) => {
        const timestampA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timestampB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timestampB - timestampA;
      });

      return {
        data: sortedMessages,
        error: null,
      };
    } catch (error) {
      return {
        data: [],
        error:
          error instanceof Error ? error.message : 'Failed to fetch messages',
      };
    }
  }

  async markMessageAsRead(messageId: string): Promise<DataResult<Message>> {
    try {
      const result = await client.models.Message.update({
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
      await client.models.Message.delete({ id: messageId });
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
    return client.models.Message.observeQuery({
      filter: {
        conversationId: { eq: conversationId },
      },
    }).subscribe({
      next: data => {
        // Sort messages by timestamp (oldest first for chat display)
        const sortedMessages = data.items.sort((a, b) => {
          const timestampA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const timestampB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
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
    return client.models.Message.onCreate().subscribe({
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
