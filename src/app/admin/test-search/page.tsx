'use client';

import React, { useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { Search, User, Database, CheckCircle } from 'lucide-react';
import {
  RAGSearchService,
  EmbeddingService,
  EmbeddingManager,
} from '../../../services';
import type { SearchResponse, SearchResult } from '../../../types/search.types';

/**
 * Test page to verify RAG search functionality works end-to-end
 * This page allows testing of the search service with various queries
 */
export default function TestSearchPage() {
  const { user } = useAuthenticator();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(
    null
  );
  const [testQueries] = useState([
    'React developers',
    'Python engineers',
    'UX designers',
    'Software engineers in San Francisco',
    'Machine learning researchers',
    'Full stack developers',
    'Data scientists with Python',
    'Frontend developers with JavaScript',
  ]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults(null);

    try {
      console.log('Testing search for:', searchQuery);

      const response = await RAGSearchService.searchProfiles(searchQuery, {
        limit: 10,
        minSimilarity: 0.2, // Lower threshold for testing
        includeEmbeddingText: true,
      });

      setSearchResults(response);
      console.log('Search test results:', response);
    } catch (error) {
      console.error('Search test failed:', error);
      setSearchResults({
        results: [],
        metrics: {
          totalProcessed: 0,
          totalMatched: 0,
          queryEmbeddingTimeMs: 0,
          processingTimeMs: 0,
          fetchTimeMs: 0,
        },
        query: searchQuery,
        totalFound: 0,
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const testEmbeddingService = async () => {
    console.log('Testing embedding service...');
    const result = await EmbeddingService.testService();
    console.log('Embedding service test result:', result);
    alert(result ? 'Embedding service working!' : 'Embedding service failed!');
  };

  const testSearchService = async () => {
    console.log('Testing search service...');
    const result = await RAGSearchService.testSearch();
    console.log('Search service test result:', result);
    alert(result ? 'Search service working!' : 'Search service failed!');
  };

  const checkServiceHealth = async () => {
    console.log('Checking service health...');
    const health = await EmbeddingManager.healthCheck();
    console.log('Service health:', health);
    alert(
      `Service Health:\n- Available: ${health.serviceAvailable}\n- Total Embeddings: ${health.totalEmbeddings}\n- Errors: ${health.errors.length}`
    );
  };

  if (!user) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            Authentication Required
          </h1>
          <p className='text-gray-600'>
            Please sign in to test the search functionality.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            RAG Search Testing
          </h1>
          <p className='text-gray-600'>
            Test the semantic search functionality with various queries to
            verify the RAG implementation.
          </p>
        </div>

        {/* Service Tests */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
            <CheckCircle className='w-5 h-5' />
            Service Health Tests
          </h2>
          <div className='flex flex-wrap gap-3'>
            <button
              onClick={testEmbeddingService}
              className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
            >
              Test Embedding Service
            </button>
            <button
              onClick={testSearchService}
              className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700'
            >
              Test Search Service
            </button>
            <button
              onClick={checkServiceHealth}
              className='px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700'
            >
              Check Service Health
            </button>
          </div>
        </div>

        {/* Search Interface */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
            <Search className='w-5 h-5' />
            Search Testing
          </h2>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className='mb-6'>
            <div className='flex gap-3'>
              <input
                type='text'
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder='Enter search query...'
                className='flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                disabled={isSearching}
              />
              <button
                type='submit'
                disabled={isSearching || !query.trim()}
                className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2'
              >
                {isSearching ? (
                  <>
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className='w-4 h-4' />
                    Search
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Test Queries */}
          <div className='mb-6'>
            <h3 className='text-sm font-medium text-gray-700 mb-3'>
              Quick Test Queries:
            </h3>
            <div className='flex flex-wrap gap-2'>
              {testQueries.map((testQuery, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(testQuery);
                    performSearch(testQuery);
                  }}
                  disabled={isSearching}
                  className='px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50'
                >
                  {testQuery}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search Results */}
        {searchResults && (
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
              <Database className='w-5 h-5' />
              Search Results
            </h2>

            {/* Search Metrics */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
              <div className='bg-blue-50 rounded-lg p-4'>
                <div className='text-2xl font-bold text-blue-600'>
                  {searchResults.results.length}
                </div>
                <div className='text-sm text-blue-700'>Results Returned</div>
              </div>
              <div className='bg-green-50 rounded-lg p-4'>
                <div className='text-2xl font-bold text-green-600'>
                  {searchResults.totalFound}
                </div>
                <div className='text-sm text-green-700'>Total Matches</div>
              </div>
              <div className='bg-purple-50 rounded-lg p-4'>
                <div className='text-2xl font-bold text-purple-600'>
                  {searchResults.metrics.totalProcessed}
                </div>
                <div className='text-sm text-purple-700'>
                  Profiles Processed
                </div>
              </div>
              <div className='bg-orange-50 rounded-lg p-4'>
                <div className='text-2xl font-bold text-orange-600'>
                  {searchResults.metrics.queryEmbeddingTimeMs +
                    searchResults.metrics.processingTimeMs +
                    searchResults.metrics.fetchTimeMs}
                  ms
                </div>
                <div className='text-sm text-orange-700'>Total Time</div>
              </div>
            </div>

            {/* Detailed Metrics */}
            <div className='bg-gray-50 rounded-lg p-4 mb-6'>
              <h4 className='font-medium text-gray-800 mb-2'>
                Performance Breakdown:
              </h4>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
                <div>
                  <span className='text-gray-600'>Query Embedding:</span>
                  <span className='font-medium ml-2'>
                    {searchResults.metrics.queryEmbeddingTimeMs}ms
                  </span>
                </div>
                <div>
                  <span className='text-gray-600'>Similarity Processing:</span>
                  <span className='font-medium ml-2'>
                    {searchResults.metrics.processingTimeMs}ms
                  </span>
                </div>
                <div>
                  <span className='text-gray-600'>Profile Fetching:</span>
                  <span className='font-medium ml-2'>
                    {searchResults.metrics.fetchTimeMs}ms
                  </span>
                </div>
              </div>
            </div>

            {/* Results List */}
            {searchResults.results.length > 0 ? (
              <div className='space-y-4'>
                {searchResults.results.map(
                  (result: SearchResult, idx: number) => (
                    <div
                      key={result.userId}
                      className='border border-gray-200 rounded-lg p-4'
                    >
                      <div className='flex items-start gap-4'>
                        {/* Profile Picture */}
                        <div className='w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0'>
                          {result.profile.profilePictureUrl ? (
                            <img
                              src={result.profile.profilePictureUrl}
                              alt={result.profile.fullName || 'User'}
                              className='w-12 h-12 rounded-full object-cover'
                            />
                          ) : (
                            <User className='w-6 h-6 text-gray-500' />
                          )}
                        </div>

                        {/* Profile Info */}
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center justify-between mb-2'>
                            <h3 className='font-medium text-gray-900 truncate'>
                              {result.profile.fullName || 'Professional'}
                            </h3>
                            <div className='flex items-center gap-2'>
                              <span className='text-sm text-gray-500'>
                                #{idx + 1}
                              </span>
                              <span className='px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded'>
                                {Math.round(result.similarity * 100)}% match
                              </span>
                            </div>
                          </div>

                          <p className='text-sm text-gray-600 mb-2'>
                            {result.profile.jobRole}{' '}
                            {result.profile.companyName &&
                              `at ${result.profile.companyName}`}
                          </p>

                          {result.profile.skills &&
                            result.profile.skills.length > 0 && (
                              <div className='flex flex-wrap gap-1 mb-3'>
                                {result.profile.skills
                                  .slice(0, 5)
                                  .map((skill: string, skillIdx: number) => (
                                    <span
                                      key={skillIdx}
                                      className='px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded'
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                {result.profile.skills.length > 5 && (
                                  <span className='px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded'>
                                    +{result.profile.skills.length - 5} more
                                  </span>
                                )}
                              </div>
                            )}

                          {/* Show matched text for debugging */}
                          {result.embeddingText && (
                            <details className='mt-2'>
                              <summary className='text-xs text-gray-500 cursor-pointer'>
                                Show matched text
                              </summary>
                              <div className='mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 max-h-20 overflow-y-auto'>
                                {result.embeddingText.substring(0, 500)}...
                              </div>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className='text-center py-8'>
                <Search className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>
                  No Results Found
                </h3>
                <p className='text-gray-600'>
                  Try different search terms or check if embeddings have been
                  generated for users.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
