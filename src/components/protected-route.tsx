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

  if (authStatus === 'configuring' || authStatus === 'unauthenticated') {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto' />
          <p className='mt-2 text-gray-600'>Loading...</p>
        </div>
      </div>
    );
  }

  if (authStatus === 'authenticated' && user) {
    return children;
  }

  return null;
}
