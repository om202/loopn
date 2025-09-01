import { event } from '@/components/GoogleAnalytics';
import { useAuth } from '@/contexts/AuthContext';

export const useAnalytics = () => {
  const { user } = useAuth();
  const userId = user?.userId;
  // Track page visits with user context
  const trackPageView = (
    pageName: string,
    additionalData?: Record<string, unknown>
  ) => {
    event({
      action: 'page_view',
      category: 'engagement',
      label: pageName,
      userId,
      ...additionalData,
    });
  };

  // Track user authentication events
  const trackAuth = (action: 'login' | 'signup' | 'logout') => {
    event({
      action: action,
      category: 'authentication',
      label: `user_${action}`,
      userId,
    });
  };

  // Track chat interactions
  const trackChat = (
    action: 'send_message' | 'start_chat' | 'end_chat' | 'receive_message'
  ) => {
    event({
      action: action,
      category: 'chat',
      label: `chat_${action}`,
      userId,
    });
  };

  // Track networking actions
  const trackNetworking = (
    action:
      | 'send_request'
      | 'accept_request'
      | 'decline_request'
      | 'view_profile'
  ) => {
    event({
      action: action,
      category: 'networking',
      label: `connection_${action}`,
      userId,
    });
  };

  // Track onboarding and resume actions
  const trackOnboarding = (
    action:
      | 'upload_resume'
      | 'complete_profile'
      | 'skip_step'
      | 'complete_onboarding'
  ) => {
    event({
      action: action,
      category: 'onboarding',
      label: `onboarding_${action}`,
      userId,
    });
  };

  // Track dashboard interactions
  const trackDashboard = (
    action: 'view_matches' | 'filter_users' | 'search_users' | 'export_data'
  ) => {
    event({
      action: action,
      category: 'dashboard',
      label: `dashboard_${action}`,
      userId,
    });
  };

  // Track file operations
  const trackFile = (
    action: 'upload' | 'download' | 'delete' | 'view',
    fileType?: string
  ) => {
    event({
      action: `file_${action}`,
      category: 'files',
      label: fileType ? `${fileType}_${action}` : `file_${action}`,
      userId,
    });
  };

  // Track user engagement
  const trackEngagement = (
    action:
      | 'scroll_to_bottom'
      | 'time_on_page'
      | 'click_external_link'
      | 'page_load_time'
      | 'scroll_25_percent'
      | 'scroll_50_percent'
      | 'scroll_75_percent'
      | 'home_page_time_spent',
    value?: number
  ) => {
    event({
      action: action,
      category: 'engagement',
      label: `user_${action}`,
      value: value,
      userId,
    });
  };

  // Track errors and issues
  const trackError = (errorType: string) => {
    event({
      action: 'error_occurred',
      category: 'errors',
      label: errorType,
      userId,
    });
  };

  // Track business metrics
  const trackBusiness = (
    action: 'successful_match' | 'premium_upgrade' | 'trial_conversion'
  ) => {
    event({
      action: action,
      category: 'business',
      label: `business_${action}`,
      userId,
    });
  };

  // Generic custom event tracker
  const trackCustomEvent = (
    action: string,
    category: string,
    label?: string,
    value?: number
  ) => {
    event({
      action,
      category,
      label,
      value,
      userId,
    });
  };

  return {
    trackPageView,
    trackAuth,
    trackChat,
    trackNetworking,
    trackOnboarding,
    trackDashboard,
    trackFile,
    trackEngagement,
    trackError,
    trackBusiness,
    trackCustomEvent,
  };
};
