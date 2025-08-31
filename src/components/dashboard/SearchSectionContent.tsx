'use client';

import React, { useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import UserCard from './UserCard';
import { useAuthenticator } from '@aws-amplify/ui-react';
import LoadingContainer from '../LoadingContainer';
import { RAGSearchService } from '../../services';
import type {
  SearchResult,
  SearchResponse,
  SearchMetrics,
} from '../../types/search.types';
import type { Schema } from '../../../amplify/data/resource';

type UserPresence = Schema['UserPresence']['type'];
type Conversation = Schema['Conversation']['type'];

interface SearchSectionContentProps {
  onChatRequestSent?: () => void;
  searchQuery?: string;
  shouldSearch?: boolean;
  onOpenProfileSidebar?: (user: UserPresence) => void;
  onUserCardClick?: (user: UserPresence) => void;
  isProfileSidebarOpen?: boolean;
  selectedUserId?: string;
  // Chat-related props
  existingConversations: Map<string, Conversation>;
  pendingRequests: Set<string>;
  optimisticPendingRequests: Set<string>;
  incomingRequestSenderIds: Set<string>;
  onlineUsers: UserPresence[];

  onCancelChatRequest: (userId: string) => void;
  onAcceptChatRequest: (userId: string) => void;
  // State setters for optimistic updates
  setOptimisticPendingRequests: (
    fn: (prev: Set<string>) => Set<string>
  ) => void;
}

export default function SearchSectionContent({
  searchQuery = '',
  shouldSearch = false,
  onOpenProfileSidebar: _onOpenProfileSidebar,
  onUserCardClick,
  isProfileSidebarOpen: _isProfileSidebarOpen,
  selectedUserId,
  existingConversations,
  pendingRequests,
  optimisticPendingRequests,
  incomingRequestSenderIds,
  onlineUsers,
  onCancelChatRequest,
  onAcceptChatRequest,
  setOptimisticPendingRequests,
}: SearchSectionContentProps) {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchMetrics, setSearchMetrics] = useState<SearchMetrics | null>(
    null
  );
  const { user } = useAuthenticator();

  // Initialize chat actions

  // Handle chat action for search results

  // Handle cancel chat request

  const performSearch = useCallback(
    async (searchTerm: string) => {
      if (!searchTerm.trim() || isSearching || !user) return;

      setIsSearching(true);
      setError(null);
      setHasSearched(true);
      setSearchResults([]); // Clear previous results immediately
      setSearchMetrics(null);

      try {


        const response: SearchResponse = await RAGSearchService.searchProfiles(
          searchTerm,
          {
            limit: 20,
            minSimilarity: 0.3,
            excludeUserIds: [user.userId], // Exclude current user from results
          }
        );

        setSearchResults(response.results);
        setSearchMetrics(response.metrics);


      } catch (searchError) {
        console.error('Search failed:', searchError);
        const errorMessage =
          searchError instanceof Error
            ? searchError.message
            : 'Search failed. Please try again.';
        setError(errorMessage);
      } finally {
        setIsSearching(false);
      }
    },
    [isSearching, user]
  );

  // Effect to handle search from external search bar
  React.useEffect(() => {
    if (shouldSearch && searchQuery.trim()) {
      performSearch(searchQuery.trim());
    }
  }, [shouldSearch, searchQuery, performSearch]);

  // Handle chat action for search results
  const handleChatAction = (userId: string) => {
    setOptimisticPendingRequests(prev => new Set(prev).add(userId));
    // Additional chat action logic would go here
  };

  return (
    <div className='h-full flex flex-col'>
      {/* Search Results */}
      <div className='flex-1 overflow-y-auto w-full'>
        {!hasSearched ? (
          <div className='flex flex-col items-center justify-center h-full text-center p-8 transition-opacity duration-200 opacity-100'>
            <div className='w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center'>
              <Search className='w-8 h-8 text-slate-500' />
            </div>
            <h3 className='text-lg font-medium text-black mb-1'>
              Search Professionals
            </h3>
          </div>
        ) : isSearching ? (
          <div className='transition-opacity duration-200 opacity-100'>
            <LoadingContainer size='lg' />
          </div>
        ) : error ? (
          <div className='flex flex-col items-center justify-center h-full text-center p-8 transition-opacity duration-200 opacity-100'>
            <div className='text-b_red-600 text-sm mb-2'>Search Error</div>
            <p className='text-slate-500 text-sm'>{error}</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-full text-center p-8 transition-opacity duration-200 opacity-100'>
            <div className='w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center'>
              <Search className='w-8 h-8 text-slate-500' />
            </div>
            <h3 className='text-lg font-medium text-black mb-2'>
              No Results Found
            </h3>
            <p className='text-slate-500 text-sm max-w-md mx-auto'>
              Try adjusting your search terms or using different keywords.
            </p>
            {searchMetrics && (
              <div className='mt-4 text-xs text-slate-400'>
                Searched {searchMetrics.totalProcessed} profiles in{' '}
                {searchMetrics.processingTimeMs + searchMetrics.fetchTimeMs}ms
              </div>
            )}
          </div>
        ) : (
          <div className='space-y-4 p-4'>
            {/* Search Results Header */}
            {searchMetrics && (
              <div className='text-sm text-slate-500 pb-4 border-b border-slate-100'>
                Found {searchResults.length} of {searchMetrics.totalMatched}{' '}
                matches (
                {searchMetrics.processingTimeMs + searchMetrics.fetchTimeMs}ms)
              </div>
            )}

            {/* Results List */}
            <div className='space-y-2'>
              {searchResults.map(result => {
                // Convert search result to UserPresence format for UserCard
                const userPresence: UserPresence = {
                  userId: result.userId,
                  isOnline: false,
                  status: 'OFFLINE',
                  lastSeen: null,
                  lastHeartbeat: null,
                  activeChatId: null,
                  lastChatActivity: null,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };

                return (
                  <UserCard
                    key={result.userId}
                    userPresence={userPresence}
                    onlineUsers={onlineUsers}
                    existingConversations={existingConversations}
                    pendingRequests={pendingRequests}
                    optimisticPendingRequests={optimisticPendingRequests}
                    incomingRequestSenderIds={incomingRequestSenderIds}
                    onChatAction={handleChatAction}
                    onCancelChatRequest={onCancelChatRequest}
                    onAcceptChatRequest={onAcceptChatRequest}
                    onUserCardClick={onUserCardClick}
                    selectedUserId={selectedUserId}
                    searchProfile={{
                      userId: result.userId,
                      fullName: result.profile.fullName,
                      email: result.profile.email,
                      jobRole: result.profile.jobRole,
                      companyName: result.profile.companyName,
                      industry: result.profile.industry,
                      yearsOfExperience: result.profile.yearsOfExperience,
                      education: result.profile.education,
                      about: result.profile.about,
                      interests: result.profile.interests,
                      skills: result.profile.skills,
                      profilePictureUrl: result.profile.profilePictureUrl,
                      isOnboardingComplete: result.profile.isOnboardingComplete,
                    }}
                    useRealtimeStatus={false} // Don't show real-time status for search results
                    currentUserId={user?.userId || ''}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
