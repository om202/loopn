'use client';

import { useState, useEffect } from 'react';
import {
  OpenSearchService,
  SearchResponse,
  SearchResult,
} from '../../../services/opensearch.service';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';
import { Amplify } from 'aws-amplify';
import amplifyConfig from '../../../../amplify_outputs.json';

interface IndexingResult {
  success: boolean;
  migrated: number;
  failed: number;
  errors: string[];
}

interface IndexingStatus {
  totalUsers: number;
  migratedUsers: number;
  pendingUsers: number;
}

export default function VectorSearchAdminPage() {
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexingResult, setIndexingResult] = useState<IndexingResult | null>(
    null
  );
  const [status, setStatus] = useState<IndexingStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [testQuery, setTestQuery] = useState('');
  const [testResults, setTestResults] = useState<SearchResponse | null>(null);
  const [isTestingSearch, setIsTestingSearch] = useState(false);
  const [client, setClient] = useState<ReturnType<
    typeof generateClient<Schema>
  > | null>(null);

  // Simple admin check - in production, you'd want proper admin authorization
  const isAdmin = true; // TODO: Implement proper admin authorization

  // Initialize Amplify and client
  useEffect(() => {
    try {
      Amplify.configure(amplifyConfig);
      const amplifyClient = generateClient<Schema>();
      setClient(amplifyClient);
    } catch (error) {
      console.error('Failed to configure Amplify:', error);
    }
  }, []);

  const handleIndexUsers = async () => {
    if (!client) {
      console.error('Client not initialized yet');
      return;
    }

    setIsIndexing(true);
    setIndexingResult(null);

    try {
      // First initialize the OpenSearch index
      await OpenSearchService.initializeIndex();

      // Then migrate all users
      let migrated = 0;
      let failed = 0;
      const errors: string[] = [];
      let nextToken: string | undefined;

      do {
        try {
          const response = await client.models.UserProfile.list({
            limit: 50,
            nextToken,
          });

          if (response.data && response.data.length > 0) {
            for (const user of response.data) {
              try {
                if (user.isOnboardingComplete) {
                  const indexResult = await OpenSearchService.indexUser(
                    user.userId,
                    {
                      userId: user.userId,
                      fullName: user.fullName ?? undefined,
                      jobRole: user.jobRole ?? undefined,
                      companyName: user.companyName ?? undefined,
                      industry: user.industry ?? undefined,
                      yearsOfExperience: user.yearsOfExperience ?? undefined,
                      education: user.education ?? undefined,
                      about: user.about ?? undefined,
                      interests:
                        user.interests?.filter(
                          (item): item is string => item !== null
                        ) ?? undefined,
                      skills:
                        user.skills?.filter(
                          (item): item is string => item !== null
                        ) ?? undefined,
                      profilePictureUrl: user.profilePictureUrl ?? undefined,
                      isOnboardingComplete: user.isOnboardingComplete,
                    }
                  );

                  if (indexResult.success) {
                    migrated++;
                  } else {
                    failed++;
                    errors.push(
                      `Failed to index ${user.userId}: ${indexResult.error}`
                    );
                  }
                } else {
                  console.log(
                    `Skipping user ${user.userId} - onboarding not complete`
                  );
                }
              } catch (error) {
                failed++;
                errors.push(
                  `Failed to migrate user ${user.userId}: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
              }
            }
          }
          nextToken = response.nextToken || undefined;
        } catch (error) {
          errors.push(
            `Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
          break;
        }
      } while (nextToken);

      setIndexingResult({
        success: true,
        migrated,
        failed,
        errors,
      });
    } catch (error) {
      console.error('Error migrating users:', error);
      setIndexingResult({
        success: false,
        migrated: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    } finally {
      setIsIndexing(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!client) {
      console.error('Client not initialized yet');
      return;
    }

    setIsLoadingStatus(true);
    setStatusError(null);
    try {
      // Count total users in DynamoDB
      const totalResponse = await client.models.UserProfile.list({
        filter: {
          isOnboardingComplete: {
            eq: true,
          },
        },
      });
      const totalUsers = totalResponse.data?.length || 0;

      // Test search to see how many are in OpenSearch
      const searchResponse = await OpenSearchService.searchUsers('', 1000);

      let migratedUsers = 0;
      if (searchResponse.success) {
        migratedUsers =
          searchResponse.total || searchResponse.results?.length || 0;
      } else {
        setStatusError(`OpenSearch query failed: ${searchResponse.error}`);
        migratedUsers = 0;
      }

      const pendingUsers = Math.max(0, totalUsers - migratedUsers);

      setStatus({
        totalUsers,
        migratedUsers,
        pendingUsers,
      });
    } catch (error) {
      console.error('Error checking status:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setStatusError(`Failed to check status: ${errorMessage}`);
      setStatus({
        totalUsers: 0,
        migratedUsers: 0,
        pendingUsers: 0,
      });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleTestSearch = async () => {
    if (!testQuery.trim()) return;

    setIsTestingSearch(true);
    setTestResults(null);

    try {
      const searchResult = await OpenSearchService.searchUsers(testQuery, 10);
      setTestResults(searchResult);
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

  const handleTestWildcardSearch = async () => {
    setIsTestingSearch(true);
    setTestResults(null);

    try {
      // Use empty string for match_all query instead of '*'
      const searchResult = await OpenSearchService.searchUsers('', 50);
      setTestResults(searchResult);
    } catch (error) {
      console.error('Error testing search for all users:', error);
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
              OpenSearch Admin Panel
            </h1>
            <p className='text-sm text-gray-600 mt-1'>
              Manage intelligent search indexing and testing
            </p>
          </div>

          <div className='p-6 space-y-8'>
            {/* Status Section */}
            <div>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-lg font-semibold text-gray-900'>
                  Migration Status
                </h2>
                <button
                  onClick={handleCheckStatus}
                  disabled={isLoadingStatus || !client}
                  className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
                >
                  {isLoadingStatus
                    ? 'Loading...'
                    : !client
                      ? 'Initializing...'
                      : 'Check Status'}
                </button>
              </div>

              {statusError && (
                <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-4'>
                  <p className='text-red-800 text-sm'>{statusError}</p>
                </div>
              )}

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
                        {status.migratedUsers}
                      </div>
                      <div className='text-sm text-gray-600'>In OpenSearch</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-orange-600'>
                        {status.pendingUsers}
                      </div>
                      <div className='text-sm text-gray-600'>Pending</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Migration Section */}
            <div>
              <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                Migrate Users to OpenSearch
              </h2>
              <div className='bg-blue-50 border border-blue-200 rounded-md p-4 mb-4'>
                <div className='flex'>
                  <div className='ml-3'>
                    <h3 className='text-sm font-medium text-blue-800'>
                      Information
                    </h3>
                    <div className='mt-2 text-sm text-blue-700'>
                      <p>
                        This will migrate all user profiles from DynamoDB to
                        OpenSearch for intelligent search. No additional AWS
                        charges for embeddings - OpenSearch handles all the
                        intelligence internally.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleIndexUsers}
                disabled={isIndexing || !client}
                className='px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50'
              >
                {isIndexing
                  ? 'Migrating Users...'
                  : !client
                    ? 'Initializing...'
                    : 'Migrate All Users to OpenSearch'}
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
                      ? 'Migration Completed'
                      : 'Migration Failed'}
                  </h3>
                  <div className='mt-2 text-sm'>
                    <p>Migrated: {indexingResult.migrated} users</p>
                    <p>Failed: {indexingResult.failed} users</p>
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
                  disabled={isTestingSearch || !testQuery.trim() || !client}
                  className='px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
                >
                  {isTestingSearch
                    ? 'Searching...'
                    : !client
                      ? 'Initializing...'
                      : 'Test Search'}
                </button>
                <button
                  onClick={handleTestWildcardSearch}
                  disabled={isTestingSearch || !client}
                  className='px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50'
                >
                  {isTestingSearch
                    ? 'Searching...'
                    : !client
                      ? 'Initializing...'
                      : 'Show All Indexed'}
                </button>
              </div>

              {testResults && (
                <div className='bg-gray-50 rounded-lg p-4'>
                  {testResults.success ? (
                    <div>
                      <p className='font-medium mb-2'>
                        Found {testResults.results?.length || 0} results (Total:{' '}
                        {testResults.total || 0}):
                      </p>

                      {/* Search Results Display */}
                      <div className='space-y-3'>
                        {testResults.results?.map(
                          (result: SearchResult, index: number) => (
                            <div
                              key={index}
                              className='p-3 bg-white rounded border transition-all duration-200 hover:shadow-sm'
                            >
                              <div className='flex justify-between items-start'>
                                <div className='flex-1'>
                                  <div className='flex items-center gap-2'>
                                    <p className='font-medium'>
                                      {result.profile.fullName ||
                                        'Unknown Name'}
                                    </p>
                                    <span className='px-2 py-1 bg-green-100 text-green-800 text-sm rounded'>
                                      {Math.round(result.score * 100)}% match
                                    </span>
                                  </div>
                                  <p className='text-sm text-gray-600'>
                                    {result.profile.jobRole ||
                                      'No role specified'}
                                  </p>
                                  {result.profile.companyName && (
                                    <p className='text-sm text-gray-500'>
                                      {result.profile.companyName}
                                      {result.profile.industry &&
                                        ` • ${result.profile.industry}`}
                                    </p>
                                  )}
                                  {result.profile.about && (
                                    <p className='text-sm text-gray-500 mt-1 line-clamp-2'>
                                      {result.profile.about}
                                    </p>
                                  )}

                                  {/* Skills Display */}
                                  {result.profile.skills &&
                                    result.profile.skills.length > 0 && (
                                      <div className='mt-2'>
                                        <div className='flex flex-wrap gap-1'>
                                          {result.profile.skills
                                            .slice(0, 5)
                                            .map(
                                              (
                                                skill: string,
                                                skillIndex: number
                                              ) => (
                                                <span
                                                  key={skillIndex}
                                                  className='px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded'
                                                >
                                                  {skill}
                                                </span>
                                              )
                                            )}
                                          {result.profile.skills.length > 5 && (
                                            <span className='text-sm text-gray-500 self-center'>
                                              +
                                              {result.profile.skills.length - 5}{' '}
                                              more
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                </div>
                                <div className='text-right'>
                                  <p className='text-sm text-gray-500'>
                                    Score: {result.score.toFixed(3)}
                                  </p>
                                  {result.profile.yearsOfExperience && (
                                    <p className='text-sm text-gray-500'>
                                      {result.profile.yearsOfExperience} years
                                      exp
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
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
