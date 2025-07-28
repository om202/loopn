import type { Schema } from '../../amplify/data/resource';
import { client } from '../lib/amplify-config';

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
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const result = await client.models.ChatRequest.create({
        requesterId,
        receiverId,
        status: 'PENDING',
        expiresAt: expiresAt.toISOString(),
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

      // If accepted, create a conversation
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
        expiresAt: probationEndsAt.toISOString(), // TTL
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
      const result = await client.models.Conversation.update({
        id: conversationId,
        chatStatus: 'ENDED',
        endedAt: new Date().toISOString(),
        endedByUserId: userId,
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
        expiresAt: newProbationEnd.toISOString(),
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
        const pendingRequests = data.items.filter(
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
        const pendingRequests = data.items.filter(
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
      next: data => callback(data.items),
      error: error => {
        if (onError) {
          onError(error);
        }
      },
    });
  }
}

export const chatService = new ChatService();
