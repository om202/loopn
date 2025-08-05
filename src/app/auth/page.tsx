'use client';

import CustomAuthenticator from '@/components/auth/CustomAuthenticator';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export default function AuthPage() {
  const { authStatus } = useAuth();

  useEffect(() => {
    // Redirect to dashboard if authenticated
    if (authStatus === 'authenticated') {
      window.location.href = '/dashboard';
    }
  }, [authStatus]);

  // Don't render anything if user is authenticated (redirecting)
  if (authStatus === 'authenticated') {
    return null;
  }

  return <CustomAuthenticator />;
}
