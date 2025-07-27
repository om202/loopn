import type { Schema } from '../../amplify/data/resource';
import { client } from '../lib/amplify-config';

// Type definitions from schema
type UserPresence = Schema['UserPresence']['type'];
// type CreateUserPresenceInput = Schema['UserPresence']['createType'];
// type UpdateUserPresenceInput = Schema['UserPresence']['updateType'];

// Result types
type DataResult<T> = { data: T | null; error: string | null };
type ListResult<T> = { data: T[]; error: string | null };

export class UserService {
  async updateUserPresence(
    userId: string,
    status: 'ONLINE' | 'OFFLINE' | 'BUSY'
  ): Promise<DataResult<UserPresence>> {
    try {
      // Try to update existing presence first
      const existingResult = await client.models.UserPresence.get({
        id: userId,
      });

      if (existingResult.data) {
        // Update existing presence
        const result = await client.models.UserPresence.update({
          id: userId,
          status,
          lastSeen: new Date().toISOString(),
        });

        return {
          data: result.data,
          error: null,
        };
      }
      // Create new presence record
      const result = await client.models.UserPresence.create({
        userId,
        status,
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
      const result = await client.models.UserPresence.get({ id: userId });
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

  async setUserOffline(userId: string): Promise<DataResult<UserPresence>> {
    return this.updateUserPresence(userId, 'OFFLINE');
  }

  async setUserOnline(userId: string): Promise<DataResult<UserPresence>> {
    return this.updateUserPresence(userId, 'ONLINE');
  }

  async setUserBusy(userId: string): Promise<DataResult<UserPresence>> {
    return this.updateUserPresence(userId, 'BUSY');
  }

  // Real-time subscription to presence changes
  observeOnlineUsers(
    callback: (users: UserPresence[]) => void,
    onError?: (error: Error) => void
  ) {
    return client.models.UserPresence.observeQuery({
      filter: {
        status: { eq: 'ONLINE' },
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
