'use client';

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

type MessageReaction = Schema['MessageReaction']['type'];
type Message = Schema['Message']['type'];

type DataResult<T> = { data: T | null; error: string | null };
type ListResult<T> = { data: T[]; error: string | null };

export class ReactionService {
  async addReaction(
    messageId: string,
    userId: string,
    emoji: string,
    participants: string[]
  ): Promise<DataResult<MessageReaction>> {
    try {
      // Check if user already reacted with this emoji
      const existingReactions = await this.getMessageReactions(messageId);
      if (existingReactions.data) {
        const existingReaction = existingReactions.data.find(
          reaction => reaction.userId === userId && reaction.emoji === emoji
        );

        if (existingReaction) {
          // Remove existing reaction instead of adding duplicate
          return await this.removeReaction(existingReaction.id);
        }
      }

      const timestamp = new Date();
      const result = await client.models.MessageReaction.create({
        messageId,
        userId,
        emoji,
        timestamp: timestamp.toISOString(),
        participants,
      });

      return {
        data: result.data,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error ? error.message : 'Failed to add reaction',
      };
    }
  }

  async removeReaction(
    reactionId: string
  ): Promise<DataResult<MessageReaction>> {
    try {
      const result = await client.models.MessageReaction.delete({
        id: reactionId,
      });

      return {
        data: result.data,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error ? error.message : 'Failed to remove reaction',
      };
    }
  }

  async getMessageReactions(
    messageId: string
  ): Promise<ListResult<MessageReaction>> {
    try {
      const result = await client.models.MessageReaction.list({
        filter: {
          messageId: {
            eq: messageId,
          },
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
          error instanceof Error ? error.message : 'Failed to fetch reactions',
      };
    }
  }

  // Batch fetch reactions for multiple messages at once using OR filter
  // Falls back to concurrent individual calls if OR filter is not supported
  async getBatchMessageReactions(messageIds: string[]): Promise<{
    data: Record<string, MessageReaction[]>;
    error: string | null;
  }> {
    try {
      if (messageIds.length === 0) {
        return { data: {}, error: null };
      }



      // Try using the OR filter syntax for AppSync
      const result = await client.models.MessageReaction.list({
        filter: {
          or: messageIds.map(messageId => ({
            messageId: { eq: messageId }
          }))
        },
      });

      // Group reactions by messageId
      const reactionsByMessageId = result.data?.reduce(
        (acc, reaction) => {
          if (!acc[reaction.messageId]) {
            acc[reaction.messageId] = [];
          }
          acc[reaction.messageId].push(reaction);
          return acc;
        },
        {} as Record<string, MessageReaction[]>
      ) || {};

      // Ensure all messageIds have an entry (even if empty)
      messageIds.forEach(messageId => {
        if (!reactionsByMessageId[messageId]) {
          reactionsByMessageId[messageId] = [];
        }
      });



      return {
        data: reactionsByMessageId,
        error: null,
      };
    } catch (error) {
      console.error('Error in getBatchMessageReactions with OR filter:', error);
      // If the batch approach fails, fall back to individual calls
      
      try {
        const reactionPromises = messageIds.map(async messageId => {
          const result = await this.getMessageReactions(messageId);
          return { messageId, reactions: result.data || [] };
        });

        const results = await Promise.all(reactionPromises);
        const reactionsByMessageId = results.reduce(
          (acc, { messageId, reactions }) => {
            acc[messageId] = reactions;
            return acc;
          },
          {} as Record<string, MessageReaction[]>
        );



        return {
          data: reactionsByMessageId,
          error: null,
        };
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        return {
          data: {},
          error:
            fallbackError instanceof Error
              ? fallbackError.message
              : 'Failed to fetch batch reactions',
        };
      }
    }
  }

  async getUserReactionForMessage(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<DataResult<MessageReaction>> {
    try {
      const reactions = await this.getMessageReactions(messageId);
      if (reactions.error) {
        return { data: null, error: reactions.error };
      }

      const userReaction = reactions.data.find(
        reaction => reaction.userId === userId && reaction.emoji === emoji
      );

      return {
        data: userReaction || null,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to check user reaction',
      };
    }
  }

  // Group reactions by emoji with counts
  groupReactionsByEmoji(reactions: MessageReaction[]): Array<{
    emoji: string;
    count: number;
    users: string[];
    hasCurrentUser: boolean;
  }> {
    const grouped = reactions.reduce(
      (acc, reaction) => {
        if (!acc[reaction.emoji]) {
          acc[reaction.emoji] = {
            emoji: reaction.emoji,
            count: 0,
            users: [],
            hasCurrentUser: false,
          };
        }
        acc[reaction.emoji].count++;
        acc[reaction.emoji].users.push(reaction.userId);
        return acc;
      },
      {} as Record<
        string,
        {
          emoji: string;
          count: number;
          users: string[];
          hasCurrentUser: boolean;
        }
      >
    );

    return Object.values(grouped);
  }

  // Subscribe to reaction changes for all messages in a conversation
  subscribeToReactionChanges(
    messageIds: string[],
    callback: (reaction: MessageReaction, action: 'create' | 'delete') => void,
    onError?: (error: Error) => void
  ) {
    // Subscribe to new reactions
    const createSubscription =
      client.models.MessageReaction.onCreate().subscribe({
        next: reaction => {
          // Only notify for reactions on messages we're watching
          if (messageIds.includes(reaction.messageId)) {
            callback(reaction, 'create');
          }
        },
        error: error => {
          if (onError) {
            onError(error);
          }
        },
      });

    // Subscribe to deleted reactions
    const deleteSubscription =
      client.models.MessageReaction.onDelete().subscribe({
        next: reaction => {
          // Only notify for reactions on messages we're watching
          if (messageIds.includes(reaction.messageId)) {
            callback(reaction, 'delete');
          }
        },
        error: error => {
          if (onError) {
            onError(error);
          }
        },
      });

    // Return combined unsubscribe function
    return {
      unsubscribe: () => {
        createSubscription.unsubscribe();
        deleteSubscription.unsubscribe();
      },
    };
  }
}

export const reactionService = new ReactionService();
