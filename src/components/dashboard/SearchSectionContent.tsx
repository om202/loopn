'use client';

import React, { useState, useCallback, useEffect } from 'react';
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

interface EnhancedSearchResult extends SearchResult {
  fullProfile?: UserProfile;
  isLoading?: boolean;
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
  const [searchResults, setSearchResults] = useState<EnhancedSearchResult[]>(
    []
  );
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] =
    useState<UserProfile | null>(null);

  const { user } = useAuthenticator();

  // Load current user profile for search context
  useEffect(() => {
    let mounted = true;
    const loadCurrentUserProfile = async () => {
      if (!user?.userId) return;
      try {
        const profile = await UserProfileService.getProfileDetails(user.userId);
        if (mounted) setCurrentUserProfile(profile);
      } catch (error) {
        console.error('Error loading current user profile for search:', error);
      }
    };
    loadCurrentUserProfile();
    return () => {
      mounted = false;
    };
  }, [user?.userId]);

  const performSearch = useCallback(
    async (searchTerm: string) => {
      if (!searchTerm.trim() || isSearching || !user) return;

      setIsSearching(true);
      setError(null);
      setHasSearched(true);
      setSearchResults([]); // Clear previous results immediately

      try {
        // Use advanced RAG search if user profile is available, otherwise fall back to intelligent search
        const userContext = currentUserProfile
          ? {
              userProfile: {
                jobRole: currentUserProfile.jobRole,
                industry: currentUserProfile.industry,
                yearsOfExperience: currentUserProfile.yearsOfExperience,
                companyName: currentUserProfile.companyName,
                skills: currentUserProfile.skills,
                interests: currentUserProfile.interests,
              },
            }
          : undefined;

        const response = await VectorSearchService.advancedRAGSearch(
          searchTerm.trim(),
          userContext,
          10
        );

        console.info('Advanced RAG Search:', {
          query: searchTerm,
          enhancedQuery: response.enhancedQuery,
          resultsCount: response.results?.length || 0,
        });

        if (!response.success) {
          setError(response.error || 'Search failed');
          setSearchResults([]);
          return;
        }

        // Filter out current user and enhance results with full profile data
        const searchResults = response.results || [];
        const filteredResults = searchResults.filter(
          result => result.userId !== user.userId
        );

        const enhancedResults: EnhancedSearchResult[] = filteredResults.map(
          result => ({
            ...result,
            isLoading: true,
          })
        );

        // Show results immediately with loading state
        setSearchResults(enhancedResults);

        // Load full profile data for each result in parallel with progressive updates
        try {
          const profilePromises = enhancedResults.map((result, index) =>
            UserProfileService.getProfileDetails(result.userId)
              .then(profile => {
                // Update this specific result as soon as its profile loads
                setSearchResults(prev =>
                  prev.map((item, i) =>
                    i === index
                      ? {
                          ...item,
                          fullProfile: profile || undefined,
                          isLoading: false,
                        }
                      : item
                  )
                );
                return profile;
              })
              .catch(error => {
                console.error(
                  `Error loading profile for user ${result.userId}:`,
                  error
                );
                // Mark this specific result as not loading on error
                setSearchResults(prev =>
                  prev.map((item, i) =>
                    i === index ? { ...item, isLoading: false } : item
                  )
                );
                return null;
              })
          );

          // Wait for all profiles to complete
          await Promise.all(profilePromises);
        } catch (error) {
          console.error('Error loading profiles in parallel:', error);
          // Fallback: mark all as not loading
          setSearchResults(prev =>
            prev.map(item => ({ ...item, isLoading: false }))
          );
        }
      } catch (error) {
        console.error('Search error:', error);
        setError('An error occurred while searching');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [isSearching, user, currentUserProfile]
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
          <div className='p-4'>
            <div className='flex items-center gap-3 text-sm text-zinc-600'>
              <div className='w-4 h-4 border-2 border-zinc-300 border-t-blue-600 rounded-full animate-spin'></div>
              <span>Searching for professionals matching "{query}"...</span>
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
          <div className='p-4 space-y-4'>
            <div className='text-sm text-zinc-600 mb-4'>
              Found {searchResults.length} professionals matching "{query}"
            </div>

            {searchResults.map(result => {
              if (result.isLoading) {
                return (
                  <div
                    key={result.userId}
                    className='border border-zinc-200 rounded-lg p-4'
                  >
                    <div className='animate-pulse'>
                      <div className='flex items-center space-x-3'>
                        <div className='w-12 h-12 bg-zinc-200 rounded-full'></div>
                        <div className='flex-1 space-y-2'>
                          <div className='h-4 bg-zinc-200 rounded w-3/4'></div>
                          <div className='h-3 bg-zinc-200 rounded w-1/2'></div>
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
                    onOpenProfileSidebar={onOpenProfileSidebar}
                    onUserCardClick={onUserCardClick}
                    isProfileSidebarOpen={isProfileSidebarOpen}
                    selectedUserId={selectedUserId}
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

/*
 * HOW TO SWITCH BACK TO INTELLIGENT SEARCH:
 *
 * This component currently uses normal vector search (VectorSearchService.searchUsers).
 * To switch back to AI-enhanced intelligent search, follow these steps:
 *
 * 1. RESTORE USER PROFILE STATE:
 *    Add back the currentUserProfile state and its loading effect:
 *
 *    const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
 *
 *    useEffect(() => {
 *      let mounted = true;
 *      const loadCurrentUserProfile = async () => {
 *        if (!user?.userId) return;
 *        try {
 *          const profile = await UserProfileService.getProfileDetails(user.userId);
 *          if (mounted) setCurrentUserProfile(profile);
 *        } catch (error) {
 *          console.error('Error loading current user profile for search:', error);
 *        }
 *      };
 *      loadCurrentUserProfile();
 *      return () => { mounted = false; };
 *    }, [user?.userId]);
 *
 * 2. REPLACE SEARCH METHOD:
 *    In the performSearch function, replace this:
 *
 *    const response = await VectorSearchService.searchUsers(searchTerm.trim(), 10);
 *
 *    With this:
 *
 *    const userContext = currentUserProfile ? {
 *      userProfile: {
 *        jobRole: currentUserProfile.jobRole,
 *        industry: currentUserProfile.industry,
 *        yearsOfExperience: currentUserProfile.yearsOfExperience,
 *        companyName: currentUserProfile.companyName,
 *        skills: currentUserProfile.skills,
 *        interests: currentUserProfile.interests,
 *      },
 *    } : undefined;
 *
 *    const response = await VectorSearchService.intelligentSearch(
 *      searchTerm.trim(),
 *      userContext,
 *      10
 *    );
 *
 * 3. UPDATE RESULT HANDLING:
 *    Replace this line:
 *    const searchResults = response.results || [];
 *
 *    With this:
 *    const searchResults = response.enhancedResults || response.results || [];
 *
 * 4. UPDATE LOGGING:
 *    Replace the console.info call with:
 *    console.info('AI Enhanced Search:', {
 *      query: searchTerm,
 *      enhancedQuery: response.enhancedQuery,
 *      resultsCount: response.results?.length || 0,
 *    });
 *
 * 5. UPDATE DEPENDENCIES:
 *    Update the useCallback dependency array to include currentUserProfile:
 *    [isSearching, user, currentUserProfile]
 *
 * 6. ADD IMPORTS:
 *    Make sure useEffect is imported:
 *    import React, { useState, useCallback, useEffect } from 'react';
 *
 * BENEFITS OF INTELLIGENT SEARCH:
 * - AI-enhanced query understanding and expansion
 * - Personalized results based on user's profile
 * - Better result ranking and relevance
 * - Enhanced search insights and explanations
 * - Context-aware matching
 *
 * The intelligent search provides more sophisticated results but requires more processing
 * time and resources compared to the current normal vector search implementation.
 */
