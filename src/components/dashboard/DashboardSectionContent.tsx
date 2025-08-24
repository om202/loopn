'use client';

import { MessageCircle, Sparkles, Users, Search } from 'lucide-react';

import type { Schema } from '../../../amplify/data/resource';
import { formatPresenceTime } from '../../lib/presence-utils';

import UserCard from './UserCard';
import SearchSectionContent from './SearchSectionContent';
import LoadingContainer from '../LoadingContainer';

type UserPresence = Schema['UserPresence']['type'];
type Conversation = Schema['Conversation']['type'];
type SidebarSection = 'all' | 'connections' | 'suggested' | 'search';

interface DashboardSectionContentProps {
  activeSection: SidebarSection;
  onlineUsers: UserPresence[];
  connectionUsers: UserPresence[];
  activeChatTrialUsers: UserPresence[];
  endedChatTrialUsers: UserPresence[];
  suggestedUsers: UserPresence[];
  suggestedUsersLoading?: boolean;
  existingConversations: Map<string, Conversation>;
  pendingRequests: Set<string>;
  optimisticPendingRequests: Set<string>;
  incomingRequestSenderIds: Set<string>;
  onChatAction: (userId: string) => void;
  onCancelChatRequest: (userId: string) => void;
  onAcceptChatRequest: (userId: string) => void;
  canUserReconnect: (userId: string) => boolean;
  getReconnectTimeRemaining: (userId: string) => string | null;
  onOpenProfileSidebar?: (user: UserPresence) => void;
  onUserCardClick?: (user: UserPresence) => void;
  isProfileSidebarOpen?: boolean;
  selectedUserId?: string;
  searchQuery?: string;
  shouldTriggerSearch?: boolean;
  // For search section optimistic updates
  setOptimisticPendingRequests: (
    fn: (prev: Set<string>) => Set<string>
  ) => void;
}

