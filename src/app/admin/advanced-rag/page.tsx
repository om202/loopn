'use client';

import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import AdvancedRAGSearch from '../../../components/AdvancedRAGSearch';
// Note: UserService import removed as it wasn't needed and caused lint errors
import { VectorSearchService } from '../../../services/vector-search.service';

export default function AdvancedRAGTestPage() {
  const { user } = useAuthenticator();
  const [userProfile, setUserProfile] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [keywordTest, setKeywordTest] = useState({
    query: '',
    isExpanding: false,
    result: null as Record<string, unknown> | null,
  });

  useEffect(() => {
    if (user?.userId) {
      loadUserProfile();
    }
  }, [user?.userId]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      // Mock user profile for demo purposes
      setUserProfile({
        jobRole: 'Product Manager',
        industry: 'Technology',
        yearsOfExperience: 5,
        companyName: 'Tech Startup',
        skills: ['Product Strategy', 'User Research', 'Analytics'],
        interests: ['AI/ML', 'SaaS', 'Mobile Apps'],
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    console.log('Selected user:', userId);
    // Here you could trigger chat request or other actions
  };

  const testKeywordExpansion = async () => {
    if (!keywordTest.query.trim()) return;

    setKeywordTest(prev => ({ ...prev, isExpanding: true }));

    try {
      const result = await VectorSearchService.expandKeywords(
        keywordTest.query,
        { userProfile: userProfile || {} }
      );

      setKeywordTest(prev => ({
        ...prev,
        isExpanding: false,
        result: result,
      }));
    } catch (error) {
      console.error('Keyword expansion error:', error);
      setKeywordTest(prev => ({
        ...prev,
        isExpanding: false,
        result: { success: false, error: 'Failed to expand keywords' },
      }));
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Advanced RAG Search Testing
          </h1>
          <p className='text-gray-600 max-w-3xl'>
            This page demonstrates the advanced RAG (Retrieval-Augmented
            Generation) search system with keyword expansion, hybrid search, and
            LLM reasoning capabilities.
          </p>
        </div>

        {/* User Context */}
        {userProfile && (
          <div className='mb-8 p-4 bg-white rounded-lg border border-gray-200'>
            <h3 className='font-semibold text-gray-900 mb-2'>
              Your Profile Context
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
              <div>
                <span className='font-medium text-gray-700'>Role:</span>{' '}
                <span className='text-gray-600'>
                  {String(userProfile.jobRole) || 'Not specified'}
                </span>
              </div>
              <div>
                <span className='font-medium text-gray-700'>Industry:</span>{' '}
                <span className='text-gray-600'>
                  {String(userProfile.industry) || 'Not specified'}
                </span>
              </div>
              <div>
                <span className='font-medium text-gray-700'>Experience:</span>{' '}
                <span className='text-gray-600'>
                  {Number(userProfile.yearsOfExperience) || 0} years
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Keyword Expansion Test */}
        <div className='mb-8 p-6 bg-white rounded-lg border border-gray-200'>
          <h3 className='font-semibold text-gray-900 mb-4'>
            Keyword Expansion Test
          </h3>
          <div className='flex space-x-4 mb-4'>
            <input
              type='text'
              value={keywordTest.query}
              onChange={e =>
                setKeywordTest(prev => ({ ...prev, query: e.target.value }))
              }
              placeholder='Enter search query to test keyword expansion'
              className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
            <button
              onClick={testKeywordExpansion}
              disabled={keywordTest.isExpanding || !keywordTest.query.trim()}
              className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {keywordTest.isExpanding ? 'Expanding...' : 'Test Expansion'}
            </button>
          </div>

          {keywordTest.result && (
            <div className='mt-4 p-4 bg-gray-50 rounded-lg'>
              {keywordTest.result.success ? (
                <div className='space-y-3'>
                  <div>
                    <h4 className='font-medium text-gray-900 mb-1'>
                      Expanded Terms:
                    </h4>
                    <div className='flex flex-wrap gap-2'>
                      {Array.isArray(keywordTest.result.expandedTerms) &&
                        keywordTest.result.expandedTerms.map(
                          (term: string, index: number) => (
                            <span
                              key={index}
                              className='px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded'
                            >
                              {term}
                            </span>
                          )
                        )}
                    </div>
                  </div>
                  <div>
                    <h4 className='font-medium text-gray-900 mb-1'>
                      Synonyms:
                    </h4>
                    <div className='flex flex-wrap gap-2'>
                      {Array.isArray(keywordTest.result.synonyms) &&
                        keywordTest.result.synonyms.map(
                          (synonym: string, index: number) => (
                            <span
                              key={index}
                              className='px-2 py-1 bg-green-100 text-green-800 text-sm rounded'
                            >
                              {synonym}
                            </span>
                          )
                        )}
                    </div>
                  </div>
                  <div>
                    <h4 className='font-medium text-gray-900 mb-1'>
                      Related Terms:
                    </h4>
                    <div className='flex flex-wrap gap-2'>
                      {Array.isArray(keywordTest.result.relatedTerms) &&
                        keywordTest.result.relatedTerms.map(
                          (term: string, index: number) => (
                            <span
                              key={index}
                              className='px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded'
                            >
                              {term}
                            </span>
                          )
                        )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className='text-red-600'>
                  Error: {String(keywordTest.result.error)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Advanced RAG Search */}
        <div className='bg-white rounded-lg border border-gray-200 p-6'>
          <AdvancedRAGSearch
            onUserSelect={handleUserSelect}
            currentUserId={user?.userId}
            userProfile={userProfile || undefined}
          />
        </div>

        {/* Selected User Display */}
        {selectedUserId && (
          <div className='mt-8 p-4 bg-green-50 border border-green-200 rounded-lg'>
            <h3 className='font-semibold text-green-900 mb-2'>Selected User</h3>
            <p className='text-green-800'>User ID: {selectedUserId}</p>
            <p className='text-sm text-green-700 mt-1'>
              In a real application, this would trigger a chat request or
              connection flow.
            </p>
          </div>
        )}

        {/* Technical Information */}
        <div className='mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200'>
          <h3 className='font-semibold text-blue-900 mb-4'>
            How Advanced RAG Search Works
          </h3>
          <div className='space-y-4 text-sm text-blue-800'>
            <div>
              <strong>1. Keyword Expansion:</strong> Uses Claude LLM to expand
              search terms with synonyms, related roles, and industry-specific
              terminology based on user context.
            </div>
            <div>
              <strong>2. Hybrid Search:</strong> Combines semantic similarity
              (vector embeddings) with keyword matching for comprehensive
              coverage. Weighted 60% semantic, 40% keyword.
            </div>
            <div>
              <strong>3. LLM Reasoning:</strong> Claude analyzes results and
              applies intelligent filtering based on relevance, user profile
              compatibility, and professional value.
            </div>
            <div>
              <strong>4. Quality Scoring:</strong> Each result gets multiple
              scores including semantic similarity, keyword relevance, and AI
              reasoning confidence.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
