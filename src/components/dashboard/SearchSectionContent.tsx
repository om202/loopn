'use client';

import React, { useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import {
  OpenSearchService,
  SearchResult,
} from '../../services/opensearch.service';
import UserCard from './UserCard';
import type { Schema } from '../../../amplify/data/resource';

type UserPresence = Schema['UserPresence']['type'];

interface SearchSectionContentProps {
  onChatRequestSent?: () => void;
  searchQuery?: string;
  shouldSearch?: boolean;
  onOpenProfileSidebar?: (user: UserPresence) => void;
  onUserCardClick?: (user: UserPresence) => void;
  isProfileSidebarOpen?: boolean;
  selectedUserId?: string;
}

export default function SearchSectionContent({
  onChatRequestSent,
  searchQuery = '',
  shouldSearch = false,
  onOpenProfileSidebar,
  onUserCardClick,
  isProfileSidebarOpen,
  selectedUserId,
}: SearchSectionContentProps) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const { user } = useAuthenticator();

  const performSearch = useCallback(
    async (searchTerm: string) => {
      if (!searchTerm.trim() || isSearching || !user) return;

      setIsSearching(true);
      setError(null);
      setHasSearched(true);
      setSearchResults([]); // Clear previous results immediately

      try {
        const response = await OpenSearchService.searchUsers(
          searchTerm.trim(),
          10
        );

        if (!response.success) {
          setError(response.error || 'Search failed');
          setSearchResults([]);
          return;
        }

        // Filter out current user - OpenSearch already provides complete profile data
        const searchResults = response.results || [];
        const filteredResults = searchResults.filter(
          (result: SearchResult) => result.userId !== user.userId
        );

        // Set results directly - no need for additional profile fetching
        setSearchResults(filteredResults);
      } catch (error) {
        console.error('Search error:', error);
        setError('An error occurred while searching');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [isSearching, user]
  );

  // Effect to handle search from external search bar
  React.useEffect(() => {
    if (shouldSearch && searchQuery.trim()) {
      setQuery(searchQuery);
      performSearch(searchQuery.trim());
    }
  }, [shouldSearch, searchQuery, performSearch]);

  return (
    <div className='h-full flex flex-col'>
      {/* Search Results */}
      <div className='flex-1 overflow-y-auto'>
        {!hasSearched ? (
          <div className='flex flex-col items-center justify-center h-full text-center p-8'>
            <div className='w-16 h-16 mx-auto mb-4 bg-zinc-100 rounded-full flex items-center justify-center'>
              <Search className='w-8 h-8 text-zinc-500' />
            </div>
            <h3 className='text-lg font-medium text-zinc-900 mb-2'>
              Search Professionals
            </h3>
            <p className='text-zinc-500 text-base max-w-sm'>
              Search for any professional, in any way you like.
            </p>
            <div className='mt-4 text-sm text-zinc-500'>
              <p>
                Try: "React developer", "AI engineer", "Product manager from
                tech".
              </p>
            </div>
          </div>
        ) : isSearching ? (
          <div>
            <div className='flex items-center gap-3 text-sm text-zinc-600'>
              <span>Just a moment...</span>
            </div>
          </div>
        ) : error ? (
          <div className='flex flex-col items-center justify-center h-full text-center p-8'>
            <div className='text-red-600 text-sm mb-2'>Search Error</div>
            <p className='text-zinc-600 text-sm'>{error}</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-full text-center p-8'>
            <div className='w-16 h-16 mx-auto mb-4 bg-zinc-100 rounded-full flex items-center justify-center'>
              <Search className='w-8 h-8 text-zinc-500' />
            </div>
            <h3 className='text-lg font-medium text-zinc-900 mb-2'>
              No Results Found
            </h3>
            <p className='text-zinc-500 text-sm max-w-sm'>
              No professionals found matching "{query}". Try using different
              keywords or phrases.
            </p>
          </div>
        ) : (
          <div className='space-y-2.5 sm:space-y-3'>
            <div className='text-sm text-zinc-600 mb-4'>
              Found {searchResults.length} results for "{query}"
            </div>

            {searchResults.map(result => (
              <div key={result.userId}>
                <UserCard
                  userPresence={{
                    userId: result.userId,
                    isOnline: false, // Not relevant for search results
                    status: 'OFFLINE', // Static status for search
                    lastSeen: null,
                    lastHeartbeat: null,
                    activeChatId: null,
                    lastChatActivity: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  }}
                  onlineUsers={[]} // Empty - no online status needed
                  existingConversations={new Map()} // Empty for search results
                  pendingRequests={new Set()} // Empty for search results
                  onChatAction={() => onChatRequestSent?.()}
                  onCancelChatRequest={() => {}} // Not used in search context
                  canUserReconnect={() => true} // Default to allow chat requests
                  getReconnectTimeRemaining={() => null} // No restrictions for search
                  onOpenProfileSidebar={onOpenProfileSidebar}
                  onUserCardClick={onUserCardClick}
                  isProfileSidebarOpen={isProfileSidebarOpen}
                  selectedUserId={selectedUserId}
                  searchProfile={result.profile} // OpenSearch profile data
                  useRealtimeStatus={false} // Disable real-time status for search results
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
