import { generateClient } from 'aws-amplify/data';

import type { Schema } from '../../amplify/data/resource';

type Notification = Schema['Notification']['type'];

export class NotificationService {
  private client = generateClient<Schema>();

  /**
   * Create a new notification in the database
   */
  async createNotification(
    userId: string,
    type: 'chat_request' | 'message' | 'connection' | 'system',
    title: string,
    content: string,
    data?: unknown,
    options?: {
      chatRequestId?: string;
      conversationId?: string;
      connectionRequestId?: string;
    }
  ) {
    try {
      // Set expiration to 30 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const result = await this.client.models.Notification.create({
        userId,
        type,
        title,
        content,
        timestamp: new Date().toISOString(),
        isRead: false,
        data: data ? JSON.stringify(data) : undefined,
        chatRequestId: options?.chatRequestId,
        conversationId: options?.conversationId,
        connectionRequestId: options?.connectionRequestId,
        expiresAt: expiresAt.toISOString(),
      });

      return { data: result.data, error: null };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { data: null, error: 'Failed to create notification' };
    }
  }

  /**
   * Get all notifications for a user (sorted by newest first)
   */
  async getUserNotifications(userId: string) {
    try {
      const result = await this.client.models.Notification.list({
        filter: { userId: { eq: userId } },
        // Note: We'll manually sort since Amplify query sorting is limited
      });

      if (result.data) {
        // Sort by timestamp descending (newest first)
        const sortedNotifications = result.data.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        // Parse JSON data field back to objects
        const notificationsWithParsedData = sortedNotifications.map(notif => ({
          ...notif,
          data: notif.data ? JSON.parse(notif.data as string) : undefined,
        }));

        return { data: notificationsWithParsedData, error: null };
      }

      return { data: [], error: null };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { data: [], error: 'Failed to fetch notifications' };
    }
  }

  /**
   * Get unread notifications for a user
   */
  async getUnreadNotifications(userId: string) {
    try {
      const result = await this.client.models.Notification.list({
        filter: {
          userId: { eq: userId },
          isRead: { eq: false },
        },
      });

      if (result.data) {
        // Sort by timestamp descending (newest first)
        const sortedNotifications = result.data.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        // Parse JSON data field back to objects
        const notificationsWithParsedData = sortedNotifications.map(notif => ({
          ...notif,
          data: notif.data ? JSON.parse(notif.data as string) : undefined,
        }));

        return { data: notificationsWithParsedData, error: null };
      }

      return { data: [], error: null };
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      return { data: [], error: 'Failed to fetch unread notifications' };
    }
  }

  /**
   * Mark a notification as read
   */
  async markNotificationAsRead(notificationId: string) {
    try {
      const result = await this.client.models.Notification.update({
        id: notificationId,
        isRead: true,
        readAt: new Date().toISOString(),
      });

      return { data: result.data, error: null };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { data: null, error: 'Failed to mark notification as read' };
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string) {
    try {
      const result = await this.client.models.Notification.delete({
        id: notificationId,
      });

      return { data: result.data, error: null };
    } catch (error) {
      console.error('Error deleting notification:', error);
      return { data: null, error: 'Failed to delete notification' };
    }
  }

  /**
   * Delete all notifications for a specific conversation
   * (useful when user opens a chat to clear message notifications)
   */
  async deleteNotificationsForConversation(
    userId: string,
    conversationId: string
  ) {
    try {
      // First get notifications for this conversation
      const result = await this.client.models.Notification.list({
        filter: {
          userId: { eq: userId },
          conversationId: { eq: conversationId },
        },
      });

      if (result.data && result.data.length > 0) {
        // Delete each notification
        const deletePromises = result.data.map(notif =>
          this.client.models.Notification.delete({ id: notif.id })
        );

        await Promise.all(deletePromises);
      }

      return { data: true, error: null };
    } catch (error) {
      console.error('Error deleting notifications for conversation:', error);
      return {
        data: false,
        error: 'Failed to delete conversation notifications',
      };
    }
  }

  /**
   * Delete notifications for a specific chat request
   * (useful when chat request is accepted/rejected)
   */
  async deleteNotificationsForChatRequest(
    userId: string,
    chatRequestId: string
  ) {
    try {
      const result = await this.client.models.Notification.list({
        filter: {
          userId: { eq: userId },
          chatRequestId: { eq: chatRequestId },
        },
      });

      if (result.data && result.data.length > 0) {
        const deletePromises = result.data.map(notif =>
          this.client.models.Notification.delete({ id: notif.id })
        );

        await Promise.all(deletePromises);
      }

      return { data: true, error: null };
    } catch (error) {
      console.error('Error deleting notifications for chat request:', error);
      return {
        data: false,
        error: 'Failed to delete chat request notifications',
      };
    }
  }

  /**
   * Subscribe to notification changes (for real-time updates)
   */
  observeUserNotifications(
    userId: string,
    onNext: (notifications: Notification[]) => void,
    onError?: (error: unknown) => void
  ) {
    const subscription = this.client.models.Notification.observeQuery({
      filter: { userId: { eq: userId } },
    }).subscribe({
      next: ({ items }) => {
        // Sort by timestamp descending (newest first)
        const sortedNotifications = items.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        // Parse JSON data field back to objects
        const notificationsWithParsedData = sortedNotifications.map(notif => ({
          ...notif,
          data: notif.data ? JSON.parse(notif.data as string) : undefined,
        }));

        onNext(notificationsWithParsedData);
      },
      error:
        onError ||
        (error => console.error('Error observing notifications:', error)),
    });

    return subscription;
  }
}

export const notificationService = new NotificationService();
