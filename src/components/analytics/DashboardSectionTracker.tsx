'use client';

import { useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';

type DashboardSection =
  | 'suggested'
  | 'connections'
  | 'saved'
  | 'search'
  | 'notifications'
  | 'account';

interface DashboardSectionTrackerProps {
  activeSection: DashboardSection;
}

/**
 * DashboardSectionTracker - Tracks dashboard tab/section changes as separate page views
 * This allows analytics to distinguish between different dashboard sections
 */
export function DashboardSectionTracker({
  activeSection,
}: DashboardSectionTrackerProps) {
  const analytics = useAnalytics();

  useEffect(() => {
    // Track section change as a virtual page view
    const virtualPagePath = `/dashboard/${activeSection}`;
    const sectionDisplayName = getSectionDisplayName(activeSection);

    console.log('🔥 Dashboard Section Change:', {
      section: activeSection,
      virtualPath: virtualPagePath,
      displayName: sectionDisplayName,
    });

    // Track as custom page view
    analytics.trackPageView(`dashboard_${activeSection}_viewed`);

    // Track as navigation event
    analytics.trackDashboard(`view_${activeSection}` as any);

    // Track as custom event for more granular analytics
    analytics.trackCustomEvent(
      'dashboard_section_view',
      'navigation',
      `dashboard_${activeSection}`
    );

    // Track section-specific metrics
    trackSectionSpecificEvents(activeSection, analytics);
  }, [activeSection, analytics]);

  return null;
}

// Helper function to get user-friendly section names
function getSectionDisplayName(section: DashboardSection): string {
  const sectionNames: Record<DashboardSection, string> = {
    suggested: 'Discover',
    connections: 'Connections',
    saved: 'Saved',
    search: 'Search',
    notifications: 'Notifications',
    account: 'Account',
  };

  return sectionNames[section] || section;
}

// Track section-specific events
function trackSectionSpecificEvents(
  section: DashboardSection,
  analytics: ReturnType<typeof useAnalytics>
) {
  switch (section) {
    case 'suggested':
      analytics.trackCustomEvent(
        'discover_section_loaded',
        'discovery',
        'suggested_users'
      );
      break;

    case 'connections':
      analytics.trackCustomEvent(
        'connections_section_loaded',
        'networking',
        'active_connections'
      );
      break;

    case 'saved':
      analytics.trackCustomEvent(
        'saved_section_loaded',
        'favorites',
        'saved_users'
      );
      break;

    case 'search':
      analytics.trackCustomEvent(
        'search_section_loaded',
        'search',
        'user_search'
      );
      break;

    case 'notifications':
      analytics.trackCustomEvent(
        'notifications_section_loaded',
        'notifications',
        'notification_center'
      );
      break;

    case 'account':
      analytics.trackCustomEvent(
        'account_section_loaded',
        'account',
        'user_account'
      );
      break;
  }
}

export default DashboardSectionTracker;
