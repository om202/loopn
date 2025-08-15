'use client';

import { useState, useRef, useEffect } from 'react';
import {
  VectorSearchService,
  type SearchResult,
  type VectorSearchResponse,
} from '../services/vector-search.service';
import CircularIcon from './CircularIcon';
import LoadingContainer from './LoadingContainer';

interface AdvancedRAGSearchProps {
  onUserSelect?: (userId: string) => void;
  currentUserId?: string;
  userProfile?: Record<string, unknown>;
}

interface RAGSearchState {
  isSearching: boolean;
  results: SearchResult[];
  expandedTerms: string[];
  hybridScores: { semantic: number; keyword: number; combined: number }[];
  ragReasoning: string;
  searchInsights: string;
  searchQuality?: string;
  error?: string;
}

export default function AdvancedRAGSearch({
  onUserSelect,
  currentUserId: _currentUserId,
}: AdvancedRAGSearchProps) {
  const [query, setQuery] = useState('');
  const [searchState, setSearchState] = useState<RAGSearchState>({
    isSearching: false,
    results: [],
    expandedTerms: [],
    hybridScores: [],
    ragReasoning: '',
    searchInsights: '',
  });
  const [showDetails, setShowDetails] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Clear search state when query is empty
  useEffect(() => {
    if (!query.trim()) {
      setSearchState({
        isSearching: false,
        results: [],
        expandedTerms: [],
        hybridScores: [],
        ragReasoning: '',
        searchInsights: '',
      });
    }
  }, [query]);

  const performRAGSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 3) return;

    setSearchState(prev => ({ ...prev, isSearching: true, error: undefined }));

    try {
      // DISABLED: User profile context for generic search results
      // const userContext = {
      //   userProfile: userProfile || {},
      //   searchHistory: [], // Could be implemented later
      // };
      const userContext = undefined; // Generic search without personalization

      const response: VectorSearchResponse =
        await VectorSearchService.advancedRAGSearch(
          searchQuery,
          userContext,
          10
        );

      if (response.success) {
        setSearchState({
          isSearching: false,
          results: response.results || [],
          expandedTerms: response.keywordTerms || [],
          hybridScores: response.hybridScores || [],
          ragReasoning: response.ragReasoning || '',
          searchInsights: response.searchInsights || '',
          searchQuality: response.ragReasoning?.includes('excellent')
            ? 'excellent'
            : response.ragReasoning?.includes('good')
              ? 'good'
              : response.ragReasoning?.includes('fair')
                ? 'fair'
                : 'good',
          error: undefined,
        });
      } else {
        setSearchState(prev => ({
          ...prev,
          isSearching: false,
          error: response.error || 'Search failed',
        }));
      }
    } catch (error) {
      console.error('RAG search error:', error);
      setSearchState(prev => ({
        ...prev,
        isSearching: false,
        error: error instanceof Error ? error.message : 'Search failed',
      }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performRAGSearch(newQuery);
    }, 800); // Increased debounce to reduce API calls
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-gray-500';
  };

  const getQualityColor = (quality?: string) => {
    switch (quality) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-blue-600';
      case 'fair':
        return 'text-yellow-600';
      case 'poor':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className='w-full max-w-4xl mx-auto'>
      {/* Search Header */}
      <div className='mb-6'>
        <h2 className='text-xl font-semibold text-gray-900 mb-2'>
          Advanced RAG Search
        </h2>
        <p className='text-sm text-gray-600'>
          AI-powered search with keyword expansion, hybrid matching, and
          intelligent reasoning
        </p>
      </div>

      {/* Search Input */}
      <div className='relative mb-6'>
        <input
          type='text'
          value={query}
          onChange={handleInputChange}
          placeholder="Search for professionals (e.g., 'software engineer', 'marketing expert', 'co-founder')"
          className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
        />
        {searchState.isSearching && (
          <div className='absolute right-3 top-3'>
            <LoadingContainer size='sm' />
          </div>
        )}
      </div>

      {/* Search Quality Indicator */}
      {searchState.results.length > 0 && (
        <div className='mb-4 p-3 bg-gray-50 rounded-lg'>
          <div className='flex items-center justify-between'>
            <div>
              <span className='text-sm font-medium text-gray-700'>
                Search Quality:{' '}
              </span>
              <span
                className={`text-sm font-semibold ${getQualityColor(searchState.searchQuality)}`}
              >
                {searchState.searchQuality?.toUpperCase() || 'GOOD'}
              </span>
            </div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className='text-sm text-blue-600 hover:text-blue-800'
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
        </div>
      )}

      {/* Search Details */}
      {showDetails &&
        (searchState.expandedTerms.length > 0 || searchState.ragReasoning) && (
          <div className='mb-6 space-y-4'>
            {/* Expanded Keywords */}
            {searchState.expandedTerms.length > 0 && (
              <div className='p-4 bg-blue-50 rounded-lg'>
                <h4 className='font-medium text-blue-900 mb-2'>
                  Expanded Search Terms
                </h4>
                <div className='flex flex-wrap gap-2'>
                  {searchState.expandedTerms.map((term, index) => (
                    <span
                      key={index}
                      className='px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded'
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* RAG Reasoning */}
            {searchState.ragReasoning && (
              <div className='p-4 bg-green-50 rounded-lg'>
                <h4 className='font-medium text-green-900 mb-2'>
                  AI Reasoning
                </h4>
                <p className='text-sm text-green-800'>
                  {searchState.ragReasoning}
                </p>
              </div>
            )}

            {/* Search Insights */}
            {searchState.searchInsights && (
              <div className='p-4 bg-gray-50 rounded-lg'>
                <h4 className='font-medium text-gray-900 mb-2'>
                  Search Insights
                </h4>
                <p className='text-sm text-gray-700'>
                  {searchState.searchInsights}
                </p>
              </div>
            )}
          </div>
        )}

      {/* Error State */}
      {searchState.error && (
        <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
          <p className='text-sm text-red-600'>
            <strong>Search Error:</strong> {searchState.error}
          </p>
        </div>
      )}

      {/* Results */}
      {searchState.results.length > 0 && (
        <div className='space-y-4 animate-fade-in'>
          <h3 className='font-medium text-gray-900'>
            Found {searchState.results.length} professionals
          </h3>

          {searchState.results.map((result, index) => (
            <div
              key={result.userId}
              className='p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors'
            >
              <div className='flex items-start justify-between'>
                <div className='flex items-start space-x-3 flex-1'>
                  <CircularIcon
                    icon={
                      <span className='text-sm font-medium text-gray-700'>
                        {(result.profile.jobRole || 'Professional')
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    }
                    size='md'
                    bgColor='bg-blue-100'
                  />

                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center space-x-2 mb-1'>
                      <h4 className='font-medium text-gray-900 truncate'>
                        {result.profile.jobRole || 'Professional'}
                      </h4>
                      <span
                        className={`text-sm font-semibold ${getScoreColor(result.score)}`}
                      >
                        {Math.round(result.score * 100)}%
                      </span>
                    </div>

                    {result.profile.companyName && (
                      <p className='text-sm text-gray-600 mb-1'>
                        {result.profile.companyName}
                      </p>
                    )}

                    {result.profile.industry && (
                      <p className='text-xs text-gray-500 mb-2'>
                        {result.profile.industry} •{' '}
                        {result.profile.yearsOfExperience || 0} years experience
                      </p>
                    )}

                    {/* Hybrid Scores */}
                    {showDetails && searchState.hybridScores[index] && (
                      <div className='flex space-x-4 text-xs text-gray-500 mb-2'>
                        <span>
                          Semantic:{' '}
                          {Math.round(
                            searchState.hybridScores[index].semantic * 100
                          )}
                          %
                        </span>
                        <span>
                          Keyword:{' '}
                          {Math.round(
                            searchState.hybridScores[index].keyword * 100
                          )}
                          %
                        </span>
                        <span>
                          Combined:{' '}
                          {Math.round(
                            searchState.hybridScores[index].combined * 100
                          )}
                          %
                        </span>
                      </div>
                    )}

                    {/* Skills and Interests */}
                    <div className='space-y-1'>
                      {result.profile.skills &&
                        result.profile.skills.length > 0 && (
                          <div className='flex flex-wrap gap-1'>
                            {result.profile.skills
                              .slice(0, 3)
                              .map((skill, skillIndex) => (
                                <span
                                  key={skillIndex}
                                  className='px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded'
                                >
                                  {skill}
                                </span>
                              ))}
                            {result.profile.skills.length > 3 && (
                              <span className='text-xs text-gray-500'>
                                +{result.profile.skills.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                <div className='flex flex-col items-end space-y-2'>
                  <button
                    onClick={() => onUserSelect?.(result.userId)}
                    className='px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors'
                  >
                    Connect
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {!searchState.isSearching &&
        query.length >= 3 &&
        searchState.results.length === 0 &&
        !searchState.error && (
          <div className='text-center py-8 text-gray-500'>
            <p>No professionals found for "{query}"</p>
            <p className='text-sm mt-1'>
              Try broader search terms or different keywords
            </p>
          </div>
        )}
    </div>
  );
}
