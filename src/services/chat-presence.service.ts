'use client';

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

/**
 * Simplified chat presence service for AWS AppSync
 * Just tracks if user is actively in a chat window
 */
class ChatPresenceService {
  private static client: ReturnType<typeof generateClient<Schema>> | null =
    null;

  private getClient() {
    if (!ChatPresenceService.client) {
      ChatPresenceService.client = generateClient<Schema>();
    }
    return ChatPresenceService.client;
  }
  private currentUserId: string | null = null;
  private currentChatId: string | null = null;

  /**
   * Initialize for a user
   */
  initialize(userId: string) {
    this.currentUserId = userId;
    this.setupVisibilityTracking();
  }

  /**
   * User entered a chat window
   */
  async enterChat(chatId: string) {
    if (!this.currentUserId) return;

    this.currentChatId = chatId;

    try {
      await this.getClient().models.UserPresence.update({
        userId: this.currentUserId,
        activeChatId: chatId,
        lastChatActivity: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error entering chat presence:', error);
    }
  }

  /**
   * User left the chat window
   */
  async exitChat() {
    if (!this.currentUserId) return;

    this.currentChatId = null;

    try {
      await this.getClient().models.UserPresence.update({
        userId: this.currentUserId,
        activeChatId: null,
        lastChatActivity: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error exiting chat presence:', error);
    }
  }

  /**
   * Check if user is actively in a specific chat
   */
  async isUserActiveInChat(userId: string, chatId: string): Promise<boolean> {
    try {
      const presence = await this.getClient().models.UserPresence.get({
        userId,
      });

      if (!presence.data) return false;

      const { activeChatId, lastChatActivity } = presence.data;

      // User must be in the specific chat
      if (activeChatId !== chatId) return false;

      // Activity must be recent (within last 5 minutes - generous window)
      if (!lastChatActivity) return false;

      const activityTime = new Date(lastChatActivity).getTime();
      const now = new Date().getTime();
      const fiveMinutes = 5 * 60 * 1000;

      return now - activityTime < fiveMinutes;
    } catch (error) {
      console.error('Error checking user chat activity:', error);
      return false;
    }
  }

  /**
   * Page visibility tracking - exit chat when user switches tabs
   * Note: We leverage the existing 30s visibility timeout from presence-utils.ts
   */
  private setupVisibilityTracking() {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // User switched away - exit chat immediately
        // (the existing presence-utils handles the 30s delay for general presence)
        this.exitChat();
      } else if (this.currentChatId) {
        // User returned - re-enter chat
        this.enterChat(this.currentChatId);
      }
    });
  }

  /**
   * Cleanup on destroy
   */
  cleanup() {
    if (this.currentUserId) {
      this.exitChat();
    }
  }
}

export const chatPresenceService = new ChatPresenceService();
