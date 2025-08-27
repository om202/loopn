import type { Schema } from '../../amplify/data/resource';
import { getClient } from '../lib/amplify-config';

type SavedUser = Schema['SavedUser']['type'];
type DataResult<T> = { data: T | null; error: string | null };
type ListResult<T> = { data: T[]; error: string | null };

export class SavedUserService {
  /**
   * Save a user to the current user's saved list
   */
  async saveUser(
    saverId: string,
    savedUserId: string
  ): Promise<DataResult<SavedUser>> {
    try {
      const result = await getClient().models.SavedUser.create({
        id: crypto.randomUUID(),
        saverId,
        savedUserId,
        savedAt: new Date().toISOString(),
      });

      return {
        data: result.data,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to save user',
      };
    }
  }

  /**
   * Remove a user from the current user's saved list
   */
  async unsaveUser(
    saverId: string,
    savedUserId: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      await getClient().models.SavedUser.delete({
        saverId,
        savedUserId,
      });

      return {
        success: true,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to unsave user',
      };
    }
  }

  /**
   * Get all users saved by a specific user
   */
  async getSavedUsers(saverId: string): Promise<ListResult<SavedUser>> {
    try {
      const result = await getClient().models.SavedUser.list({
        filter: {
          saverId: { eq: saverId },
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
            : 'Failed to fetch saved users',
      };
    }
  }

  /**
   * Check if a user is saved by another user
   */
  async isUserSaved(
    saverId: string,
    savedUserId: string
  ): Promise<{ saved: boolean; error: string | null }> {
    try {
      const result = await getClient().models.SavedUser.get({
        saverId,
        savedUserId,
      });

      return {
        saved: !!result.data,
        error: null,
      };
    } catch (error) {
      return {
        saved: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to check if user is saved',
      };
    }
  }

  /**
   * Get count of saved users for a user
   */
  async getSavedUsersCount(saverId: string): Promise<number> {
    try {
      const result = await this.getSavedUsers(saverId);
      return result.data.length;
    } catch (error) {
      console.error('Error getting saved users count:', error);
      return 0;
    }
  }

  /**
   * Toggle save/unsave for a user
   */
  async toggleSaveUser(
    saverId: string,
    savedUserId: string
  ): Promise<{ saved: boolean; error: string | null }> {
    try {
      const isCurrentlySaved = await this.isUserSaved(saverId, savedUserId);

      if (isCurrentlySaved.error) {
        return { saved: false, error: isCurrentlySaved.error };
      }

      if (isCurrentlySaved.saved) {
        const result = await this.unsaveUser(saverId, savedUserId);
        return { saved: false, error: result.error };
      } else {
        const result = await this.saveUser(saverId, savedUserId);
        return { saved: true, error: result.error };
      }
    } catch (error) {
      return {
        saved: false,
        error: error instanceof Error ? error.message : 'Failed to toggle save',
      };
    }
  }
}

export const savedUserService = new SavedUserService();
