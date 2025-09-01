'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAuth } from '@/contexts/AuthContext';

/**
 * StandardWebAppAnalytics - Tracks standard web app events on each page
 * Includes performance metrics, user behavior, and page-specific analytics
 */
export function StandardWebAppAnalytics() {
  const pathname = usePathname();
  const { user, authStatus } = useAuth();
  const analytics = useAnalytics();

  useEffect(() => {
    // Track page-specific standard events
    const trackPageSpecificEvents = () => {
      const pageName = getPageName(pathname || '/');

      // Track page load performance
      if (typeof window !== 'undefined' && window.performance) {
        const loadTime =
          window.performance.timing.loadEventEnd -
          window.performance.timing.navigationStart;
        if (loadTime > 0) {
          analytics.trackEngagement('page_load_time', loadTime);
        }
      }

      // Track page-specific events
      switch (pathname) {
        case '/':
          trackHomePageEvents(analytics);
          break;
        case '/dashboard':
          trackDashboardEvents(analytics);
          break;
        case '/chat':
          trackChatPageEvents(analytics);
          break;
        case '/auth':
          trackAuthPageEvents(analytics);
          break;
        case '/onboarding':
          trackOnboardingPageEvents(analytics);
          break;
        case '/resume-parser-mvp':
          trackResumeParserEvents(analytics);
          break;
        default:
          trackGenericPageEvents(analytics, pageName);
      }
    };

    // Track events after a short delay to ensure page is loaded
    const timer = setTimeout(trackPageSpecificEvents, 1000);
    return () => clearTimeout(timer);
  }, [pathname, user, authStatus, analytics]);

  // Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) *
          100
      );

      // Track milestone scroll depths
      if (scrollPercent >= 25 && scrollPercent < 50) {
        analytics.trackEngagement('scroll_25_percent');
      } else if (scrollPercent >= 50 && scrollPercent < 75) {
        analytics.trackEngagement('scroll_50_percent');
      } else if (scrollPercent >= 75 && scrollPercent < 100) {
        analytics.trackEngagement('scroll_75_percent');
      } else if (scrollPercent >= 100) {
        analytics.trackEngagement('scroll_to_bottom');
      }
    };

    let scrollTimeout: NodeJS.Timeout;
    const throttledScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 500);
    };

    window.addEventListener('scroll', throttledScroll);
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      clearTimeout(scrollTimeout);
    };
  }, [analytics]);

  return null;
}

// Page-specific tracking functions
function trackHomePageEvents(analytics: ReturnType<typeof useAnalytics>) {
  // Track home page engagement
  analytics.trackPageView('home_page_loaded');

  // Track time spent on landing page
  const startTime = Date.now();

  return () => {
    const timeSpent = Date.now() - startTime;
    if (timeSpent > 5000) {
      // Only track if user spent more than 5 seconds
      analytics.trackEngagement('home_page_time_spent', timeSpent);
    }
  };
}

function trackDashboardEvents(analytics: ReturnType<typeof useAnalytics>) {
  analytics.trackPageView('dashboard_loaded');
  analytics.trackDashboard('view_matches');

  // Track dashboard feature usage
  analytics.trackCustomEvent(
    'dashboard_feature_access',
    'navigation',
    'main_dashboard'
  );
}

function trackChatPageEvents(analytics: ReturnType<typeof useAnalytics>) {
  analytics.trackPageView('chat_page_loaded');
  analytics.trackChat('start_chat');

  // Track chat engagement
  analytics.trackCustomEvent('chat_interface_loaded', 'chat', 'chat_ui_ready');
}

function trackAuthPageEvents(analytics: ReturnType<typeof useAnalytics>) {
  analytics.trackPageView('auth_page_loaded');
  analytics.trackCustomEvent(
    'auth_interface_viewed',
    'authentication',
    'login_signup_page'
  );
}

function trackOnboardingPageEvents(analytics: ReturnType<typeof useAnalytics>) {
  analytics.trackPageView('onboarding_started');
  analytics.trackOnboarding('complete_profile');

  // Track onboarding step progression
  analytics.trackCustomEvent(
    'onboarding_step_viewed',
    'onboarding',
    'user_setup'
  );
}

function trackResumeParserEvents(analytics: ReturnType<typeof useAnalytics>) {
  analytics.trackPageView('resume_parser_loaded');
  analytics.trackFile('view', 'resume_parser');

  // Track resume parser feature usage
  analytics.trackCustomEvent(
    'resume_parser_accessed',
    'features',
    'ai_resume_parser'
  );
}

function trackGenericPageEvents(
  analytics: ReturnType<typeof useAnalytics>,
  pageName: string
) {
  analytics.trackPageView(`${pageName}_loaded`);
  analytics.trackCustomEvent('generic_page_view', 'navigation', pageName);
}

// Helper functions
function getPageName(pathname: string): string {
  switch (pathname) {
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
      return pathname.replace('/', '').replace(/\//g, '_') || 'unknown';
  }
}
