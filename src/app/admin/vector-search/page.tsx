'use client';

import { useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import {
  indexAllExistingUsers,
  getIndexingStatus,
} from '../../../utils/index-existing-users';
import {
  VectorSearchService,
  VectorSearchResponse,
} from '../../../services/vector-search.service';

interface IndexingResult {
  success: boolean;
  indexedCount: number;
  skippedCount: number;
  errors: string[];
}

interface IndexingStatus {
  totalUsers: number;
  indexedUsers: number;
  notIndexedUsers: number;
}

export default function VectorSearchAdminPage() {
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexingResult, setIndexingResult] = useState<IndexingResult | null>(
    null
  );
  const [status, setStatus] = useState<IndexingStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [testQuery, setTestQuery] = useState('');
  const [testResults, setTestResults] = useState<VectorSearchResponse | null>(
    null
  );
  const [isTestingSearch, setIsTestingSearch] = useState(false);

  const { user } = useAuthenticator();

  // Simple admin check - in production, you'd want proper admin authorization
  const isAdmin =
    user?.signInDetails?.loginId?.includes('admin') ||
    user?.signInDetails?.loginId?.includes('@loopn.') ||
    user?.signInDetails?.loginId?.includes('omprakash');

  const handleIndexUsers = async () => {
    setIsIndexing(true);
    setIndexingResult(null);

    try {
      const result = await indexAllExistingUsers();
      setIndexingResult(result);
    } catch (error) {
      console.error('Error indexing users:', error);
      setIndexingResult({
        success: false,
        indexedCount: 0,
        skippedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    } finally {
      setIsIndexing(false);
    }
  };

  const handleCheckStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const statusResult = await getIndexingStatus();
      setStatus(statusResult);
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleTestSearch = async () => {
    if (!testQuery.trim()) return;

    setIsTestingSearch(true);
    setTestResults(null);

    try {
      const result = await VectorSearchService.searchUsers(testQuery, 5);
      setTestResults(result);
    } catch (error) {
      console.error('Error testing search:', error);
      setTestResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsTestingSearch(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>
            Access Denied
          </h1>
          <p className='text-gray-600'>
            You don't have permission to access this admin panel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='bg-white shadow-sm rounded-lg'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <h1 className='text-2xl font-bold text-gray-900'>
              Vector Search Admin Panel
            </h1>
            <p className='text-sm text-gray-600 mt-1'>
              Manage natural language search indexing and testing
            </p>
          </div>

          <div className='p-6 space-y-8'>
            {/* Status Section */}
            <div>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-lg font-semibold text-gray-900'>
                  Indexing Status
                </h2>
                <button
                  onClick={handleCheckStatus}
                  disabled={isLoadingStatus}
                  className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
                >
                  {isLoadingStatus ? 'Loading...' : 'Check Status'}
                </button>
              </div>

              {status && (
                <div className='bg-gray-50 rounded-lg p-4'>
                  <div className='grid grid-cols-3 gap-4'>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-gray-900'>
                        {status.totalUsers}
                      </div>
                      <div className='text-sm text-gray-600'>Total Users</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-green-600'>
                        {status.indexedUsers}
                      </div>
                      <div className='text-sm text-gray-600'>Indexed</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-orange-600'>
                        {status.notIndexedUsers}
                      </div>
                      <div className='text-sm text-gray-600'>Not Indexed</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Indexing Section */}
            <div>
              <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                Bulk Index Users
              </h2>
              <div className='bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4'>
                <div className='flex'>
                  <div className='ml-3'>
                    <h3 className='text-sm font-medium text-yellow-800'>
                      Warning
                    </h3>
                    <div className='mt-2 text-sm text-yellow-700'>
                      <p>
                        This will generate embeddings for all existing user
                        profiles. This process may take several minutes and will
                        consume AWS Bedrock credits.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleIndexUsers}
                disabled={isIndexing}
                className='px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50'
              >
                {isIndexing ? 'Indexing Users...' : 'Index All Existing Users'}
              </button>

              {indexingResult && (
                <div
                  className={`mt-4 p-4 rounded-lg ${
                    indexingResult.success
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <h3
                    className={`font-medium ${
                      indexingResult.success ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {indexingResult.success
                      ? 'Indexing Completed'
                      : 'Indexing Failed'}
                  </h3>
                  <div className='mt-2 text-sm'>
                    <p>Indexed: {indexingResult.indexedCount} users</p>
                    <p>Skipped: {indexingResult.skippedCount} users</p>
                    {indexingResult.errors.length > 0 && (
                      <div className='mt-2'>
                        <p className='font-medium'>Errors:</p>
                        <ul className='list-disc list-inside'>
                          {indexingResult.errors.map(
                            (error: string, index: number) => (
                              <li key={index} className='text-red-700'>
                                {error}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Test Search Section */}
            <div>
              <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                Test Search
              </h2>
              <div className='flex gap-4 mb-4'>
                <input
                  type='text'
                  value={testQuery}
                  onChange={e => setTestQuery(e.target.value)}
                  placeholder="Enter search query (e.g., 'software engineer', 'co-founder')"
                  className='flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
                <button
                  onClick={handleTestSearch}
                  disabled={isTestingSearch || !testQuery.trim()}
                  className='px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
                >
                  {isTestingSearch ? 'Searching...' : 'Test Search'}
                </button>
              </div>

              {testResults && (
                <div className='bg-gray-50 rounded-lg p-4'>
                  {testResults.success ? (
                    <div>
                      <p className='font-medium mb-2'>
                        Found {testResults.results?.length || 0} results:
                      </p>
                      {testResults.results?.map((result, index: number) => (
                        <div
                          key={index}
                          className='mb-2 p-2 bg-white rounded border'
                        >
                          <div className='flex justify-between items-start'>
                            <div>
                              <p className='font-medium'>
                                {result.profile.jobRole || 'Unknown Role'}
                              </p>
                              <p className='text-sm text-gray-600'>
                                {result.profile.companyName} •{' '}
                                {result.profile.industry}
                              </p>
                              {result.profile.about && (
                                <p className='text-xs text-gray-500 mt-1'>
                                  {result.profile.about}
                                </p>
                              )}
                            </div>
                            <span className='text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded'>
                              {Math.round(result.score * 100)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className='text-red-600'>Error: {testResults.error}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
