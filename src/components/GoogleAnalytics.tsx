'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Google Analytics measurement ID
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Environment detection
const getEnvironment = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'localhost';
    }
    return 'production';
  }
  return 'production';
};

// Enhanced page view tracking
const pageview = (url: string, userId?: string) => {
  if (typeof window !== 'undefined' && window.gtag && GA_MEASUREMENT_ID) {
    const environment = getEnvironment();
    const fullUrl = window.location.href;

    console.log('🔥 GA4 Enhanced Page View:', {
      url,
      fullUrl,
      userId: userId || 'anonymous',
      environment,
    });

    // Set user ID if available
    if (userId) {
      window.gtag('config', GA_MEASUREMENT_ID, {
        user_id: userId,
        custom_map: {
          custom_dimension_1: environment,
          custom_dimension_2: userId,
        },
      });
    }

    // Track page view
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
      page_title: document.title,
      page_location: fullUrl,
    });

    // Send custom event with enhanced data
    window.gtag('event', 'page_view', {
      page_title: document.title,
      page_location: fullUrl,
      page_path: url,
      user_id: userId || 'anonymous',
      environment: environment,
      timestamp: Date.now(),
    });
  }
};

// Enhanced event tracking
export const event = ({
  action,
  category,
  label,
  value,
  userId,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
  userId?: string;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    const environment = getEnvironment();

    console.log('🔥 GA4 Event:', {
      action,
      category,
      label,
      value,
      userId: userId || 'anonymous',
      environment,
    });

    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      user_id: userId || 'anonymous',
      environment: environment,
      timestamp: Date.now(),
      custom_parameter_1: environment,
      custom_parameter_2: userId || 'anonymous',
    });
  }
};

// Page tracker component
export function PageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, authStatus } = useAuth();

  useEffect(() => {
    if (GA_MEASUREMENT_ID) {
      const search = searchParams?.toString();
      const url = pathname + (search ? `?${search}` : '');
      const userId = user?.userId || null;

      // Track page view with user context
      pageview(url, userId || undefined);

      // Track additional web app standard events
      trackStandardWebAppEvents(url, userId, authStatus);
    }
  }, [pathname, searchParams, user, authStatus]);

  return null;
}

// Standard web app analytics events
const trackStandardWebAppEvents = (
  url: string,
  userId: string | null,
  authStatus: string
) => {
  if (!window.gtag) return;

  const environment = getEnvironment();
  const pageName = getPageName(url);

  // User engagement event
  window.gtag('event', 'user_engagement', {
    engagement_time_msec: 1000, // Will be updated by GA4 automatically
    user_id: userId || 'anonymous',
    environment: environment,
    page_name: pageName,
    auth_status: authStatus,
  });

  // Session tracking
  window.gtag('event', 'session_start', {
    session_id: getSessionId(),
    user_id: userId || 'anonymous',
    environment: environment,
    page_name: pageName,
  });

  // Track authentication status change
  window.gtag('event', 'auth_status_change', {
    auth_status: authStatus,
    user_id: userId || 'anonymous',
    environment: environment,
    page_name: pageName,
  });
};

// Helper functions
const getPageName = (url: string) => {
  const path = url.split('?')[0];
  switch (path) {
    case '/':
      return 'home';
    case '/dashboard':
      return 'dashboard';
    case '/chat':
      return 'chat';
    case '/auth':
      return 'authentication';
    case '/onboarding':
      return 'onboarding';
    case '/contact':
      return 'contact';
    case '/privacy':
      return 'privacy';
    case '/terms':
      return 'terms';
    case '/resume-parser-mvp':
      return 'resume_parser';
    default:
      return path.replace('/', '').replace(/\//g, '_') || 'unknown';
  }
};

const getSessionId = () => {
  if (typeof window !== 'undefined') {
    let sessionId = sessionStorage.getItem('ga_session_id');
    if (!sessionId) {
      sessionId =
        Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('ga_session_id', sessionId);
    }
    return sessionId;
  }
  return 'unknown_session';
};

// Main Google Analytics component
export default function GoogleAnalytics() {
  useEffect(() => {
    if (!GA_MEASUREMENT_ID) {
      return;
    }

    // Load gtag script
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script1);

    // Initialize gtag
    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_MEASUREMENT_ID}');
    `;
    document.head.appendChild(script2);

    // Cleanup
    return () => {
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
  }, []);

  return null;
}

// Type definitions for gtag
declare global {
  interface Window {
    gtag: (command: string, ...args: unknown[]) => void;
    dataLayer: Record<string, unknown>[];
  }
}
