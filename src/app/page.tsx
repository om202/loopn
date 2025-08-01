'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import LoadingContainer from '../components/LoadingContainer';

export default function RootPage() {
  const { authStatus } = useAuthenticator(context => [context.authStatus]);
  const router = useRouter();

  useEffect(() => {
    // Check if this is a manual navigation (user came from within the app)
    const isManualNavigation =
      document.referrer &&
      (document.referrer.includes('localhost') ||
        document.referrer.includes(window.location.host));

    if (isManualNavigation) {
      // Manual navigation to root - redirect to home page
      router.replace('/home');
    } else {
      // First launch - redirect based on auth status
      if (authStatus === 'authenticated') {
        router.replace('/dashboard');
      } else if (authStatus === 'unauthenticated') {
        router.replace('/home');
      }
    }
  }, [authStatus, router]);

  // Show loading while auth is configuring
  if (authStatus === 'configuring') {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-gray-500'>Loading...</div>
      </div>
    );
  }

  // Show nothing while redirecting
  return null;
}
