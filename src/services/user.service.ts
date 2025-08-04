import type { Schema } from '../../amplify/data/resource';
import { client } from '../lib/amplify-config';

type UserPresence = Schema['UserPresence']['type'];
type DataResult<T> = { data: T | null; error: string | null };
type ListResult<T> = { data: T[]; error: string | null };

export class UserService {
  async updateUserPresence(
    userId: string,
    email: string,
    status: 'ONLINE' | 'OFFLINE' | 'BUSY'
  ): Promise<DataResult<UserPresence>> {
    try {
      const existingResult = await client.models.UserPresence.get({
        userId,
      });

      if (existingResult.data) {
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

  observeOnlineUsers(
    callback: (users: UserPresence[]) => void,
    onError?: (error: Error) => void
  ) {
    let previousOnlineUserIds = new Set<string>();

    return client.models.UserPresence.observeQuery({
    }).subscribe({
      next: ({ items }) => {
        const onlineUsers = items.filter(user => user.isOnline === true);
        const currentOnlineUserIds = new Set(onlineUsers.map(u => u.userId));

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

export const userService = new UserService();
