'use client';

import { useState, useEffect } from 'react';
import { UserProfileService } from '@/services/user-profile.service';

export default function AnonymousSummary() {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setIsLoading(true);
        const anonymousSummary = await UserProfileService.getAnonymousSummary();
        setSummary(anonymousSummary);
      } catch (err) {
        setError('Failed to load summary');
        console.error('Error fetching anonymous summary:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (isLoading) {
    return (
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <div className='animate-pulse'>
          <div className='h-4 bg-gray-200 rounded w-1/4 mb-4'></div>
          <div className='space-y-3'>
            <div className='h-3 bg-gray-200 rounded w-full'></div>
            <div className='h-3 bg-gray-200 rounded w-4/5'></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return null; // Don't show anything if there's an error or no summary
  }

  return (
    <div className='bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6'>
      <div className='flex items-start space-x-3'>
        <div className='flex-shrink-0'>
          <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
            <svg
              className='w-5 h-5 text-blue-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
              />
            </svg>
          </div>
        </div>
        <div className='flex-1 min-w-0'>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            Your AI-Generated Professional Summary
          </h3>
          <p className='text-gray-700 leading-relaxed'>{summary}</p>
          <div className='mt-4'>
            <div className='flex items-center text-sm text-blue-600'>
              <svg
                className='w-4 h-4 mr-1'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
              This summary is what other professionals see when browsing
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
