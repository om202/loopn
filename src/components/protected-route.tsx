'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

import { simplePresenceManager } from '../lib/presence-utils';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, authStatus } = useAuth();

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      // Set user offline and clean up presence when user is unauthenticated
      simplePresenceManager.setOffline().finally(() => {
        simplePresenceManager.cleanup();
      });
      window.location.href = '/auth';
    }

    if (authStatus === 'authenticated' && user) {
      // Initialize simple presence management
      simplePresenceManager.initialize(
        user.userId,
        user.signInDetails?.loginId || ''
      );

      return () => {
        // Cleanup will be handled when auth status changes
      };
    }
  }, [authStatus, user]);

  if (authStatus === 'unauthenticated') {
    return null; // Will redirect to /auth via useEffect
  }

  if (authStatus === 'configuring') {
    return children; // Show the page immediately, let components handle their own loading
  }

  if (authStatus === 'authenticated' && user) {
    return children;
  }

  return null;
}
