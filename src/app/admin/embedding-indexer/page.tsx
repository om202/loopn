'use client';

import React, { useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import {
  Play,
  Pause,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Users,
  Database,
  Search,
} from 'lucide-react';
import { EmbeddingManager, UserProfileService, RAGSearchService } from '../../../services';
import type {
  BatchEmbeddingResult,
  EmbeddingJob,
  EmbeddingHealthCheck,
} from '../../../types/search.types';

/**
 * Admin utility to index existing users and generate embeddings
 * This page helps backfill embeddings for users who existed before RAG search was implemented
 */
export default function EmbeddingIndexerPage() {
  const { user } = useAuthenticator();
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexingProgress, setIndexingProgress] = useState<{
    processed: number;
    total: number;
    current?: string;
    errors: string[];
  }>({ processed: 0, total: 0, errors: [] });
  const [indexingResults, setIndexingResults] =
    useState<BatchEmbeddingResult | null>(null);
  const [healthCheck, setHealthCheck] = useState<EmbeddingHealthCheck | null>(
    null
  );
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);
  const [hybridInitStatus, setHybridInitStatus] = useState<{
    isInitializing: boolean;
    success?: boolean;
    vectorCount?: number;
    bm25Count?: number;
    error?: string;
  }>({ isInitializing: false });

  // Check service health
  const performHealthCheck = async () => {
    setIsLoadingHealth(true);
    try {
      const health = await EmbeddingManager.healthCheck();
      setHealthCheck(health);
      console.log('Embedding service health check:', health);
    } catch (error) {
      console.error('Health check failed:', error);
      setHealthCheck({
        serviceAvailable: false,
        totalEmbeddings: 0,
        lastUpdated: null,
        avgSimilarityRange: null,
        sampleQuery: null,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    } finally {
      setIsLoadingHealth(false);
    }
  };

  // Index all existing users
  const indexAllUsers = async () => {
    if (isIndexing) return;

    setIsIndexing(true);
    setIndexingResults(null);
    setIndexingProgress({ processed: 0, total: 0, errors: [] });

    try {
      console.log('Starting user indexing process...');

      // Get all user profiles
      const profiles = await UserProfileService.getAllUserProfiles();

      if (!profiles || profiles.length === 0) {
        console.log('No user profiles found to index');
        setIndexingProgress(prev => ({ ...prev, total: 0 }));
        setIsIndexing(false);
        return;
      }

      console.log(`Found ${profiles.length} user profiles to process`);
      setIndexingProgress(prev => ({ ...prev, total: profiles.length }));

      // Create embedding jobs
      const jobs: EmbeddingJob[] = profiles.map(profile => ({
        userId: profile.userId,
        profileData: profile,
        priority: 'normal' as const,
        createdAt: new Date().toISOString(),
        status: 'pending' as const,
      }));

      // Process in smaller batches to avoid overwhelming the service
      const batchSize = 5;
      const batches: EmbeddingJob[][] = [];

      for (let i = 0; i < jobs.length; i += batchSize) {
        batches.push(jobs.slice(i, i + batchSize));
      }

      let totalSuccessful: string[] = [];
      let totalFailed: Array<{ userId: string; error: string }> = [];

      // Process each batch
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];

        console.log(
          `Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} users)`
        );

        // Update progress with current user
        setIndexingProgress(prev => ({
          ...prev,
          current: batch[0]?.profileData?.fullName || `Batch ${batchIndex + 1}`,
          processed: batchIndex * batchSize,
        }));

        try {
          const batchResult =
            await EmbeddingManager.batchProcessEmbeddings(batch);

          totalSuccessful = [...totalSuccessful, ...batchResult.successful];
          totalFailed = [...totalFailed, ...batchResult.failed];

          // Update progress
          setIndexingProgress(prev => ({
            ...prev,
            processed: (batchIndex + 1) * batchSize,
            errors: [
              ...prev.errors,
              ...batchResult.failed.map(f => `${f.userId}: ${f.error}`),
            ],
          }));

          console.log(`Batch ${batchIndex + 1} completed:`, {
            successful: batchResult.successful.length,
            failed: batchResult.failed.length,
          });
        } catch (batchError) {
          console.error(`Batch ${batchIndex + 1} failed:`, batchError);

          // Mark all users in this batch as failed
          const batchFailures = batch.map(job => ({
            userId: job.userId,
            error:
              batchError instanceof Error
                ? batchError.message
                : 'Batch processing failed',
          }));

          totalFailed = [...totalFailed, ...batchFailures];

          setIndexingProgress(prev => ({
            ...prev,
            processed: (batchIndex + 1) * batchSize,
            errors: [
              ...prev.errors,
              `Batch ${batchIndex + 1} failed: ${batchError}`,
            ],
          }));
        }

        // Small delay between batches to avoid rate limiting
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Final results
      const finalResult: BatchEmbeddingResult = {
        successful: totalSuccessful,
        failed: totalFailed,
        metrics: {
          totalProcessed: jobs.length,
          successCount: totalSuccessful.length,
          failCount: totalFailed.length,
          avgProcessingTime: 0, // We don't track individual timing in batch mode
          totalTimeMs: Date.now(), // Would need start time for accurate calculation
        },
      };

      setIndexingResults(finalResult);
      setIndexingProgress(prev => ({
        ...prev,
        processed: jobs.length,
        current: undefined,
      }));

      console.log('Indexing completed:', finalResult);

      // After successful indexing, initialize BM25 index
      if (totalSuccessful.length > 0) {
        console.log('Initializing BM25 index after successful embedding generation...');
        try {
          const hybridInit = await RAGSearchService.initializeHybridSearch();
          setHybridInitStatus({
            isInitializing: false,
            success: hybridInit.success,
            vectorCount: hybridInit.vectorCount,
            bm25Count: hybridInit.bm25Count,
            error: hybridInit.error
          });
        } catch (hybridError) {
          console.error('BM25 initialization failed:', hybridError);
          setHybridInitStatus({
            isInitializing: false,
            success: false,
            error: hybridError instanceof Error ? hybridError.message : 'BM25 initialization failed'
          });
        }
      }
    } catch (error) {
      console.error('Indexing process failed:', error);
      setIndexingProgress(prev => ({
        ...prev,
        errors: [
          ...prev.errors,
          error instanceof Error ? error.message : 'Unknown indexing error',
        ],
      }));
    } finally {
      setIsIndexing(false);
    }
  };

  // Initialize BM25 index manually
  const initializeBM25Index = async () => {
    setHybridInitStatus({ isInitializing: true });
    
    try {
      console.log('Manually initializing BM25 hybrid search...');
      const result = await RAGSearchService.initializeHybridSearch();
      
      setHybridInitStatus({
        isInitializing: false,
        success: result.success,
        vectorCount: result.vectorCount,
        bm25Count: result.bm25Count,
        error: result.error
      });
      
      console.log('BM25 initialization result:', result);
    } catch (error) {
      console.error('Manual BM25 initialization failed:', error);
      setHybridInitStatus({
        isInitializing: false,
        success: false,
        error: error instanceof Error ? error.message : 'BM25 initialization failed'
      });
    }
  };

  // Load health check on mount
  React.useEffect(() => {
    performHealthCheck();
  }, []);

  if (!user) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            Authentication Required
          </h1>
          <p className='text-gray-600'>
            Please sign in to access the embedding indexer.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Embedding Indexer
          </h1>
          <p className='text-gray-600'>
            Admin utility to generate embeddings for existing user profiles and
            enable RAG search functionality.
          </p>
        </div>

        {/* Health Check Section */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-xl font-semibold text-gray-900 flex items-center gap-2'>
              <Database className='w-5 h-5' />
              Service Health Check
            </h2>
            <button
              onClick={performHealthCheck}
              disabled={isLoadingHealth}
              className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2'
            >
              {isLoadingHealth ? (
                <RefreshCw className='w-4 h-4 animate-spin' />
              ) : (
                <RefreshCw className='w-4 h-4' />
              )}
              Refresh
            </button>
          </div>

          {healthCheck && (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='bg-gray-50 rounded-lg p-4'>
                <div className='flex items-center gap-2 mb-2'>
                  {healthCheck.serviceAvailable ? (
                    <CheckCircle className='w-5 h-5 text-green-500' />
                  ) : (
                    <AlertCircle className='w-5 h-5 text-red-500' />
                  )}
                  <span className='font-medium'>Service Status</span>
                </div>
                <p className='text-sm text-gray-600'>
                  {healthCheck.serviceAvailable ? 'Available' : 'Unavailable'}
                </p>
              </div>

              <div className='bg-gray-50 rounded-lg p-4'>
                <div className='flex items-center gap-2 mb-2'>
                  <Users className='w-5 h-5 text-blue-500' />
                  <span className='font-medium'>Total Embeddings</span>
                </div>
                <p className='text-2xl font-bold text-gray-900'>
                  {healthCheck.totalEmbeddings}
                </p>
              </div>

              <div className='bg-gray-50 rounded-lg p-4'>
                <div className='flex items-center gap-2 mb-2'>
                  <RefreshCw className='w-5 h-5 text-purple-500' />
                  <span className='font-medium'>Last Updated</span>
                </div>
                <p className='text-sm text-gray-600'>
                  {healthCheck.lastUpdated
                    ? new Date(healthCheck.lastUpdated).toLocaleString()
                    : 'Never'}
                </p>
              </div>
            </div>
          )}

          {healthCheck?.errors && healthCheck.errors.length > 0 && (
            <div className='mt-4 p-4 bg-red-50 border border-red-200 rounded-lg'>
              <h4 className='font-medium text-red-800 mb-2'>Errors:</h4>
              <ul className='text-sm text-red-700 space-y-1'>
                {healthCheck.errors.map((error, idx) => (
                  <li key={idx}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Indexing Control Section */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-xl font-semibold text-gray-900 flex items-center gap-2'>
              <Users className='w-5 h-5' />
              User Indexing
            </h2>
            <button
              onClick={indexAllUsers}
              disabled={isIndexing || !healthCheck?.serviceAvailable}
              className='px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 font-medium'
            >
              {isIndexing ? (
                <>
                  <Pause className='w-5 h-5' />
                  Indexing...
                </>
              ) : (
                <>
                  <Play className='w-5 h-5' />
                  Start Indexing
                </>
              )}
            </button>
          </div>

          <p className='text-gray-600 mb-4'>
            This will process all existing user profiles and generate embeddings
            for RAG search functionality. The process may take several minutes
            depending on the number of users.
          </p>

          {/* Progress Bar */}
          {(isIndexing || indexingProgress.total > 0) && (
            <div className='mb-4'>
              <div className='flex justify-between text-sm text-gray-600 mb-2'>
                <span>
                  Progress: {indexingProgress.processed} /{' '}
                  {indexingProgress.total}
                  {indexingProgress.current && ` (${indexingProgress.current})`}
                </span>
                <span>
                  {indexingProgress.total > 0
                    ? Math.round(
                        (indexingProgress.processed / indexingProgress.total) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className='w-full bg-gray-200 rounded-full h-2'>
                <div
                  className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                  style={{
                    width:
                      indexingProgress.total > 0
                        ? `${(indexingProgress.processed / indexingProgress.total) * 100}%`
                        : '0%',
                  }}
                />
              </div>
            </div>
          )}

          {/* Indexing Errors */}
          {indexingProgress.errors.length > 0 && (
            <div className='mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
              <h4 className='font-medium text-yellow-800 mb-2'>
                Processing Errors:
              </h4>
              <div className='max-h-32 overflow-y-auto'>
                <ul className='text-sm text-yellow-700 space-y-1'>
                  {indexingProgress.errors.slice(0, 10).map((error, idx) => (
                    <li key={idx}>• {error}</li>
                  ))}
                  {indexingProgress.errors.length > 10 && (
                    <li className='text-yellow-600'>
                      ... and {indexingProgress.errors.length - 10} more
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* BM25 Hybrid Search Initialization */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-xl font-semibold text-gray-900 flex items-center gap-2'>
              <Search className='w-5 h-5' />
              Hybrid Search (BM25) Setup
            </h2>
            <button
              onClick={initializeBM25Index}
              disabled={hybridInitStatus.isInitializing}
              className='px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2'
            >
              {hybridInitStatus.isInitializing ? (
                <RefreshCw className='w-4 h-4 animate-spin' />
              ) : (
                <Database className='w-4 h-4' />
              )}
              Initialize BM25 Index
            </button>
          </div>

          <p className='text-gray-600 mb-4'>
            Initialize the BM25 keyword search index to enable hybrid search functionality. 
            This combines vector embeddings with keyword matching for better exact term searches.
          </p>

          {hybridInitStatus.success !== undefined && (
            <div className={`p-4 rounded-lg border ${
              hybridInitStatus.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className={`flex items-center gap-2 mb-2 ${
                hybridInitStatus.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {hybridInitStatus.success ? (
                  <CheckCircle className='w-5 h-5' />
                ) : (
                  <AlertCircle className='w-5 h-5' />
                )}
                <span className='font-medium'>
                  {hybridInitStatus.success ? 'BM25 Index Initialized' : 'Initialization Failed'}
                </span>
              </div>
              
              {hybridInitStatus.success ? (
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div>
                    <span className='font-medium'>Vector Embeddings:</span> {hybridInitStatus.vectorCount}
                  </div>
                  <div>
                    <span className='font-medium'>BM25 Documents:</span> {hybridInitStatus.bm25Count}
                  </div>
                </div>
              ) : (
                <p className={`text-sm ${hybridInitStatus.success ? 'text-green-700' : 'text-red-700'}`}>
                  {hybridInitStatus.error || 'Unknown error occurred'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Results Section */}
        {indexingResults && (
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
              <CheckCircle className='w-5 h-5 text-green-500' />
              Indexing Results
            </h2>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
              <div className='bg-green-50 rounded-lg p-4'>
                <div className='text-2xl font-bold text-green-600'>
                  {indexingResults.successful.length}
                </div>
                <div className='text-sm text-green-700'>Successful</div>
              </div>
              <div className='bg-red-50 rounded-lg p-4'>
                <div className='text-2xl font-bold text-red-600'>
                  {indexingResults.failed.length}
                </div>
                <div className='text-sm text-red-700'>Failed</div>
              </div>
              <div className='bg-blue-50 rounded-lg p-4'>
                <div className='text-2xl font-bold text-blue-600'>
                  {indexingResults.metrics.totalProcessed}
                </div>
                <div className='text-sm text-blue-700'>Total Processed</div>
              </div>
            </div>

            {indexingResults.failed.length > 0 && (
              <div className='p-4 bg-red-50 border border-red-200 rounded-lg'>
                <h4 className='font-medium text-red-800 mb-2'>Failed Users:</h4>
                <div className='max-h-32 overflow-y-auto'>
                  <ul className='text-sm text-red-700 space-y-1'>
                    {indexingResults.failed.slice(0, 10).map((failure, idx) => (
                      <li key={idx}>
                        • {failure.userId}: {failure.error}
                      </li>
                    ))}
                    {indexingResults.failed.length > 10 && (
                      <li className='text-red-600'>
                        ... and {indexingResults.failed.length - 10} more
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
