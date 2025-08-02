import type { Schema } from '../../amplify/data/resource';
import { client } from '../lib/amplify-config';

// Type definitions from schema
type UserPresence = Schema['UserPresence']['type'];

// Result types
type DataResult<T> = { data: T | null; error: string | null };
type ListResult<T> = { data: T[]; error: string | null };

export class UserService {
  async updateUserPresence(
    userId: string,
    email: string,
    status: 'ONLINE' | 'OFFLINE' | 'BUSY'
  ): Promise<DataResult<UserPresence>> {
    try {
      // Try to update existing presence record first
      const existingResult = await client.models.UserPresence.get({
        userId,
      });

      if (existingResult.data) {
        // Update existing presence
        const result = await client.models.UserPresence.update({
          userId,
          email,
          status,
          isOnline: status === 'ONLINE',
          lastSeen: new Date().toISOString(),
        });

        return {
          data: result.data,
          error: null,
        };
      }

      // Create new presence record only if none exists
      const result = await client.models.UserPresence.create({
        userId,
        email,
        status,
        isOnline: status === 'ONLINE',
        lastSeen: new Date().toISOString(),
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
      const result = await client.models.UserPresence.get({ userId });
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
      const result = await client.models.UserPresence.list({
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

  async setUserOffline(
    userId: string,
    email: string
  ): Promise<DataResult<UserPresence>> {
    return this.updateUserPresence(userId, email, 'OFFLINE');
  }

  async setUserOnline(
    userId: string,
    email: string
  ): Promise<DataResult<UserPresence>> {
    return this.updateUserPresence(userId, email, 'ONLINE');
  }

  async setUserBusy(
    userId: string,
    email: string
  ): Promise<DataResult<UserPresence>> {
    return this.updateUserPresence(userId, email, 'BUSY');
  }

  // Real-time subscription to presence changes
  observeOnlineUsers(
    callback: (users: UserPresence[]) => void,
    onError?: (error: Error) => void
  ) {
    let previousOnlineUserIds = new Set<string>();

    return client.models.UserPresence.observeQuery({
      // Remove the filter to listen to ALL presence changes (online and offline)
      // We'll filter client-side to only return online users
    }).subscribe({
      next: data => {
        // Filter for online users client-side
        const onlineUsers = data.items.filter(user => user.isOnline === true);

        // Only trigger callback if the set of online users actually changed
        const currentOnlineUserIds = new Set(onlineUsers.map(u => u.userId));

        // Compare sets to see if online users changed
        if (
          currentOnlineUserIds.size !== previousOnlineUserIds.size ||
          ![...currentOnlineUserIds].every(id => previousOnlineUserIds.has(id))
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

  // Subscribe to presence changes for specific users
  observeUserPresence(
    userId: string,
    callback: (presence: UserPresence | null) => void,
    onError?: (error: Error) => void
  ) {
    return client.models.UserPresence.observeQuery({
      filter: {
        userId: { eq: userId },
      },
    }).subscribe({
      next: data => {
        const presence = data.items.length > 0 ? data.items[0] : null;
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

export const userService = new UserService();
