'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useEffect } from 'react';

import { userService } from '../services/user.service';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, authStatus } = useAuthenticator(context => [
    context.user,
    context.authStatus,
  ]);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      window.location.href = '/auth';
    }

    if (authStatus === 'authenticated' && user) {
      // Set user online
      userService.setUserOnline(user.userId, user.signInDetails?.loginId || '');

      // Set offline on page unload
      const handleUnload = () => {
        userService.setUserOffline(
          user.userId,
          user.signInDetails?.loginId || ''
        );
      };
      window.addEventListener('beforeunload', handleUnload);

      return () => {
        window.removeEventListener('beforeunload', handleUnload);
        userService.setUserOffline(
          user.userId,
          user.signInDetails?.loginId || ''
        );
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
