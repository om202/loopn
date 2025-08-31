'use client';

import React, { useState, useCallback } from 'react';
import { Search, AlertTriangle } from 'lucide-react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import LoadingContainer from '../LoadingContainer';
import type { Schema } from '../../../amplify/data/resource';

// Placeholder type since Vespa service was removed
interface SearchResult {
  userId: string;
  profile: {
    fullName?: string;
    jobRole?: string;
    companyName?: string;
    skills?: string[];
    profilePictureUrl?: string;
  };
}

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

      // Simulate search but return no results since search is disabled
      setTimeout(() => {
        setSearchResults([]);
        setIsSearching(false);
      }, 1000);
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
              <div className='w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center'>
                <AlertTriangle className='w-8 h-8 text-orange-500' />
              </div>
              <h3 className='text-lg font-medium text-black mb-2'>
                Search Temporarily Unavailable
              </h3>
              <p className='text-slate-500 text-sm max-w-md mx-auto'>
                We're currently updating our search functionality to provide you
                with better results. Please check back soon!
              </p>
            </div>
          ) : null // This case shouldn't happen since searchResults is always empty now
        }
      </div>
    </div>
  );
}
