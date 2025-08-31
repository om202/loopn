'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { Search, User } from 'lucide-react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import LoadingContainer from '../LoadingContainer';
import { RAGSearchService } from '../../services';
import type { SearchResult, SearchResponse, SearchMetrics } from '../../types/search.types';
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
  onCancelChatRequest: _onCancelChatRequest,
}: SearchSectionContentProps) {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchMetrics, setSearchMetrics] = useState<SearchMetrics | null>(null);
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
        console.log('Performing RAG search for:', searchTerm);
        
        const response: SearchResponse = await RAGSearchService.searchProfiles(searchTerm, {
          limit: 20,
          minSimilarity: 0.3,
          excludeUserIds: [user.userId] // Exclude current user from results
        });

        setSearchResults(response.results);
        setSearchMetrics(response.metrics);
        
        console.log('Search completed:', {
          query: response.query,
          resultsCount: response.results.length,
          totalFound: response.totalFound,
          metrics: response.metrics
        });
        
      } catch (searchError) {
        console.error('Search failed:', searchError);
        const errorMessage = searchError instanceof Error 
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

  return (
    <div className='h-full flex flex-col'>
      {/* Search Results */}
      <div className='flex-1 overflow-y-auto w-full'>
        {
          !hasSearched ? (
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
                  Searched {searchMetrics.totalProcessed} profiles in {searchMetrics.processingTimeMs + searchMetrics.fetchTimeMs}ms
                </div>
              )}
            </div>
          ) : (
            <div className='space-y-4 p-4'>
              {/* Search Results Header */}
              {searchMetrics && (
                <div className='text-sm text-slate-500 pb-2 border-b border-slate-100'>
                  Found {searchResults.length} of {searchMetrics.totalMatched} matches 
                  ({searchMetrics.processingTimeMs + searchMetrics.fetchTimeMs}ms)
                </div>
              )}
              
              {/* Results List */}
              {searchResults.map((result) => (
                <div key={result.userId} className='bg-white rounded-xl border border-slate-200 p-4 hover:border-brand-200 transition-colors'>
                  <div className='flex items-start gap-4'>
                    {/* Profile Picture */}
                    <div className='w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0'>
                      {result.profile.profilePictureUrl ? (
                        <Image 
                          src={result.profile.profilePictureUrl} 
                          alt={result.profile.fullName || 'User'}
                          width={48}
                          height={48}
                          className='w-12 h-12 rounded-full object-cover'
                        />
                      ) : (
                        <User className='w-6 h-6 text-slate-500' />
                      )}
                    </div>
                    
                    {/* Profile Info */}
                    <div className='flex-1 min-w-0'>
                      <h3 className='font-medium text-black truncate'>
                        {result.profile.fullName || 'Professional'}
                      </h3>
                      <p className='text-sm text-slate-600 truncate'>
                        {result.profile.jobRole} {result.profile.companyName && `at ${result.profile.companyName}`}
                      </p>
                      {result.profile.skills && result.profile.skills.length > 0 && (
                        <div className='flex flex-wrap gap-1 mt-2'>
                          {result.profile.skills.slice(0, 3).map((skill: string, idx: number) => (
                            <span key={idx} className='px-2 py-1 bg-slate-100 text-xs text-slate-700 rounded-md'>
                              {skill}
                            </span>
                          ))}
                          {result.profile.skills.length > 3 && (
                            <span className='px-2 py-1 bg-slate-100 text-xs text-slate-500 rounded-md'>
                              +{result.profile.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Similarity Score */}
                    <div className='text-xs text-slate-400 flex-shrink-0'>
                      {Math.round(result.similarity * 100)}% match
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  );
}
