import { event } from '@/components/GoogleAnalytics';
import { useAuth } from '@/contexts/AuthContext';

export const useAnalytics = () => {
  const { user } = useAuth();
  const userId = user?.userId;

  // 1. Basic page views (6 events)
  const trackPageView = (pageName: string) => {
    event({
      action: 'page_view',
      category: 'pages',
      label: pageName,
      userId,
    });
  };

  // 2. User journey events (2 events)
  const trackSignupCompleted = () => {
    event({
      action: 'signup_completed',
      category: 'user_journey',
      label: 'user_registered',
      userId,
    });
  };

  const trackOnboardingCompleted = () => {
    event({
      action: 'onboarding_completed',
      category: 'user_journey',
      label: 'user_onboarded',
      userId,
    });
  };

  // 3. Key user actions (2 events)
  const trackSearchPerformed = (query: string, resultCount: number) => {
    event({
      action: 'search_performed',
      category: 'user_actions',
      label: `query_${query.length}_chars`,
      value: resultCount,
      userId,
    });
  };

  const trackConnectionMade = () => {
    event({
      action: 'connection_made',
      category: 'user_actions',
      label: 'successful_connection',
      userId,
    });
  };

  // 4. Dashboard navigation (not page views)
  const trackDashboardTabViewed = (tabName: string) => {
    event({
      action: 'dashboard_tab_viewed',
      category: 'navigation',
      label: `tab_${tabName}`,
      userId,
    });
  };

  return {
    trackPageView,
    trackSignupCompleted,
    trackOnboardingCompleted,
    trackSearchPerformed,
    trackConnectionMade,
    trackDashboardTabViewed,
  };
};
