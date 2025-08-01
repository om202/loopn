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
            eq: messageId
          }
        }
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
}

export const reactionService = new ReactionService();
