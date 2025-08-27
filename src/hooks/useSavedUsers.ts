'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { savedUserService } from '../services/saved-user.service';
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
  const [savedUsers, setSavedUsers] = useState<SavedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a Set of saved user IDs for quick lookup
  const savedUserIds = useMemo(
    () => new Set(savedUsers.map(user => user.savedUserId)),
    [savedUsers]
  );

  const fetchSavedUsers = useCallback(async () => {
    if (!enabled || !userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await savedUserService.getSavedUsers(userId);
      if (result.error) {
        setError(result.error);
      } else {
        setSavedUsers(result.data);
      }
    } catch (err) {
      console.error('Error fetching saved users:', err);
      setError('Failed to load saved users');
    } finally {
      setIsLoading(false);
    }
  }, [userId, enabled]);

  // Initial fetch
  useEffect(() => {
    fetchSavedUsers();
  }, [fetchSavedUsers]);

  // Toggle save/unsave for a user
  const toggleSaveUser = useCallback(
    async (targetUserId: string): Promise<boolean> => {
      if (!userId || !enabled) return false;

      try {
        const result = await savedUserService.toggleSaveUser(userId, targetUserId);
        if (result.error) {
          console.error('Error toggling save status:', result.error);
          return false;
        }

        // Update local state optimistically
        if (result.saved) {
          // Add to saved users if not already present
          if (!savedUserIds.has(targetUserId)) {
            const newSavedUser: SavedUser = {
              id: crypto.randomUUID(),
              saverId: userId,
              savedUserId: targetUserId,
              savedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            setSavedUsers(prev => [...prev, newSavedUser]);
          }
        } else {
          // Remove from saved users
          setSavedUsers(prev => 
            prev.filter(user => user.savedUserId !== targetUserId)
          );
        }

        return result.saved;
      } catch (err) {
        console.error('Error toggling save status:', err);
        return false;
      }
    },
    [userId, enabled, savedUserIds]
  );

  // Check if a user is saved
  const isUserSaved = useCallback(
    (targetUserId: string): boolean => {
      return savedUserIds.has(targetUserId);
    },
    [savedUserIds]
  );

  return {
    savedUsers,
    savedUserIds,
    isLoading,
    error,
    savedCount: savedUsers.length,
    refetch: fetchSavedUsers,
    toggleSaveUser,
    isUserSaved,
  };
}
