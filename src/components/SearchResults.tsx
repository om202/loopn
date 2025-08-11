'use client';

import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { UserProfileService } from '../services/user-profile.service';
import UserAvatar_Shimmer from './ShimmerLoader/UserAvatar_Shimmer';
import {
  VectorSearchService,
  SearchResult,
} from '../services/vector-search.service';
import type { Schema } from '../../amplify/data/resource';

type UserProfile = Schema['UserProfile']['type'];
type UserPresence = Schema['UserPresence']['type'];

interface SearchResultsProps {
  query: string;
  isVisible: boolean;
  onChatRequestSent?: () => void;
  onProfessionalRequest?: (query: string) => void;
}

interface EnhancedSearchResult extends SearchResult {
  userPresence?: UserPresence;
  fullProfile?: UserProfile;
  isLoading?: boolean;
}

export default function SearchResults({
  query,
  isVisible,
  onChatRequestSent,
  onProfessionalRequest: _onProfessionalRequest,
}: SearchResultsProps) {
  const [searchResults, setSearchResults] = useState<EnhancedSearchResult[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthenticator();

  useEffect(() => {
    if (!query.trim() || !isVisible || !user) {
      setSearchResults([]);
      return;
    }

    const performSearch = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await VectorSearchService.searchUsers(query, 8);

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
        setIsLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(performSearch, 500);
    return () => clearTimeout(timeoutId);
  }, [query, isVisible, user]);

  if (!isVisible || !query.trim()) {
    return null;
  }

  return (
    <div className='w-full'>
      <div className='mb-4'>
        <h3 className='text-lg font-semibold text-gray-900 mb-2'>
          Search Results
        </h3>
        <p className='text-sm text-gray-600'>
          Found {searchResults.length} professionals matching "{query}"
        </p>
      </div>

      {isLoading && searchResults.length === 0 && (
        <div className='space-y-4'>
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className='p-4 bg-white rounded-lg border border-gray-200'
            >
              <div className='flex items-start space-x-4'>
                <UserAvatar_Shimmer />
                <div className='flex-1 space-y-2'>
                  <div className='h-4 bg-gray-200 rounded animate-pulse w-3/4'></div>
                  <div className='h-3 bg-gray-200 rounded animate-pulse w-1/2'></div>
                  <div className='h-3 bg-gray-200 rounded animate-pulse w-full'></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className='text-center py-8'>
          <p className='text-red-600 text-sm'>{error}</p>
        </div>
      )}

      {!isLoading && searchResults.length === 0 && !error && (
        <div className='text-center py-8'>
          <p className='text-gray-500 text-sm'>
            No professionals found matching your search.
          </p>
          <p className='text-gray-400 text-xs mt-1'>
            Try using different keywords or phrases.
          </p>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className='space-y-4'>
          {searchResults.map(result => (
            <div key={result.userId} className='relative'>
              <div className='absolute top-2 right-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full'>
                {Math.round(result.score * 100)}% match
              </div>

              {result.isLoading ? (
                <div className='p-4 bg-white rounded-lg border border-gray-200'>
                  <div className='flex items-start space-x-4'>
                    <UserAvatar_Shimmer />
                    <div className='flex-1 space-y-2'>
                      <div className='h-4 bg-gray-200 rounded animate-pulse w-3/4'></div>
                      <div className='h-3 bg-gray-200 rounded animate-pulse w-1/2'></div>
                      <div className='h-3 bg-gray-200 rounded animate-pulse w-full'></div>
                    </div>
                  </div>
                </div>
              ) : result.fullProfile ? (
                <div className='p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors'>
                  <div className='flex items-center space-x-4'>
                    <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
                      {result.fullProfile.hasProfilePicture &&
                      result.fullProfile.profilePictureUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={result.fullProfile.profilePictureUrl}
                          alt={result.fullProfile.fullName || 'User'}
                          className='w-12 h-12 rounded-full object-cover'
                        />
                      ) : (
                        <span className='text-blue-600 text-lg font-semibold'>
                          {(result.fullProfile.fullName ||
                            result.profile.jobRole ||
                            '?')[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className='flex-1'>
                      <h4 className='font-semibold text-gray-900'>
                        {result.fullProfile.fullName || 'Professional'}
                      </h4>
                      <p className='text-sm text-gray-600'>
                        {result.profile.jobRole || 'Professional'}
                        {result.profile.companyName &&
                          ` • ${result.profile.companyName}`}
                      </p>
                      <p className='text-xs text-blue-600'>
                        {result.profile.industry}
                        {result.profile.yearsOfExperience &&
                          ` • ${result.profile.yearsOfExperience} years exp`}
                      </p>
                      {result.profile.about && (
                        <p className='text-xs text-gray-500 mt-1 line-clamp-2'>
                          {result.profile.about}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => onChatRequestSent?.()}
                      className='px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors'
                    >
                      Connect
                    </button>
                  </div>
                </div>
              ) : (
                <div className='p-4 bg-white rounded-lg border border-gray-200'>
                  <div className='flex items-center space-x-4'>
                    <div className='w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center'>
                      <span className='text-gray-500 text-sm'>
                        {result.profile.jobRole?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className='flex-1'>
                      <h4 className='font-medium text-gray-900'>
                        {result.profile.jobRole || 'Professional'}
                      </h4>
                      <p className='text-sm text-gray-600'>
                        {result.profile.companyName && result.profile.industry
                          ? `${result.profile.companyName} • ${result.profile.industry}`
                          : result.profile.companyName ||
                            result.profile.industry ||
                            'Professional'}
                      </p>
                      {result.profile.about && (
                        <p className='text-xs text-gray-500 mt-1 line-clamp-2'>
                          {result.profile.about}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
