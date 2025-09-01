import { event } from '@/components/GoogleAnalytics';

export const useAnalytics = () => {
  // Track page visits
  const trackPageView = (
    pageName: string,
    additionalData?: Record<string, unknown>
  ) => {
    event({
      action: 'page_view',
      category: 'engagement',
      label: pageName,
      ...additionalData,
    });
  };

  // Track user authentication events
  const trackAuth = (action: 'login' | 'signup' | 'logout') => {
    event({
      action: action,
      category: 'authentication',
      label: `user_${action}`,
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
    });
  };

  // Track user engagement
  const trackEngagement = (
    action: 'scroll_to_bottom' | 'time_on_page' | 'click_external_link',
    value?: number
  ) => {
    event({
      action: action,
      category: 'engagement',
      label: `user_${action}`,
      value: value,
    });
  };

  // Track errors and issues
  const trackError = (errorType: string) => {
    event({
      action: 'error_occurred',
      category: 'errors',
      label: errorType,
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
