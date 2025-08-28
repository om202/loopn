'use client';

import { useEffect, useCallback } from 'react';
import { useSavedUsersStore } from '../stores/saved-users-store';
import type { Schema } from '../../amplify/data/resource';

type SavedUser = Schema['SavedUser']['type'];

interface UseSavedUsersProps {
  userId: string;
  enabled: boolean;
}

interface UseSavedUsersReturn {
  savedUsers: SavedUser[];
  savedUserIds: Set<string>;
  isLoading: boolean;
  error: string | null;
  savedCount: number;
  refetch: () => Promise<void>;
  toggleSaveUser: (targetUserId: string) => Promise<boolean>;
  isUserSaved: (targetUserId: string) => boolean;
}

export function useSavedUsers({
  userId,
  enabled,
}: UseSavedUsersProps): UseSavedUsersReturn {
  const store = useSavedUsersStore();

  // Auto-fetch saved users when enabled
  useEffect(() => {
    if (enabled && userId) {
      store.fetchSavedUsers(userId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, enabled]); // Zustand stores are stable, don't need store in deps

  // Get current state from store
  const savedUsers = store.getSavedUsers(userId);
  const savedUserIds = store.getSavedUserIds(userId);
  const isLoading = store.loading[userId] || false;
  const error = store.errors[userId] || null;
  const savedCount = store.getSavedCount(userId);

  // Refetch function
  const refetch = useCallback(async () => {
    if (!enabled || !userId) return;
    await store.fetchSavedUsers(userId, true); // Force refresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, enabled]); // Zustand stores are stable, don't need store in deps

  // Toggle save/unsave for a user
  const toggleSaveUser = useCallback(
    async (targetUserId: string): Promise<boolean> => {
      if (!userId || !enabled) return false;
      return await store.toggleSaveUser(userId, targetUserId);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, enabled] // Zustand stores are stable, don't need store in deps
  );

  // Check if a user is saved
  const isUserSaved = useCallback(
    (targetUserId: string): boolean => {
      return store.isUserSaved(userId, targetUserId);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId] // Zustand stores are stable, don't need store in deps
  );

  // Convert store entries to SavedUser format for backward compatibility
  const savedUsersWithSchema: SavedUser[] = savedUsers.map(entry => ({
    id: entry.id,
    saverId: entry.saverId,
    savedUserId: entry.savedUserId,
    savedAt: entry.savedAt,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  }));

  return {
    savedUsers: savedUsersWithSchema,
    savedUserIds,
    isLoading,
    error,
    savedCount,
    refetch,
    toggleSaveUser,
    isUserSaved,
  };
}
