'use client';

import React, { useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import {
  VectorSearchService,
  SearchResult,
} from '../../services/vector-search.service';
import UserCard from './UserCard';
import { UserProfileService } from '../../services/user-profile.service';
import type { Schema } from '../../../amplify/data/resource';

type UserProfile = Schema['UserProfile']['type'];

interface SearchSectionContentProps {
  onChatRequestSent?: () => void;
  searchQuery?: string;
  shouldSearch?: boolean;
}

interface EnhancedSearchResult extends SearchResult {
  fullProfile?: UserProfile;
  isLoading?: boolean;
}

export default function SearchSectionContent({
  onChatRequestSent,
  searchQuery = '',
  shouldSearch = false,
}: SearchSectionContentProps) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<EnhancedSearchResult[]>(
    []
  );
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

      try {
        const response = await VectorSearchService.searchUsers(
          searchTerm.trim(),
          10
        );

        if (!response.success) {
          setError(response.error || 'Search failed');
          setSearchResults([]);
          return;
        }

        // Filter out current user and enhance results with full profile data
        const filteredResults = (response.results || []).filter(
          result => result.userId !== user.userId
        );

        const enhancedResults: EnhancedSearchResult[] = filteredResults.map(
          result => ({
            ...result,
            isLoading: true,
          })
        );

        setSearchResults(enhancedResults);

        // Load full profile data for each result
        for (let i = 0; i < enhancedResults.length; i++) {
          const result = enhancedResults[i];
          try {
            const fullProfile = await UserProfileService.getProfileDetails(
              result.userId
            );

            setSearchResults(prev =>
              prev.map((item, index) =>
                index === i
                  ? {
                      ...item,
                      fullProfile: fullProfile || undefined,
                      isLoading: false,
                    }
                  : item
              )
            );
          } catch (error) {
            console.error(
              `Error loading profile for user ${result.userId}:`,
              error
            );
            setSearchResults(prev =>
              prev.map((item, index) =>
                index === i ? { ...item, isLoading: false } : item
              )
            );
          }
        }
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
            <Search className='w-16 h-16 text-gray-300 mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              Search Professionals
            </h3>
            <p className='text-gray-600 text-sm max-w-sm'>
              Search for any professional, in any way you like.
            </p>
            <div className='mt-4 text-xs text-gray-500'>
              <p>Try: "React developer", "AI engineer", "Product manager from tech".</p>
            </div>
          </div>
        ) : error ? (
          <div className='flex flex-col items-center justify-center h-full text-center p-8'>
            <div className='text-red-600 text-sm mb-2'>Search Error</div>
            <p className='text-gray-600 text-sm'>{error}</p>
          </div>
        ) : searchResults.length === 0 && !isSearching ? (
          <div className='flex flex-col items-center justify-center h-full text-center p-8'>
            <Search className='w-12 h-12 text-gray-300 mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              No Results Found
            </h3>
            <p className='text-gray-600 text-sm max-w-sm'>
              No professionals found matching "{query}". Try using different
              keywords or phrases.
            </p>
          </div>
        ) : (
          <div className='p-4 space-y-4'>
            <div className='text-sm text-gray-600 mb-4'>
              Found {searchResults.length} professionals matching "{query}"
            </div>
            {searchResults.map(result => {
              if (result.isLoading) {
                return (
                  <div
                    key={result.userId}
                    className='border border-gray-200 rounded-lg p-4'
                  >
                    <div className='animate-pulse'>
                      <div className='flex items-center space-x-3'>
                        <div className='w-12 h-12 bg-gray-200 rounded-full'></div>
                        <div className='flex-1 space-y-2'>
                          <div className='h-4 bg-gray-200 rounded w-3/4'></div>
                          <div className='h-3 bg-gray-200 rounded w-1/2'></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={result.userId}>
                  <UserCard
                    userPresence={{
                      userId: result.userId,
                      isOnline: false,
                      lastSeen: null,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    }}
                    onlineUsers={[]}
                    existingConversations={new Map()}
                    pendingRequests={new Set()}
                    onChatAction={() => onChatRequestSent?.()}
                    onCancelChatRequest={() => {}}
                    canUserReconnect={() => true}
                    getReconnectTimeRemaining={() => null}

                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
