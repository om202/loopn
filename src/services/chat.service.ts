import type { Schema } from '../../amplify/data/resource';
import { getClient } from '../lib/amplify-config';
import { notificationService } from './notification.service';
import { UserProfileService } from './user-profile.service';

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

      const result = await getClient().models.ChatRequest.create({
        requesterId,
        receiverId,
        status: 'PENDING',
        expiresAt: expiresAt.toISOString(),
      });

      // Note: Chat request notifications are now handled by the real-time subscription system
      // in NotificationsContent.tsx to avoid duplicates. The useChatRequests hook provides
      // real-time chat request data that gets converted to notifications in the UI.

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
      const chatRequestResult = await getClient().models.ChatRequest.get({
        id: chatRequestId,
      });

      if (!chatRequestResult.data) {
        return {
          data: null,
          error: 'Chat request not found',
        };
      }

      // Update the chat request status
      const result = await getClient().models.ChatRequest.update({
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
          // Get receiver's profile information for a personalized notification
          const receiverProfileResult =
            await new UserProfileService().getUserProfile(
              chatRequestResult.data.receiverId
            );
          const receiverProfile = receiverProfileResult.data
            ? {
                fullName: receiverProfileResult.data.fullName || undefined,
                email: receiverProfileResult.data.email || undefined,
              }
            : null;

          const receiverName = getDisplayName(
            receiverProfile,
            chatRequestResult.data.receiverId
          );

          // Create the acceptance notification with shorter expiry (24 hours)
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 1); // 24 hours only

          await getClient().models.Notification.create({
            userId: chatRequestResult.data.requesterId,
            type: 'connection',
            title: 'Connection Request Accepted!',
            content: `${receiverName} accepted your connection request. You can now message!`,
            timestamp: new Date().toISOString(),
            isRead: false,
            data: JSON.stringify({
              conversationId: conversation.id,
              acceptedByUserId: chatRequestResult.data.receiverId,
              acceptedByEmail: receiverProfile?.email,
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
      // Try to find the pending chat request in our Zustand cache first
      let chatRequest = null;
      try {
        const { useSubscriptionStore } = await import(
          '../stores/subscription-store'
        );
        const sentRequests = useSubscriptionStore.getState().sentChatRequests;
        chatRequest = sentRequests.find(
          req =>
            req.requesterId === requesterId &&
            req.receiverId === receiverId &&
            req.status === 'PENDING'
        );
      } catch (_cacheError) {
        console.log(
          '[ChatService] Cache not available for cancel request, using API fallback'
        );
      }

      // Fallback to API if not found in cache
      if (!chatRequest) {
        const result = await getClient().models.ChatRequest.list({
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

        chatRequest = result.data[0];
      }
      const updateResult = await getClient().models.ChatRequest.update({
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
      const result = await getClient().models.ChatRequest.list({
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
      const result = await getClient().models.ChatRequest.list({
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
      const result = await getClient().models.ChatRequest.list({
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
      const sentResult = await getClient().models.ChatRequest.list({
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
        getClient().models.ChatRequest.update({
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

      const result = await getClient().models.Conversation.create({
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
      const result = await getClient().models.Conversation.list({
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
      const conversationResult = await getClient().models.Conversation.get({
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
      const result = await getClient().models.Conversation.update({
        id: conversationId,
        chatStatus: 'ENDED',
        endedAt: new Date().toISOString(),
        endedByUserId: userId,
      });

      // Create ChatRestriction to prevent reconnection
      const now = new Date();
      // TODO: when deploying change to 2 weeks (14 * 24 * 60 * 60 * 1000)
      const restrictionEnds = new Date(now.getTime() + 3 * 60 * 1000); // 3 minutes for testing

      await getClient().models.ChatRestriction.create({
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

      const result = await getClient().models.Conversation.update({
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
      const result = await getClient().models.Conversation.get({
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
      let result = await getClient().models.Conversation.list({
        filter: {
          participant1Id: { eq: user1Id },
          participant2Id: { eq: user2Id },
          chatStatus: { eq: 'ACTIVE' },
        },
      });

      // If not found, try the opposite
      if (!result.data || result.data.length === 0) {
        result = await getClient().models.Conversation.list({
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
      // Check if a connection request already exists for this conversation
      const existingRequest =
        await this.getConnectionRequestForConversation(conversationId);

      if (existingRequest.data) {
        return {
          data: null,
          error: 'A connection request already exists for this conversation',
        };
      }

      const result = await getClient().models.UserConnection.create({
        requesterId,
        receiverId,
        conversationId,
        status: 'PENDING',
        requestedAt: new Date().toISOString(),
      });

      // Create notification for the receiver
      if (result.data) {
        try {
          // Get requester's profile for notification
          const userProfileService = new UserProfileService();
          const requesterProfile =
            await userProfileService.getUserProfile(requesterId);
          const requesterName =
            requesterProfile.data?.fullName ||
            requesterProfile.data?.email ||
            `User${requesterId.slice(-4)}`;

          await notificationService.createNotification(
            receiverId,
            'connection',
            'Connect',
            `${requesterName} wants to connect with you on Loopn`,
            {
              connectionRequestId: result.data.id,
              requesterId,
              conversationId,
            },
            {
              connectionRequestId: result.data.id,
              conversationId,
            }
          );
        } catch (notificationError) {
          console.error(
            'Failed to create connection request notification:',
            notificationError
          );
          // Don't fail the whole operation if notification creation fails
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
      // First get the connection request to get the conversation ID
      const connectionResult = await getClient().models.UserConnection.get({
        id: connectionId,
      });

      if (!connectionResult.data) {
        return {
          data: null,
          error: 'Connection request not found',
        };
      }

      // Update the connection request
      const result = await getClient().models.UserConnection.update({
        id: connectionId,
        status,
        respondedAt: new Date().toISOString(),
      });

      // If accepted, update the conversation to be permanently connected
      if (status === 'ACCEPTED' && connectionResult.data.conversationId) {
        await getClient().models.Conversation.update({
          id: connectionResult.data.conversationId,
          isConnected: true,
          chatStatus: 'ACTIVE',
        });

        // Create notification for the requester about acceptance
        try {
          const userProfileService = new UserProfileService();
          const receiverProfile = await userProfileService.getUserProfile(
            connectionResult.data.receiverId
          );
          const receiverName =
            receiverProfile.data?.fullName ||
            receiverProfile.data?.email ||
            `User${connectionResult.data.receiverId.slice(-4)}`;

          await notificationService.createNotification(
            connectionResult.data.requesterId,
            'connection',
            'Connection Accepted',
            `${receiverName} accepted your connection request`,
            {
              connectionRequestId: connectionResult.data.id,
              conversationId: connectionResult.data.conversationId,
            },
            {
              connectionRequestId: connectionResult.data.id,
              conversationId: connectionResult.data.conversationId,
            }
          );
        } catch (notificationError) {
          console.error(
            'Failed to create connection acceptance notification:',
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
          error instanceof Error
            ? error.message
            : 'Failed to respond to connection request',
      };
    }
  }

  async getConnectionRequestForConversation(
    conversationId: string
  ): Promise<DataResult<UserConnection>> {
    try {
      const result = await getClient().models.UserConnection.list({
        filter: {
          conversationId: { eq: conversationId },
          status: { eq: 'PENDING' },
        },
      });

      const connectionRequest = result.data?.[0] || null;

      return {
        data: connectionRequest,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get connection request',
      };
    }
  }

  async getAcceptedConnectionForConversation(
    conversationId: string
  ): Promise<DataResult<UserConnection>> {
    try {
      const result = await getClient().models.UserConnection.list({
        filter: {
          conversationId: { eq: conversationId },
          status: { eq: 'ACCEPTED' },
        },
      });

      const acceptedConnection = result.data?.[0] || null;

      return {
        data: acceptedConnection,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get accepted connection',
      };
    }
  }

  async removeConnection(
    conversationId: string
  ): Promise<
    DataResult<{ connection: UserConnection; conversation: Conversation }>
  > {
    try {
      // First, find the accepted connection for this conversation
      const connectionResult =
        await this.getAcceptedConnectionForConversation(conversationId);

      if (!connectionResult.data) {
        return {
          data: null,
          error: 'No accepted connection found for this conversation',
        };
      }

      const connection = connectionResult.data;

      // Delete the connection record
      await getClient().models.UserConnection.delete({
        id: connection.id,
      });

      // Update the conversation to remove the permanent connection status
      const conversationResult = await getClient().models.Conversation.update({
        id: conversationId,
        isConnected: false,
        chatStatus: 'ENDED', // End the chat when connection is removed
        endedAt: new Date().toISOString(),
      });

      if (!conversationResult.data) {
        return {
          data: null,
          error: 'Failed to update conversation after removing connection',
        };
      }

      return {
        data: {
          connection,
          conversation: conversationResult.data,
        },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to remove connection',
      };
    }
  }

  async getConnectionRequestsByUser(
    userId: string
  ): Promise<DataResult<UserConnection[]>> {
    try {
      // Get both sent and received connection requests
      const [sentResult, receivedResult] = await Promise.all([
        getClient().models.UserConnection.list({
          filter: {
            requesterId: { eq: userId },
          },
        }),
        getClient().models.UserConnection.list({
          filter: {
            receiverId: { eq: userId },
          },
        }),
      ]);

      const allConnections = [
        ...(sentResult.data || []),
        ...(receivedResult.data || []),
      ];

      return {
        data: allConnections,
        error: null,
      };
    } catch (error) {
      return {
        data: [],
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get connection requests',
      };
    }
  }

  async cancelConnectionRequest(
    connectionRequestId: string
  ): Promise<DataResult<boolean>> {
    try {
      // First get the connection request to get user IDs for notification cleanup
      const connectionResult = await getClient().models.UserConnection.get({
        id: connectionRequestId,
      });

      if (!connectionResult.data) {
        return {
          data: false,
          error: 'Connection request not found',
        };
      }

      // Delete the connection request
      await getClient().models.UserConnection.delete({
        id: connectionRequestId,
      });

      // Clean up notifications for both users
      try {
        await Promise.all([
          notificationService.deleteNotificationsForConnectionRequest(
            connectionResult.data.receiverId,
            connectionRequestId
          ),
          notificationService.deleteNotificationsForConnectionRequest(
            connectionResult.data.requesterId,
            connectionRequestId
          ),
        ]);
      } catch (notificationError) {
        console.error(
          'Failed to clean up connection request notifications:',
          notificationError
        );
        // Don't fail the whole operation if notification cleanup fails
      }

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
            : 'Failed to cancel connection request',
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
      const restriction1 = await getClient().models.ChatRestriction.list({
        filter: {
          user1Id: { eq: user1Id },
          user2Id: { eq: user2Id },
          restrictionEndsAt: { gt: now.toISOString() },
        },
      });

      const restriction2 = await getClient().models.ChatRestriction.list({
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
    return getClient()
      .models.ChatRequest.observeQuery({
        filter: {
          receiverId: { eq: userId },
        },
      })
      .subscribe({
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
    return getClient()
      .models.ChatRequest.observeQuery({
        filter: {
          requesterId: { eq: userId },
        },
      })
      .subscribe({
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
    return getClient()
      .models.Conversation.observeQuery({
        filter: {
          or: [
            { participant1Id: { eq: userId } },
            { participant2Id: { eq: userId } },
          ],
        },
      })
      .subscribe({
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
