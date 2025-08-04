import type { Schema } from '../../amplify/data/resource';
import { client } from '../lib/amplify-config';
import { notificationService } from './notification.service';
import { userService } from './user.service';

// Type definitions from schema
type ChatRequest = Schema['ChatRequest']['type'];
// type CreateChatRequestInput = Schema['ChatRequest']['createType'];
// type UpdateChatRequestInput = Schema['ChatRequest']['updateType'];

type Conversation = Schema['Conversation']['type'];
// type CreateConversationInput = Schema['Conversation']['createType'];
// type UpdateConversationInput = Schema['Conversation']['updateType'];

type UserConnection = Schema['UserConnection']['type'];
// type CreateUserConnectionInput = Schema['UserConnection']['createType'];
// type UpdateUserConnectionInput = Schema['UserConnection']['updateType'];

// Result types
type DataResult<T> = { data: T | null; error: string | null };
type ListResult<T> = { data: T[]; error: string | null };

export class ChatService {
  // ===== CHAT REQUESTS =====

  async sendChatRequest(
    receiverId: string,
    requesterId: string
  ): Promise<DataResult<ChatRequest>> {
    try {
      // Check for active chat restrictions (2-week cooldown)
      const restrictionCheck = await this.hasActiveChatRestriction(
        requesterId,
        receiverId
      );

      if (restrictionCheck.error) {
        return {
          data: null,
          error: restrictionCheck.error,
        };
      }

      if (restrictionCheck.data) {
        return {
          data: null,
          error:
            'Cannot send chat request. Please wait for the cooldown period to end.',
        };
      }

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const result = await client.models.ChatRequest.create({
        requesterId,
        receiverId,
        status: 'PENDING',
        expiresAt: expiresAt.toISOString(),
      });

      // Create a notification for the receiver (especially important for offline users)
      if (result.data) {
        // Get requester's information for a more personalized notification
        const requesterResult = await userService.getUserPresence(requesterId);
        const requesterName = requesterResult.data?.email
          ? requesterResult.data.email.split('@')[0]
          : `User ${requesterId.slice(-4)}`;

        await notificationService.createNotification(
          receiverId,
          'chat_request',
          'New Chat Request',
          `${requesterName} wants to chat with you`,
          result.data,
          { chatRequestId: result.data.id }
        );
      }

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
            : 'Failed to send chat request',
      };
    }
  }

  async respondToChatRequest(
    chatRequestId: string,
    status: 'ACCEPTED' | 'REJECTED'
  ): Promise<
    DataResult<{ chatRequest: ChatRequest; conversation?: Conversation }>
  > {
    try {
      // First get the chat request to get participant IDs
      const chatRequestResult = await client.models.ChatRequest.get({
        id: chatRequestId,
      });

      if (!chatRequestResult.data) {
        return {
          data: null,
          error: 'Chat request not found',
        };
      }

      // Update the chat request status
      const result = await client.models.ChatRequest.update({
        id: chatRequestId,
        status,
        respondedAt: new Date().toISOString(),
      });

      if (!result.data) {
        return {
          data: null,
          error: 'Failed to update chat request',
        };
      }

      // Clean up notifications for both users when request is responded to
      await Promise.all([
        // Clean up notification for the receiver (who responded)
        notificationService.deleteNotificationsForChatRequest(
          chatRequestResult.data.receiverId,
          chatRequestId
        ),
        // Also clean up any notifications for the requester (edge case)
        notificationService.deleteNotificationsForChatRequest(
          chatRequestResult.data.requesterId,
          chatRequestId
        ),
      ]);

      // If accepted, create a conversation and notify the requester
      let conversation: Conversation | undefined;
      if (status === 'ACCEPTED') {
        const conversationResult = await this.createConversation(
          chatRequestResult.data.requesterId,
          chatRequestResult.data.receiverId
        );

        if (conversationResult.error) {
          return {
            data: null,
            error: conversationResult.error,
          };
        }

        conversation = conversationResult.data || undefined;

        // Create a notification for the requester (sender) that their request was accepted
        if (conversation) {
          // Get receiver's information for a personalized notification
          const receiverResult = await userService.getUserPresence(
            chatRequestResult.data.receiverId
          );
          const receiverName = receiverResult.data?.email
            ? receiverResult.data.email.split('@')[0]
            : `User ${chatRequestResult.data.receiverId.slice(-4)}`;

          // Create the acceptance notification with shorter expiry (24 hours)
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 1); // 24 hours only

          await client.models.Notification.create({
            userId: chatRequestResult.data.requesterId,
            type: 'connection',
            title: 'Chat Request Accepted!',
            content: `${receiverName} accepted your chat request. You can now chat!`,
            timestamp: new Date().toISOString(),
            isRead: false,
            data: JSON.stringify({
              conversationId: conversation.id,
              acceptedByUserId: chatRequestResult.data.receiverId,
              acceptedByEmail: receiverResult.data?.email,
            }),
            conversationId: conversation.id,
            expiresAt: expiresAt.toISOString(), // Auto-delete after 24 hours
          });
        }
      }

      return {
        data: {
          chatRequest: result.data,
          conversation,
        },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to respond to chat request',
      };
    }
  }

  async cancelChatRequest(
    requesterId: string,
    receiverId: string
  ): Promise<DataResult<boolean>> {
    try {
      // Find the pending chat request between these users
      const result = await client.models.ChatRequest.list({
        filter: {
          requesterId: { eq: requesterId },
          receiverId: { eq: receiverId },
          status: { eq: 'PENDING' },
        },
      });

      if (!result.data || result.data.length === 0) {
        return {
          data: false,
          error: 'No pending chat request found',
        };
      }

      // Update the first matching request to REJECTED status
      const chatRequest = result.data[0];
      const updateResult = await client.models.ChatRequest.update({
        id: chatRequest.id,
        status: 'REJECTED', // Use REJECTED to mark as cancelled
        respondedAt: new Date().toISOString(),
      });

      if (!updateResult.data) {
        return {
          data: false,
          error: 'Failed to cancel chat request',
        };
      }

      // Clean up notifications for both users
      await Promise.all([
        notificationService.deleteNotificationsForChatRequest(
          receiverId,
          chatRequest.id
        ),
        notificationService.deleteNotificationsForChatRequest(
          requesterId,
          chatRequest.id
        ),
      ]);

      return {
        data: true,
        error: null,
      };
    } catch (error) {
      return {
        data: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to cancel chat request',
      };
    }
  }

  async getReceivedChatRequests(
    userId: string
  ): Promise<ListResult<ChatRequest>> {
    try {
      const result = await client.models.ChatRequest.list({
        filter: {
          receiverId: { eq: userId },
          status: { eq: 'PENDING' },
        },
      });

      return {
        data: result.data || [],
        error: null,
      };
    } catch (error) {
      return {
        data: [],
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch chat requests',
      };
    }
  }

  async getSentChatRequests(userId: string): Promise<ListResult<ChatRequest>> {
    try {
      const result = await client.models.ChatRequest.list({
        filter: {
          requesterId: { eq: userId },
          status: { eq: 'PENDING' },
        },
      });

      return {
        data: result.data || [],
        error: null,
      };
    } catch (error) {
      return {
        data: [],
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch sent chat requests',
      };
    }
  }

  async hasPendingChatRequest(
    requesterId: string,
    receiverId: string
  ): Promise<DataResult<boolean>> {
    try {
      const result = await client.models.ChatRequest.list({
        filter: {
          requesterId: { eq: requesterId },
          receiverId: { eq: receiverId },
          status: { eq: 'PENDING' },
        },
      });

      return {
        data: (result.data || []).length > 0,
        error: null,
      };
    } catch (error) {
      return {
        data: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to check existing chat requests',
      };
    }
  }

  async clearStuckPendingRequests(userId: string): Promise<DataResult<number>> {
    try {
      // Get all pending sent requests for this user
      const sentResult = await client.models.ChatRequest.list({
        filter: {
          requesterId: { eq: userId },
          status: { eq: 'PENDING' },
        },
      });

      if (!sentResult.data) {
        return {
          data: 0,
          error: 'Failed to fetch pending requests',
        };
      }

      // Cancel all pending sent requests that are older than 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const stuckRequests = sentResult.data.filter(request => {
        const createdAt = new Date(request.createdAt);
        return createdAt < fiveMinutesAgo;
      });

      // Update stuck requests to EXPIRED status
      const updatePromises = stuckRequests.map(request =>
        client.models.ChatRequest.update({
          id: request.id,
          status: 'REJECTED', // Use REJECTED to clear them
          respondedAt: new Date().toISOString(),
        })
      );

      await Promise.all(updatePromises);

      return {
        data: stuckRequests.length,
        error: null,
      };
    } catch (error) {
      return {
        data: 0,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to clear stuck requests',
      };
    }
  }

  // ===== CONVERSATIONS =====

  async createConversation(
    participant1Id: string,
    participant2Id: string
  ): Promise<DataResult<Conversation>> {
    try {
      const now = new Date();
      const probationEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const result = await client.models.Conversation.create({
        participant1Id,
        participant2Id,
        isConnected: false,
        chatStatus: 'ACTIVE',
        probationEndsAt: probationEndsAt.toISOString(),
        createdAt: now.toISOString(),
        // Set participants for multi-user authorization
        participants: [participant1Id, participant2Id],
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
            : 'Failed to create conversation',
      };
    }
  }

  async getUserConversations(
    userId: string
  ): Promise<ListResult<Conversation>> {
    try {
      const result = await client.models.Conversation.list({
        filter: {
          or: [
            { participant1Id: { eq: userId } },
            { participant2Id: { eq: userId } },
          ],
        },
      });

      return {
        data: result.data || [],
        error: null,
      };
    } catch (error) {
      return {
        data: [],
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch conversations',
      };
    }
  }

  async endChat(
    conversationId: string,
    userId: string
  ): Promise<DataResult<Conversation>> {
    try {
      // First get the conversation to know the participants
      const conversationResult = await client.models.Conversation.get({
        id: conversationId,
      });

      if (!conversationResult.data) {
        return {
          data: null,
          error: 'Conversation not found',
        };
      }

      const conversation = conversationResult.data;

      // Update conversation to ended status
      const result = await client.models.Conversation.update({
        id: conversationId,
        chatStatus: 'ENDED',
        endedAt: new Date().toISOString(),
        endedByUserId: userId,
      });

      // Create ChatRestriction to prevent reconnection
      const now = new Date();
      // TODO: when deploying change to 2 weeks (14 * 24 * 60 * 60 * 1000)
      const restrictionEnds = new Date(now.getTime() + 3 * 60 * 1000); // 3 minutes for testing

      await client.models.ChatRestriction.create({
        user1Id: conversation.participant1Id,
        user2Id: conversation.participant2Id,
        endedConversationId: conversationId,
        restrictionEndsAt: restrictionEnds.toISOString(),
        createdAt: now.toISOString(),
        expiresAt: restrictionEnds.toISOString(), // TTL cleanup
      });

      return {
        data: result.data,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to end chat',
      };
    }
  }

  async continueProbation(
    conversationId: string
  ): Promise<DataResult<Conversation>> {
    try {
      const newProbationEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const result = await client.models.Conversation.update({
        id: conversationId,
        probationEndsAt: newProbationEnd.toISOString(),
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
            : 'Failed to continue probation',
      };
    }
  }

  async getConversation(
    conversationId: string
  ): Promise<DataResult<Conversation>> {
    try {
      const result = await client.models.Conversation.get({
        id: conversationId,
      });

      return {
        data: result.data,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error ? error.message : 'Failed to get conversation',
      };
    }
  }

  async getConversationBetweenUsers(
    user1Id: string,
    user2Id: string
  ): Promise<DataResult<Conversation>> {
    try {
      // Try to find conversation where user1 is participant1 and user2 is participant2
      let result = await client.models.Conversation.list({
        filter: {
          participant1Id: { eq: user1Id },
          participant2Id: { eq: user2Id },
          chatStatus: { eq: 'ACTIVE' },
        },
      });

      // If not found, try the opposite
      if (!result.data || result.data.length === 0) {
        result = await client.models.Conversation.list({
          filter: {
            participant1Id: { eq: user2Id },
            participant2Id: { eq: user1Id },
            chatStatus: { eq: 'ACTIVE' },
          },
        });
      }

      const conversation =
        result.data && result.data.length > 0 ? result.data[0] : null;

      return {
        data: conversation,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get conversation between users',
      };
    }
  }

  // ===== CONNECTION REQUESTS =====

  async sendConnectionRequest(
    requesterId: string,
    receiverId: string,
    conversationId: string
  ): Promise<DataResult<UserConnection>> {
    try {
      const result = await client.models.UserConnection.create({
        requesterId,
        receiverId,
        conversationId,
        status: 'PENDING',
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
            : 'Failed to send connection request',
      };
    }
  }

  async respondToConnectionRequest(
    connectionId: string,
    status: 'ACCEPTED' | 'REJECTED'
  ): Promise<DataResult<UserConnection>> {
    try {
      const result = await client.models.UserConnection.update({
        id: connectionId,
        status,
        respondedAt: new Date().toISOString(),
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
            : 'Failed to respond to connection request',
      };
    }
  }

  // ===== CHAT RESTRICTIONS =====

  async hasActiveChatRestriction(
    user1Id: string,
    user2Id: string
  ): Promise<DataResult<boolean>> {
    try {
      const now = new Date();

      // Check if there's an active restriction between these users
      // We need to check both directions since restrictions can be created with either user as user1
      const restriction1 = await client.models.ChatRestriction.list({
        filter: {
          user1Id: { eq: user1Id },
          user2Id: { eq: user2Id },
          restrictionEndsAt: { gt: now.toISOString() },
        },
      });

      const restriction2 = await client.models.ChatRestriction.list({
        filter: {
          user1Id: { eq: user2Id },
          user2Id: { eq: user1Id },
          restrictionEndsAt: { gt: now.toISOString() },
        },
      });

      const hasRestriction =
        (restriction1.data && restriction1.data.length > 0) ||
        (restriction2.data && restriction2.data.length > 0);

      return {
        data: hasRestriction,
        error: null,
      };
    } catch (error) {
      return {
        data: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to check chat restrictions',
      };
    }
  }

  // ===== REAL-TIME SUBSCRIPTIONS =====

  observeChatRequests(
    userId: string,
    callback: (requests: ChatRequest[]) => void,
    onError?: (error: Error) => void
  ) {
    return client.models.ChatRequest.observeQuery({
      filter: {
        receiverId: { eq: userId },
      },
    }).subscribe({
      next: data => {
        // Filter pending requests in JavaScript instead
        const typedData = data as { items: ChatRequest[] };
        const pendingRequests = typedData.items.filter(
          request => request.status === 'PENDING'
        );
        callback(pendingRequests);
      },
      error: error => {
        if (onError) {
          onError(error);
        }
      },
    });
  }

  observeSentChatRequests(
    userId: string,
    callback: (requests: ChatRequest[]) => void,
    onError?: (error: Error) => void
  ) {
    return client.models.ChatRequest.observeQuery({
      filter: {
        requesterId: { eq: userId },
      },
    }).subscribe({
      next: data => {
        // Filter pending requests in JavaScript instead
        const typedData = data as { items: ChatRequest[] };
        const pendingRequests = typedData.items.filter(
          request => request.status === 'PENDING'
        );
        callback(pendingRequests);
      },
      error: error => {
        if (onError) {
          onError(error);
        }
      },
    });
  }

  observeConversations(
    userId: string,
    callback: (conversations: Conversation[]) => void,
    onError?: (error: Error) => void
  ) {
    return client.models.Conversation.observeQuery({
      filter: {
        or: [
          { participant1Id: { eq: userId } },
          { participant2Id: { eq: userId } },
        ],
      },
    }).subscribe({
      next: data => {
        const typedData = data as { items: Conversation[] };
        callback(typedData.items);
      },
      error: error => {
        if (onError) {
          onError(error);
        }
      },
    });
  }
}

export const chatService = new ChatService();
