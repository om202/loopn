import type { Schema } from '../../amplify/data/resource';
import { getClient } from '../lib/amplify-config';

type UserPresence = Schema['UserPresence']['type'];
type DataResult<T> = { data: T | null; error: string | null };
type ListResult<T> = { data: T[]; error: string | null };

/**
 * UserPresenceService - Handles only online/offline status and chat activity
 * For profile data, use UserProfileService instead
 */
export class UserPresenceService {
  async updateUserPresence(
    userId: string,
    status: 'ONLINE' | 'OFFLINE' | 'BUSY'
  ): Promise<DataResult<UserPresence>> {
    try {
      const existingResult = await getClient().models.UserPresence.get({
        userId,
      });

      if (existingResult.data) {
        // Check if status actually changed to avoid unnecessary updates
        const currentStatus = existingResult.data.status;
        const currentIsOnline = existingResult.data.isOnline;
        const newIsOnline = status === 'ONLINE';
        
        // Only update if status or isOnline state changed
        if (currentStatus !== status || currentIsOnline !== newIsOnline) {
          const result = await getClient().models.UserPresence.update({
            userId,
            status,
            isOnline: newIsOnline,
            lastSeen: new Date().toISOString(),
            lastHeartbeat: new Date().toISOString(),
          });

          return {
            data: result.data,
            error: null,
          };
        } else {
          // Status hasn't changed, return existing data without updating
          return {
            data: existingResult.data,
            error: null,
          };
        }
      }

      const result = await getClient().models.UserPresence.create({
        userId,
        status,
        isOnline: status === 'ONLINE',
        lastSeen: new Date().toISOString(),
        lastHeartbeat: new Date().toISOString(),
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
            : 'Failed to update user presence',
      };
    }
  }

  async getUserPresence(userId: string): Promise<DataResult<UserPresence>> {
    try {
      const result = await getClient().models.UserPresence.get({ userId });
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
            : 'Failed to fetch user presence',
      };
    }
  }

  async getOnlineUsers(): Promise<ListResult<UserPresence>> {
    try {
      const result = await getClient().models.UserPresence.list({
        filter: {
          status: { eq: 'ONLINE' },
          isOnline: { eq: true },
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
            : 'Failed to fetch online users',
      };
    }
  }

  async getAllUsers(): Promise<ListResult<UserPresence>> {
    try {
      const result = await getClient().models.UserPresence.list();

      return {
        data: result.data || [],
        error: null,
      };
    } catch (error) {
      return {
        data: [],
        error:
          error instanceof Error ? error.message : 'Failed to fetch all users',
      };
    }
  }

  async setUserOffline(userId: string): Promise<DataResult<UserPresence>> {
    return this.updateUserPresence(userId, 'OFFLINE');
  }

  async setUserOnline(userId: string): Promise<DataResult<UserPresence>> {
    return this.updateUserPresence(userId, 'ONLINE');
  }

  async setUserBusy(userId: string): Promise<DataResult<UserPresence>> {
    return this.updateUserPresence(userId, 'BUSY');
  }

  /**
   * Update user's active chat
   */
  async updateActiveChat(
    userId: string,
    activeChatId?: string
  ): Promise<DataResult<UserPresence>> {
    try {
      const result = await getClient().models.UserPresence.update({
        userId,
        activeChatId: activeChatId || null,
        lastChatActivity: new Date().toISOString(),
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
            : 'Failed to update active chat',
      };
    }
  }

  observeOnlineUsers(
    callback: (users: UserPresence[]) => void,
    onError?: (error: Error) => void
  ) {
    let previousOnlineUserIds = new Set<string>();

    return getClient()
      .models.UserPresence.observeQuery({})
      .subscribe({
        next: ({ items }) => {
          const onlineUsers = items.filter(user => user.isOnline === true);
          const currentOnlineUserIds = new Set(onlineUsers.map(u => u.userId));

          if (
            currentOnlineUserIds.size !== previousOnlineUserIds.size ||
            ![...currentOnlineUserIds].every(id =>
              previousOnlineUserIds.has(id)
            )
          ) {
            previousOnlineUserIds = currentOnlineUserIds;
            callback(onlineUsers);
          }
        },
        error: error => {
          if (onError) {
            onError(error);
          }
        },
      });
  }

  observeUserPresence(
    userId: string,
    callback: (presence: UserPresence | null) => void,
    onError?: (error: Error) => void
  ) {
    return getClient()
      .models.UserPresence.observeQuery({
        filter: {
          userId: { eq: userId },
        },
      })
      .subscribe({
        next: ({ items }) => {
          const presence = items.length > 0 ? items[0] : null;
          callback(presence);
        },
        error: error => {
          if (onError) {
            onError(error);
          }
        },
      });
  }
}

export const userPresenceService = new UserPresenceService();
