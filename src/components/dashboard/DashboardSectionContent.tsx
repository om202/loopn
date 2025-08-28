'use client';

import { MessageSquare, Sparkles, Users, Search, Bookmark } from 'lucide-react';

import type { Schema } from '../../../amplify/data/resource';
import { formatPresenceTime } from '../../lib/presence-utils';

import UserCard from './UserCard';
import SearchSectionContent from './SearchSectionContent';
import LoadingContainer from '../LoadingContainer';

type UserPresence = Schema['UserPresence']['type'];
type Conversation = Schema['Conversation']['type'];
type SidebarSection = 'all' | 'connections' | 'suggested' | 'saved' | 'search';

interface DashboardSectionContentProps {
  activeSection: SidebarSection;
  onlineUsers: UserPresence[];
  connectionUsers: UserPresence[];
  suggestedUsers: UserPresence[];
  savedUsers?: UserPresence[];
  savedUsersLoading?: boolean;
  suggestedUsersLoading?: boolean;
  existingConversations: Map<string, Conversation>;
  pendingRequests: Set<string>;
  optimisticPendingRequests: Set<string>;
  incomingRequestSenderIds: Set<string>;
  currentUserId?: string;
  onChatAction: (userId: string) => void;
  onCancelChatRequest: (userId: string) => void;
  onAcceptChatRequest: (userId: string) => void;
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
  suggestedUsers,
  savedUsers = [],
  savedUsersLoading = false,
  suggestedUsersLoading = false,
  existingConversations,
  pendingRequests,
  optimisticPendingRequests,
  incomingRequestSenderIds,
  currentUserId,
  onChatAction,
  onCancelChatRequest,
  onAcceptChatRequest,
  onOpenProfileSidebar,
  onUserCardClick,
  isProfileSidebarOpen,
  selectedUserId,
  searchQuery,
  shouldTriggerSearch,
  setOptimisticPendingRequests,
}: DashboardSectionContentProps) {
  // Combine all users for "All Chats" section - now just online users and connections
  const allChatUsers = [...onlineUsers, ...connectionUsers];

  // Remove duplicates based on userId
  const uniqueAllChatUsers = allChatUsers.filter((user, index, array) => {
    // Remove duplicates
    const isFirstOccurrence =
      array.findIndex(u => u.userId === user.userId) === index;
    return isFirstOccurrence;
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
      onOpenProfileSidebar={onOpenProfileSidebar}
      onUserCardClick={onUserCardClick}
      isProfileSidebarOpen={isProfileSidebarOpen}
      selectedUserId={selectedUserId}
      currentUserId={currentUserId || ''}
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

      // Check if users are available to chat (all conversations are now permanent)
      const aAvailableToChat = !!aConversation;
      const bAvailableToChat = !!bConversation;

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
      case 'saved':
        users = savedUsers;
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
          title: 'My Connections',
          description: 'Your connections',
          emptyIcon: Users,
          emptyMessage: 'No connections yet',
        };
      case 'suggested':
        return {
          title: 'Discover Professionals',
          description: 'Find and connect with new people',
          emptyIcon: Sparkles,
          emptyMessage: 'No suggestions available',
        };
      case 'saved':
        return {
          title: 'Saved',
          description: 'Items you have saved for quick access',
          emptyIcon: Bookmark,
          emptyMessage: 'No saved items yet',
        };
      case 'search':
        return {
          title: 'Search Professionals',
          description: searchQuery
            ? `"${searchQuery}"`
            : 'Search for professionals',
          emptyIcon: Search,
          emptyMessage: 'Start searching for professionals',
        };
      case 'all':
      default:
        return {
          title: 'My Conversations',
          description: 'Your conversations',
          emptyIcon: MessageSquare,
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

  // Show loading state for saved users
  if (activeSection === 'saved' && savedUsersLoading) {
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
          <div className='w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center'>
            <EmptyIcon className='w-8 h-8 text-slate-500' />
          </div>
          <h3 className='text-lg font-medium text-black mb-1'>
            {emptyMessage}
          </h3>
        </div>
      )}
    </div>
  );
}
