'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

import { simplePresenceManager } from '../lib/presence-utils';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

export default function ProtectedRoute({
  children,
  requireOnboarding = false,
}: ProtectedRouteProps) {
  const { user, authStatus, onboardingStatus } = useAuth();

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      // Set user offline and clean up presence when user is unauthenticated
      simplePresenceManager.setOffline().finally(() => {
        simplePresenceManager.cleanup();
      });
      window.location.href = '/auth';
    }

    if (authStatus === 'authenticated' && user) {
      // Check onboarding status if required
      if (
        requireOnboarding &&
        onboardingStatus !== null &&
        (!onboardingStatus.isOnboardingComplete ||
          onboardingStatus.needsProfilePicture)
      ) {
        window.location.href = '/onboarding';
        return;
      }

      // Initialize simple presence management with delay to ensure auth is ready
      setTimeout(() => {
        simplePresenceManager.initialize(
          user.userId,
          user.signInDetails?.loginId || ''
        );
      }, 2000); // 2 second delay

      return () => {
        // Cleanup will be handled when auth status changes
      };
    }
  }, [authStatus, user, requireOnboarding, onboardingStatus]);

  if (authStatus === 'unauthenticated') {
    return null; // Will redirect to /auth via useEffect
  }

  if (authStatus === 'configuring') {
    return null; // Wait for auth to complete before showing components
  }

  if (authStatus === 'authenticated' && user) {
    // If onboarding is required but status is still loading, show nothing
    if (requireOnboarding && onboardingStatus === null) {
      return null;
    }

    // If onboarding is required but not completed, don't render (will redirect)
    if (
      requireOnboarding &&
      onboardingStatus &&
      (!onboardingStatus.isOnboardingComplete ||
        onboardingStatus.needsProfilePicture)
    ) {
      return null;
    }

    return children;
  }

  return null;
}
