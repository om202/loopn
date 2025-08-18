import type { Schema } from '../../amplify/data/resource';
import { getClient } from '../lib/amplify-config';
import { notificationService } from './notification.service';
import { UserProfileService } from './user-profile.service';
import { useSubscriptionStore } from '../stores/subscription-store';

// Type definitions from schema
type Message = Schema['Message']['type'];
type Conversation = Schema['Conversation']['type'];
// type _CreateMessageInput = Schema['Message']['createType'];
// type _UpdateMessageInput = Schema['Message']['updateType'];

// Result types
type DataResult<T> = { data: T | null; error: string | null };
type ListResult<T> = { data: T[]; error: string | null };

const getDisplayName = (
  userProfile?: { fullName?: string; email?: string } | null,
  userId?: string
) => {
  // Try to get full name from profile first
  if (userProfile?.fullName) {
    return userProfile.fullName;
  }
  // Fall back to email if available
  if (userProfile?.email) {
    return userProfile.email;
  }
  // Last resort: User + last 4 chars of userId
  return userId ? `User ${userId.slice(-4)}` : 'Unknown User';
};

export class MessageService {
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    replyToMessageId?: string,
    conversation?: Conversation
  ): Promise<DataResult<Message>> {
    try {
      let receiverId: string;

      if (conversation) {
        receiverId =
          conversation.participant1Id === senderId
            ? conversation.participant2Id
            : conversation.participant1Id;
      } else {
        const conversationResult = await getClient().models.Conversation.get({
          id: conversationId,
        });

        if (!conversationResult.data) {
          return {
            data: null,
            error: 'Conversation not found',
          };
        }

        receiverId =
          conversationResult.data.participant1Id === senderId
            ? conversationResult.data.participant2Id
            : conversationResult.data.participant1Id;
      }

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
          let senderProfile: { fullName?: string; email?: string } | null =
            null;

          const cachedProfile = useSubscriptionStore
            .getState()
            .getUserProfile(senderId);
          if (cachedProfile) {
            senderProfile = {
              fullName: cachedProfile.fullName || undefined,
              email: cachedProfile.email || undefined,
            };
          }

          if (!senderProfile) {
            const senderProfileResult =
              await new UserProfileService().getUserProfile(senderId);
            senderProfile = senderProfileResult.data
              ? {
                  fullName: senderProfileResult.data.fullName || undefined,
                  email: senderProfileResult.data.email || undefined,
                }
              : null;
          }

          const senderName = getDisplayName(senderProfile, senderId);

          // Truncate long messages for notification
          const notificationContent =
            content.length > 50 ? `${content.substring(0, 50)}...` : content;

          let extendedProfileData = null;
          const cachedExtendedProfile = useSubscriptionStore
            .getState()
            .getUserProfile(senderId);
          if (cachedExtendedProfile) {
            extendedProfileData = {
              fullName: cachedExtendedProfile.fullName,
              email: cachedExtendedProfile.email,
              profilePictureUrl: cachedExtendedProfile.profilePictureUrl,
              hasProfilePicture:
                cachedExtendedProfile.hasProfilePicture || false,
            };
          }

          const notificationData = {
            conversationId,
            message: result.data,
            senderEmail: senderProfile?.email,
            messageCount: 1, // Individual message count
            senderProfile: senderProfile
              ? {
                  fullName: senderProfile.fullName,
                  email: senderProfile.email,
                  profilePictureUrl: extendedProfileData?.profilePictureUrl,
                  hasProfilePicture:
                    extendedProfileData?.hasProfilePicture || false,
                }
              : null,
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
