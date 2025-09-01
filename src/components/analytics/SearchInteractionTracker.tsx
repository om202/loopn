'use client';

import { useAnalytics } from '@/hooks/useAnalytics';

interface SearchInteractionTrackerProps {
  searchQuery?: string;
  isSearchResult?: boolean;
  onProfileClick?: () => void;
  onChatRequest?: () => void;
  resultIndex?: number;
  resultScore?: number;
  resultUserId?: string;
}

/**
 * SearchInteractionTracker - Tracks user interactions with search results
 * Should be used in UserCard components when they display search results
 */
export function useSearchInteractionTracker({
  searchQuery,
  isSearchResult,
  resultIndex,
  resultScore,
  resultUserId,
}: Omit<SearchInteractionTrackerProps, 'onProfileClick' | 'onChatRequest'>) {
  const analytics = useAnalytics();

  const trackProfileClick = () => {
    if (isSearchResult && searchQuery) {
      console.log('🔍 Search Result Profile Click:', {
        query: searchQuery,
        resultIndex,
        resultScore,
        userId: resultUserId
      });

      analytics.trackSearch('search_result_clicked', {
        search_term: searchQuery,
        result_index: resultIndex || 0,
        result_score: resultScore || 0,
        clicked_user_id: resultUserId || '',
        interaction_type: 'profile_view'
      });
    }
  };

  const trackChatRequest = () => {
    if (isSearchResult && searchQuery) {
      console.log('🔍 Search Result Chat Request:', {
        query: searchQuery,
        resultIndex,
        resultScore,
        userId: resultUserId
      });

      analytics.trackSearch('search_result_chat_request', {
        search_term: searchQuery,
        result_index: resultIndex || 0,
        result_score: resultScore || 0,
        target_user_id: resultUserId || '',
        interaction_type: 'chat_request',
        conversion_type: 'search_to_chat'
      });

      // Also track as a conversion event
      analytics.trackBusiness('successful_match');
    }
  };

  const trackResultView = () => {
    if (isSearchResult && searchQuery && resultUserId) {
      analytics.trackSearch('search_result_viewed', {
        search_term: searchQuery,
        result_index: resultIndex || 0,
        result_score: resultScore || 0,
        viewed_user_id: resultUserId,
        view_type: 'card_impression'
      });
    }
  };

  return {
    trackProfileClick,
    trackChatRequest,
    trackResultView,
  };
}

export default useSearchInteractionTracker;
