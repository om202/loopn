'use client';

import CustomAuthenticator from '@/components/auth/CustomAuthenticator';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join Loopn - AI-Powered Professional Networking',
  description: 'Sign up or sign in to Loopn. Upload your resume, get matched with compatible professionals, and start building meaningful career relationships.',
  keywords: [
    'join loopn',
    'sign up professional networking',
    'login career platform',
    'register AI networking',
    'professional networking signup',
    'career networking login'
  ],
  openGraph: {
    title: 'Join Loopn - AI-Powered Professional Networking',
    description: 'Sign up to connect with professionals who matter to your career. AI-powered matching starts with your resume.',
    type: 'website',
    url: 'https://www.loopn.io/auth',
    images: [
      {
        url: 'https://www.loopn.io/loopn.png',
        width: 1200,
        height: 630,
        alt: 'Join Loopn Professional Network',
      },
    ],
  },
  robots: {
    index: true,
    follow: false, // Don't follow auth links
  },
  alternates: {
    canonical: 'https://www.loopn.io/auth',
  },
};
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function AuthPageContent() {
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
    searchParams?.get('view') === 'signup' ? 'signUp' : 'signIn';

  return <CustomAuthenticator initialView={initialView} />;
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthPageContent />
    </Suspense>
  );
}
