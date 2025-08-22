'use client';

import React, { useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { VespaService, SearchResult } from '../../services/vespa.service';
import { useChatActions } from '../../hooks/useChatActions';
import UserCard from './UserCard';
import LoadingContainer from '../LoadingContainer';
import type { Schema } from '../../../amplify/data/resource';

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
  canUserReconnect: (userId: string) => boolean;
  getReconnectTimeRemaining: (userId: string) => string | null;
  onCancelChatRequest: (userId: string) => void;
  onAcceptChatRequest: (userId: string) => void;
  // State setters for optimistic updates
  setOptimisticPendingRequests: (
    fn: (prev: Set<string>) => Set<string>
  ) => void;
}

export default function SearchSectionContent({
  onChatRequestSent,
  searchQuery = '',
  shouldSearch = false,
  onOpenProfileSidebar,
  onUserCardClick,
  isProfileSidebarOpen,
  selectedUserId,
  existingConversations,
  pendingRequests,
  optimisticPendingRequests,
  incomingRequestSenderIds,
  onlineUsers,
  canUserReconnect,
  getReconnectTimeRemaining,
  onCancelChatRequest: _onCancelChatRequest,
  onAcceptChatRequest,
  setOptimisticPendingRequests,
}: SearchSectionContentProps) {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const { user } = useAuthenticator();

  // Initialize chat actions
  const chatActions = useChatActions({
    user: user ? { userId: user.userId } : { userId: '' },
    existingConversations,
    canUserReconnect,
    onChatRequestSent: onChatRequestSent || (() => {}),
  });

  // Handle chat action for search results
  const handleChatAction = async (receiverId: string) => {
    if (!user) return;

    const action = await chatActions.handleChatAction(
      receiverId,
      pendingRequests
    );
    if (action === 'send-request') {
      chatActions.handleSendChatRequest(
        receiverId,
        setOptimisticPendingRequests
      );
    }
  };

  // Handle cancel chat request
  const handleCancelChatRequest = (receiverId: string) => {
    chatActions.handleCancelChatRequest(
      receiverId,
      setOptimisticPendingRequests
    );
  };

  const performSearch = useCallback(
    async (searchTerm: string) => {
      if (!searchTerm.trim() || isSearching || !user) return;

      setIsSearching(true);
      setError(null);
      setHasSearched(true);
      setSearchResults([]); // Clear previous results immediately

      try {
        // Use semantic search for better AI-powered understanding
        const response = await VespaService.searchUsers(
          searchTerm.trim(),
          10,
          undefined, // no filters
          'semantic' // Use semantic ranking for best AI-powered results
        );

        if (!response.success) {
          setError(response.error || 'Search failed');
          setSearchResults([]);
          return;
        }

        // Filter out current user - OpenSearch already provides complete profile data
        const searchResults = response.results || [];
        const filteredResults = searchResults.filter(
          (result: SearchResult) => result.userId !== user.userId
        );

        // Set results directly - no need for additional profile fetching
        setSearchResults(filteredResults);
      } catch (error) {
        console.error('Search error:', error);
        setError('An error occurred while searching');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
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
      <div className='flex-1 overflow-y-auto mx-auto max-w-[950px] w-full'>
        {!hasSearched ? (
          <div className='flex flex-col items-center justify-center h-full text-center p-8 transition-opacity duration-200 opacity-100'>
            <div className='w-16 h-16 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center'>
              <Search className='w-8 h-8 text-neutral-500' />
            </div>
            <h3 className='text-lg font-medium text-black mb-2'>
              Search Professionals
            </h3>
          </div>
        ) : isSearching ? (
          <div className='transition-opacity duration-200 opacity-100'>
            <LoadingContainer size='lg' />
          </div>
        ) : error ? (
          <div className='flex flex-col items-center justify-center h-full text-center p-8 transition-opacity duration-200 opacity-100'>
            <div className='text-red-600 text-sm mb-2'>Search Error</div>
            <p className='text-neutral-500 text-sm'>{error}</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-full text-center p-8 transition-opacity duration-200 opacity-100'>
            <div className='w-16 h-16 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center'>
              <Search className='w-8 h-8 text-neutral-500' />
            </div>
            <h3 className='text-lg font-medium text-black mb-2'>
              Hmm… nothing matched.
            </h3>
            <p className='text-neutral-500 text-sm max-w-sm'>
              Try different words.
            </p>
          </div>
        ) : (
          <div className='space-y-2.5 sm:space-y-3 transition-opacity duration-200 opacity-100'>
            {searchResults.map(result => (
              <div key={result.userId}>
                <UserCard
                  userPresence={{
                    userId: result.userId,
                    isOnline: false, // Not relevant for search results
                    status: 'OFFLINE', // Static status for search
                    lastSeen: null,
                    lastHeartbeat: null,
                    activeChatId: null,
                    lastChatActivity: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  }}
                  onlineUsers={onlineUsers} // Pass real online users data
                  existingConversations={existingConversations} // Pass real conversations
                  pendingRequests={pendingRequests} // Pass real pending requests
                  optimisticPendingRequests={optimisticPendingRequests} // Pass optimistic pending requests
                  incomingRequestSenderIds={incomingRequestSenderIds} // Pass incoming request data
                  onChatAction={handleChatAction} // Use proper chat action handler
                  onCancelChatRequest={handleCancelChatRequest} // Use proper cancel handler
                  onAcceptChatRequest={onAcceptChatRequest} // Use proper accept handler
                  canUserReconnect={canUserReconnect} // Use real reconnect logic
                  getReconnectTimeRemaining={getReconnectTimeRemaining} // Use real timer logic
                  onOpenProfileSidebar={onOpenProfileSidebar}
                  onUserCardClick={onUserCardClick}
                  isProfileSidebarOpen={isProfileSidebarOpen}
                  selectedUserId={selectedUserId}
                  searchProfile={result.profile} // OpenSearch profile data
                  useRealtimeStatus={false} // Disable real-time status for search results
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
