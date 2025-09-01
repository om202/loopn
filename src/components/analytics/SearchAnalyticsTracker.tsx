'use client';

import { useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import type { SearchResponse } from '@/types/search.types';

interface SearchAnalyticsTrackerProps {
  searchQuery?: string;
  searchResponse?: SearchResponse | null;
  isSearching?: boolean;
  searchError?: string | null;
  hasSearched?: boolean;
}

/**
 * SearchAnalyticsTracker - Comprehensive search analytics tracking
 * Tracks search queries, results, performance, errors, and user interactions
 */
export function SearchAnalyticsTracker({
  searchQuery,
  searchResponse,
  isSearching,
  searchError,
  hasSearched,
}: SearchAnalyticsTrackerProps) {
  const analytics = useAnalytics();

  // Track search query initiation
  useEffect(() => {
    if (searchQuery && searchQuery.trim() && isSearching) {
      console.log('🔍 Search Query Started:', {
        query: searchQuery,
        queryLength: searchQuery.length,
        queryWords: searchQuery.split(' ').length,
      });

      analytics.trackSearch('search_initiated', {
        search_term: searchQuery,
        query_length: searchQuery.length,
        word_count: searchQuery.split(' ').length,
        search_type: 'user_profiles',
      });
    }
  }, [searchQuery, isSearching, analytics]);

  // Track search results and performance
  useEffect(() => {
    if (searchResponse && hasSearched && !isSearching) {
      const results = searchResponse.results || [];
      const metrics = searchResponse.metrics;

      console.log('🔍 Search Results Received:', {
        query: searchResponse.query,
        resultsCount: results.length,
        totalFound: searchResponse.totalFound || 0,
        responseTime: metrics?.processingTimeMs || 0,
        hasResults: results.length > 0,
      });

      // Track search completion
      analytics.trackSearch('search_completed', {
        search_term: searchResponse.query || searchQuery || '',
        results_count: results.length,
        total_found: searchResponse.totalFound || 0,
        has_results: results.length > 0,
        response_time_ms: metrics?.processingTimeMs || 0,
        search_success: !searchError,
      });

      // Track search performance metrics
      if (metrics) {
        analytics.trackSearch('search_performance', {
          search_term: searchResponse.query || searchQuery || '',
          embedding_time_ms: metrics.queryEmbeddingTimeMs || 0,
          processing_time_ms: metrics.processingTimeMs || 0,
          fetch_time_ms: metrics.fetchTimeMs || 0,
          total_processed: metrics.totalProcessed || 0,
          total_matched: metrics.totalMatched || 0,
        });
      }

      // Track result categories
      if (results.length > 0) {
        const topScore = Math.max(...results.map(r => r.score || 0));
        const avgScore =
          results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length;

        analytics.trackSearch('search_results_analysis', {
          search_term: searchResponse.query || searchQuery || '',
          top_score: Math.round(topScore * 100) / 100,
          avg_score: Math.round(avgScore * 100) / 100,
          score_distribution: categorizeScores(results),
          result_diversity: analyzeDiversity(results),
        });
      } else {
        // Track empty results
        analytics.trackSearch('search_no_results', {
          search_term: searchResponse.query || searchQuery || '',
          total_processed: metrics?.totalProcessed || 0,
          search_reason: searchError ? 'error' : 'no_matches',
        });
      }
    }
  }, [
    searchResponse,
    hasSearched,
    isSearching,
    searchQuery,
    searchError,
    analytics,
  ]);

  // Track search errors
  useEffect(() => {
    if (searchError && hasSearched) {
      console.log('🔍 Search Error:', {
        query: searchQuery,
        error: searchError,
      });

      analytics.trackSearch('search_failed', {
        search_term: searchQuery || '',
        error_message: searchError,
        error_type: categorizeSearchError(searchError),
      });

      analytics.trackError(
        `search_error_${categorizeSearchError(searchError)}`
      );
    }
  }, [searchError, hasSearched, searchQuery, analytics]);

  return null;
}

// Helper function to categorize search result scores
function categorizeScores(results: Array<{ score?: number }>): string {
  const scores = results.map(r => r.score || 0);
  const highQuality = scores.filter(s => s >= 0.8).length;
  const mediumQuality = scores.filter(s => s >= 0.6 && s < 0.8).length;
  const lowQuality = scores.filter(s => s < 0.6).length;

  return `high:${highQuality},medium:${mediumQuality},low:${lowQuality}`;
}

// Helper function to analyze result diversity
function analyzeDiversity(
  results: Array<{ user?: { industry?: string; jobRole?: string } }>
): string {
  if (results.length === 0) return 'none';
  if (results.length === 1) return 'single';

  // Simple diversity check - could be enhanced based on user profile fields
  const industries = new Set(
    results.map(r => r.user?.industry).filter(Boolean)
  );
  const roles = new Set(results.map(r => r.user?.jobRole).filter(Boolean));

  // Calculate diversity based on both industries and roles
  const combinedDiversity = Math.max(industries.size, roles.size);

  if (combinedDiversity > results.length * 0.7) return 'high_diversity';
  if (combinedDiversity > results.length * 0.3) return 'medium_diversity';
  return 'low_diversity';
}

// Helper function to categorize search errors
function categorizeSearchError(error: string): string {
  if (error.toLowerCase().includes('network')) return 'network_error';
  if (error.toLowerCase().includes('timeout')) return 'timeout_error';
  if (error.toLowerCase().includes('rate limit')) return 'rate_limit_error';
  if (error.toLowerCase().includes('permission')) return 'permission_error';
  if (error.toLowerCase().includes('embedding')) return 'embedding_error';
  return 'general_error';
}

export default SearchAnalyticsTracker;