export default function DashboardSectionContent({
  activeSection,
  onlineUsers,
  connectionUsers,
  activeChatTrialUsers,
  endedChatTrialUsers,
  suggestedUsers,
  suggestedUsersLoading = false,
  existingConversations,
  pendingRequests,
  optimisticPendingRequests,
  incomingRequestSenderIds,
  onChatAction,
  onCancelChatRequest,
  onAcceptChatRequest,
  canUserReconnect,
  getReconnectTimeRemaining,
  onOpenProfileSidebar,
  onUserCardClick,
  isProfileSidebarOpen,
  selectedUserId,
  searchQuery,
  shouldTriggerSearch,
  setOptimisticPendingRequests,
}: DashboardSectionContentProps) {
  // Combine all users for "All Chats" section
  const allChatUsers = [
    ...onlineUsers,
    ...connectionUsers,
    ...activeChatTrialUsers,
    ...endedChatTrialUsers,
  ];

  // Remove duplicates based on userId and filter out reconnectable users
  const uniqueAllChatUsers = allChatUsers.filter((user, index, array) => {
    // Remove duplicates
    const isFirstOccurrence =
      array.findIndex(u => u.userId === user.userId) === index;
    if (!isFirstOccurrence) {
      return false;
    }

    // Filter out users who can be reconnected (they should appear in Discover instead)
    const conversation = existingConversations.get(user.userId);
    const isReconnectable =
      conversation &&
      conversation.chatStatus === 'ENDED' &&
      canUserReconnect(user.userId);

    return !isReconnectable;
  });
  // Helper function to render user cards
  const renderUserCard = (userPresence: UserPresence) => (
    <UserCard
      key={userPresence.userId}
      userPresence={userPresence}
      onlineUsers={onlineUsers}
      existingConversations={existingConversations}
      pendingRequests={pendingRequests}
      optimisticPendingRequests={optimisticPendingRequests}
      incomingRequestSenderIds={incomingRequestSenderIds}
      onChatAction={onChatAction}
      onCancelChatRequest={onCancelChatRequest}
      onAcceptChatRequest={onAcceptChatRequest}
      canUserReconnect={canUserReconnect}
      getReconnectTimeRemaining={getReconnectTimeRemaining}
      onOpenProfileSidebar={onOpenProfileSidebar}
      onUserCardClick={onUserCardClick}
      isProfileSidebarOpen={isProfileSidebarOpen}
      selectedUserId={selectedUserId}
    />
  );

  // Helper function to sort users by priority: online > available to chat > recently active > offline
  const sortUsersByPriority = (users: UserPresence[]) => {
    return [...users].sort((a, b) => {
      // Get user states
      const aIsOnline = onlineUsers.some(ou => ou.userId === a.userId);
      const bIsOnline = onlineUsers.some(ou => ou.userId === b.userId);

      const aConversation = existingConversations.get(a.userId);
      const bConversation = existingConversations.get(b.userId);

      // Check if users are available to chat (have active/connected conversations)
      const aAvailableToChat =
        aConversation &&
        (aConversation.chatStatus === 'ACTIVE' || aConversation.isConnected);
      const bAvailableToChat =
        bConversation &&
        (bConversation.chatStatus === 'ACTIVE' || bConversation.isConnected);

      // Check if users are recently active (offline but within 15 minutes)
      const aRecentlyActive =
        !aIsOnline &&
        a.lastSeen &&
        formatPresenceTime(a.lastSeen) === 'Recently active';
      const bRecentlyActive =
        !bIsOnline &&
        b.lastSeen &&
        formatPresenceTime(b.lastSeen) === 'Recently active';

      // Priority levels (lower number = higher priority):
      // 1. Online users
      // 2. Available to chat (active/connected conversations)
      // 3. Recently active users
      // 4. Offline users

      const getPriority = (
        user: UserPresence,
        isOnline: boolean,
        availableToChat: boolean,
        recentlyActive: boolean
      ) => {
        if (isOnline) return 1;
        if (availableToChat) return 2;
        if (recentlyActive) return 3;
        return 4; // Offline
      };

      const aPriority = getPriority(
        a,
        aIsOnline,
        !!aAvailableToChat,
        !!aRecentlyActive
      );
      const bPriority = getPriority(
        b,
        bIsOnline,
        !!bAvailableToChat,
        !!bRecentlyActive
      );

      // Sort by priority first
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Within same priority, sort by last seen (most recent first)
      if (a.lastSeen && b.lastSeen) {
        return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
      }

      // If one has lastSeen and other doesn't, prioritize the one with lastSeen
      if (a.lastSeen && !b.lastSeen) return -1;
      if (!a.lastSeen && b.lastSeen) return 1;

      return 0;
    });
  };

  // Determine which users to show based on active section (filter)
  const getUsersToShow = () => {
    let users: UserPresence[];
    switch (activeSection) {
      case 'connections':
        users = connectionUsers;
        break;
      case 'suggested':
        users = suggestedUsers;
        break;
      case 'search':
        return []; // Search section uses its own component
      case 'all':
      default:
        users = uniqueAllChatUsers;
        break;
    }

    // Sort users by priority: online > available to chat > recently active > offline
    return sortUsersByPriority(users);
  };

  // Get section title and description
  const getSectionInfo = () => {
    switch (activeSection) {
      case 'connections':
        return {
          title: 'Connections',
          description: 'Your connections',
          emptyIcon: Users,
          emptyMessage: 'No connections yet',
        };
      case 'suggested':
        return {
          title: 'Discover',
          description: 'Find and connect with new people',
          emptyIcon: Sparkles,
          emptyMessage: 'No suggestions available',
        };
      case 'search':
        return {
          title: searchQuery ? 'Search Results' : 'Search',
          description: searchQuery
            ? `"${searchQuery}"`
            : 'Search for professionals',
          emptyIcon: Search,
          emptyMessage: 'Start searching for professionals',
        };
      case 'all':
      default:
        return {
          title: 'Chats',
          description: 'Your conversations',
          emptyIcon: MessageCircle,
          emptyMessage: 'No chats available',
        };
    }
  };

  const usersToShow = getUsersToShow();
  const sectionInfo = getSectionInfo();
  const { emptyIcon: EmptyIcon, emptyMessage } = sectionInfo;

  // Special handling for search section
  if (activeSection === 'search') {
    return (
      <SearchSectionContent
        onChatRequestSent={() => {
          // Callback for when chat request is sent from search
        }}
        searchQuery={searchQuery}
        shouldSearch={shouldTriggerSearch}
        onOpenProfileSidebar={onOpenProfileSidebar}
        onUserCardClick={onUserCardClick}
        isProfileSidebarOpen={isProfileSidebarOpen}
        selectedUserId={selectedUserId}
        // Pass chat-related props
        existingConversations={existingConversations}
        pendingRequests={pendingRequests}
        optimisticPendingRequests={optimisticPendingRequests}
        incomingRequestSenderIds={incomingRequestSenderIds}
        onlineUsers={onlineUsers}
        canUserReconnect={canUserReconnect}
        getReconnectTimeRemaining={getReconnectTimeRemaining}
        onCancelChatRequest={onCancelChatRequest}
        onAcceptChatRequest={onAcceptChatRequest}
        setOptimisticPendingRequests={setOptimisticPendingRequests}
      />
    );
  }

  // Show loading state for suggested users
  if (activeSection === 'suggested' && suggestedUsersLoading) {
    return (
      <div className='flex items-center justify-center h-full w-full'>
        <LoadingContainer />
      </div>
    );
  }

  return (
    <div className='space-y-3 w-full'>
      {usersToShow.length > 0 ? (
        usersToShow.map(renderUserCard)
      ) : (
        <div className='flex flex-col items-center justify-center py-12 text-center'>
          <div className='w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center'>
            <EmptyIcon className='w-8 h-8 text-gray-500' />
          </div>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            {emptyMessage}
          </h3>
          <p className='text-gray-500 max-w-sm'>
            {activeSection === 'connections'
              ? 'Start chatting to build connections with professionals'
              : activeSection === 'suggested'
                ? 'Check back later for new suggestions based on your interests'
                : 'No conversations yet. Connect with professionals to start chatting'}
          </p>
        </div>
      )}
    </div>
  );
}
