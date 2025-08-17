'use client';

import CustomAuthenticator from '@/components/auth/CustomAuthenticator';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AuthPage() {
  const { authStatus, onboardingStatus } = useAuth();
  const searchParams = useSearchParams();

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

  // Get initial view from URL params
  const initialView =
    searchParams.get('view') === 'signup' ? 'signUp' : 'signIn';

  return <CustomAuthenticator initialView={initialView} />;
}
