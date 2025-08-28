import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { savedUserService } from '../services/saved-user.service';

interface SavedUserEntry {
  id: string;
  saverId: string;
  savedUserId: string;
  savedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface SavedUsersState {
  // Data cache - keyed by saverId to support multiple users
  savedUsersByUser: Record<string, SavedUserEntry[]>;

  // Loading states per user
  loading: Record<string, boolean>;

  // Error states per user
  errors: Record<string, string | null>;

  // Last sync timestamps per user
  lastSync: Record<string, number>;

  // Actions
  getSavedUsers: (userId: string) => SavedUserEntry[];
  getSavedUserIds: (userId: string) => Set<string>;
  isUserSaved: (userId: string, targetUserId: string) => boolean;
  getSavedCount: (userId: string) => number;

  // Core actions
  setSavedUsers: (userId: string, savedUsers: SavedUserEntry[]) => void;
  addSavedUser: (userId: string, savedUser: SavedUserEntry) => void;
  removeSavedUser: (userId: string, targetUserId: string) => void;

  // Loading and error management
  setLoading: (userId: string, loading: boolean) => void;
  setError: (userId: string, error: string | null) => void;

  // Sync operations
  fetchSavedUsers: (
    userId: string,
    forceRefresh?: boolean
  ) => Promise<SavedUserEntry[]>;
  toggleSaveUser: (userId: string, targetUserId: string) => Promise<boolean>;

  // Cache management
  hasCachedData: (userId: string) => boolean;
  clearUserData: (userId: string) => void;
}

export const useSavedUsersStore = create<SavedUsersState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        savedUsersByUser: {},
        loading: {},
        errors: {},
        lastSync: {},

        // Getters
        getSavedUsers: (userId: string) => {
          const state = get();
          return state.savedUsersByUser[userId] || [];
        },

        getSavedUserIds: (userId: string) => {
          const savedUsers = get().getSavedUsers(userId);
          return new Set(savedUsers.map(user => user.savedUserId));
        },

        isUserSaved: (userId: string, targetUserId: string) => {
          const savedIds = get().getSavedUserIds(userId);
          return savedIds.has(targetUserId);
        },

        getSavedCount: (userId: string) => {
          return get().getSavedUsers(userId).length;
        },

        // State setters
        setSavedUsers: (userId: string, savedUsers: SavedUserEntry[]) => {
          set(state => ({
            savedUsersByUser: {
              ...state.savedUsersByUser,
              [userId]: savedUsers,
            },
            lastSync: { ...state.lastSync, [userId]: Date.now() },
          }));
        },

        addSavedUser: (userId: string, savedUser: SavedUserEntry) => {
          set(state => {
            const existingSaved = state.savedUsersByUser[userId] || [];
            const newSaved = [...existingSaved, savedUser];
            return {
              savedUsersByUser: {
                ...state.savedUsersByUser,
                [userId]: newSaved,
              },
              lastSync: { ...state.lastSync, [userId]: Date.now() },
            };
          });
        },

        removeSavedUser: (userId: string, targetUserId: string) => {
          set(state => {
            const existingSaved = state.savedUsersByUser[userId] || [];
            const filtered = existingSaved.filter(
              user => user.savedUserId !== targetUserId
            );
            return {
              savedUsersByUser: {
                ...state.savedUsersByUser,
                [userId]: filtered,
              },
              lastSync: { ...state.lastSync, [userId]: Date.now() },
            };
          });
        },

        setLoading: (userId: string, loading: boolean) => {
          set(state => ({
            loading: { ...state.loading, [userId]: loading },
          }));
        },

        setError: (userId: string, error: string | null) => {
          set(state => ({
            errors: { ...state.errors, [userId]: error },
          }));
        },

        // Check if we have any cached data for user
        hasCachedData: (userId: string) => {
          const state = get();
          const savedUsers = state.savedUsersByUser[userId];
          const lastSyncTime = state.lastSync[userId];
          return savedUsers !== undefined && lastSyncTime !== undefined;
        },

        // Fetch saved users - only call API if no cached data exists
        fetchSavedUsers: async (userId: string, forceRefresh = false) => {
          const state = get();

          // Return cached data if exists and not forcing refresh
          if (!forceRefresh && state.hasCachedData(userId)) {
            return state.getSavedUsers(userId);
          }

          get().setLoading(userId, true);
          get().setError(userId, null);

          try {
            const result = await savedUserService.getSavedUsers(userId);

            if (result.error) {
              get().setError(userId, result.error);
              return state.getSavedUsers(userId); // Return cached data on error
            }

            const savedUsers: SavedUserEntry[] = result.data.map(user => ({
              id: user.id,
              saverId: user.saverId,
              savedUserId: user.savedUserId,
              savedAt: user.savedAt,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            }));

            get().setSavedUsers(userId, savedUsers);
            return savedUsers;
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : 'Failed to fetch saved users';
            get().setError(userId, errorMessage);
            return state.getSavedUsers(userId); // Return cached data on error
          } finally {
            get().setLoading(userId, false);
          }
        },

        // Toggle save with optimistic updates
        toggleSaveUser: async (userId: string, targetUserId: string) => {
          const state = get();
          const isCurrentlySaved = state.isUserSaved(userId, targetUserId);

          // Optimistic update
          if (isCurrentlySaved) {
            get().removeSavedUser(userId, targetUserId);
          } else {
            const optimisticEntry: SavedUserEntry = {
              id: crypto.randomUUID(),
              saverId: userId,
              savedUserId: targetUserId,
              savedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            get().addSavedUser(userId, optimisticEntry);
          }

          try {
            const result = await savedUserService.toggleSaveUser(
              userId,
              targetUserId
            );

            if (result.error) {
              // Revert optimistic update on error
              if (isCurrentlySaved) {
                const revertEntry: SavedUserEntry = {
                  id: crypto.randomUUID(),
                  saverId: userId,
                  savedUserId: targetUserId,
                  savedAt: new Date().toISOString(),
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                get().addSavedUser(userId, revertEntry);
              } else {
                get().removeSavedUser(userId, targetUserId);
              }

              console.error('Error toggling save status:', result.error);
              return isCurrentlySaved; // Return original state
            }

            return result.saved;
          } catch (error) {
            // Revert optimistic update on error
            if (isCurrentlySaved) {
              const revertEntry: SavedUserEntry = {
                id: crypto.randomUUID(),
                saverId: userId,
                savedUserId: targetUserId,
                savedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              get().addSavedUser(userId, revertEntry);
            } else {
              get().removeSavedUser(userId, targetUserId);
            }

            console.error('Error toggling save status:', error);
            return isCurrentlySaved; // Return original state
          }
        },

        // Clear data for a specific user (useful for logout)
        clearUserData: (userId: string) => {
          set(state => {
            const { [userId]: _, ...savedUsersByUser } = state.savedUsersByUser;
            const { [userId]: _loading, ...loading } = state.loading;
            const { [userId]: _error, ...errors } = state.errors;
            const { [userId]: _sync, ...lastSync } = state.lastSync;

            return {
              savedUsersByUser,
              loading,
              errors,
              lastSync,
            };
          });
        },
      }),
      {
        name: 'saved-users-store',
        // Persist only the core data, not loading/error states
        partialize: state => ({
          savedUsersByUser: state.savedUsersByUser,
          lastSync: state.lastSync,
        }),
      }
    ),
    {
      name: 'saved-users-store',
    }
  )
);

export type { SavedUsersState, SavedUserEntry };
