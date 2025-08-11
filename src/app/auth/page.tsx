'use client';

import CustomAuthenticator from '@/components/auth/CustomAuthenticator';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export default function AuthPage() {
  const { authStatus, onboardingStatus } = useAuth();

  useEffect(() => {
    // Redirect based on auth and onboarding status
    if (authStatus === 'authenticated') {
      if (onboardingStatus === null) {
        // Still loading onboarding status, wait
        return;
      }

      if (!onboardingStatus.isOnboardingComplete) {
        window.location.href = '/onboarding';
      } else {
        window.location.href = '/dashboard';
      }
    }
  }, [authStatus, onboardingStatus]);

  // Don't render anything if user is authenticated (redirecting)
  if (authStatus === 'authenticated') {
    return null;
  }

  return <CustomAuthenticator />;
}
