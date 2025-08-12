/**
 * Utility functions for managing search history in localStorage
 */

const SEARCH_HISTORY_KEY = 'loopn_search_history';
const MAX_SEARCH_HISTORY = 10;

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
}

/**
 * Get search history from localStorage
 */
export function getSearchHistory(): SearchHistoryItem[] {
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!stored) return [];

    const history = JSON.parse(stored) as SearchHistoryItem[];
    // Sort by timestamp descending (most recent first)
    return history.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error reading search history:', error);
    return [];
  }
}

/**
 * Add a new search to history
 */
export function addToSearchHistory(query: string): void {
  if (!query.trim()) return;

  try {
    const history = getSearchHistory();
    const trimmedQuery = query.trim();

    // Remove duplicate if exists
    const filteredHistory = history.filter(item => item.query !== trimmedQuery);

    // Add new item at the beginning
    const newItem: SearchHistoryItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      query: trimmedQuery,
      timestamp: Date.now(),
    };

    const updatedHistory = [newItem, ...filteredHistory].slice(
      0,
      MAX_SEARCH_HISTORY
    );

    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Error saving search history:', error);
  }
}

/**
 * Remove a search from history by ID
 */
export function removeFromSearchHistory(id: string): void {
  try {
    const history = getSearchHistory();
    const filteredHistory = history.filter(item => item.id !== id);

    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filteredHistory));
  } catch (error) {
    console.error('Error removing from search history:', error);
  }
}

/**
 * Clear all search history
 */
export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing search history:', error);
  }
}
