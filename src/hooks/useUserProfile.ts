'use client';

import { useEffect, useState } from 'react';
import { useSubscriptionStore } from '../stores/subscription-store';
import type { Schema } from '../../amplify/data/resource';

type UserProfile = Schema['UserProfile']['type'];

interface UseUserProfileReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook for fetching and caching user profiles
 * This eliminates duplicate API calls by using centralized caching
 *
 * Benefits:
 * - Cached profiles are shared across all components
 * - No duplicate API calls when switching between sections
 * - Automatic caching and retrieval
 */
export function useUserProfile(userId: string): UseUserProfileReturn {
  const { getUserProfile, fetchUserProfile } = useSubscriptionStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get cached profile immediately
  const cachedProfile = getUserProfile(userId);
  const [profile, setProfile] = useState<UserProfile | null>(cachedProfile);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Check if we already have the profile cached
    const cached = getUserProfile(userId);
    if (cached) {
      setProfile(cached);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Fetch profile if not cached
    setIsLoading(true);
    setError(null);

    fetchUserProfile(userId)
      .then(fetchedProfile => {
        setProfile(fetchedProfile);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(
          `[useUserProfile] Error fetching profile for ${userId}:`,
          err
        );
        setError('Failed to load user profile');
        setIsLoading(false);
      });
  }, [userId, getUserProfile, fetchUserProfile]);

  // Update profile when cache changes (in case another component fetched it)
  useEffect(() => {
    const cached = getUserProfile(userId);
    if (cached && cached !== profile) {
      setProfile(cached);
    }
  }, [userId, getUserProfile, profile]);

  return {
    profile,
    isLoading,
    error,
  };
}
