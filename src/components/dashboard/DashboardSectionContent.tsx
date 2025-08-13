'use client';

import { MessageCircle, Sparkles, Users, Search } from 'lucide-react';

import type { Schema } from '../../../amplify/data/resource';

import UserCard from './UserCard';
import SearchSectionContent from './SearchSectionContent';

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
  existingConversations: Map<string, Conversation>;
  pendingRequests: Set<string>;
  onChatAction: (userId: string) => void;
  onCancelChatRequest: (userId: string) => void;
  canUserReconnect: (userId: string) => boolean;
  getReconnectTimeRemaining: (userId: string) => string | null;
  onOpenProfileSidebar?: (user: UserPresence) => void;
  onUserCardClick?: (user: UserPresence) => void;
  isProfileSidebarOpen?: boolean;
  selectedUserId?: string;
  searchQuery?: string;
  shouldTriggerSearch?: boolean;
}

export default function DashboardSectionContent({
  activeSection,
  onlineUsers,
  connectionUsers,
  activeChatTrialUsers,
  endedChatTrialUsers,
  suggestedUsers,
  existingConversations,
  pendingRequests,
  onChatAction,
  onCancelChatRequest,
  canUserReconnect,
  getReconnectTimeRemaining,
  onOpenProfileSidebar,
  onUserCardClick,
  isProfileSidebarOpen,
  selectedUserId,
  searchQuery,
  shouldTriggerSearch,
}: DashboardSectionContentProps) {
  // Combine all users for "All Chats" section
  const allChatUsers = [
    ...onlineUsers,
    ...connectionUsers,
    ...activeChatTrialUsers,
    ...endedChatTrialUsers,
  ];

  // Remove duplicates based on userId
  const uniqueAllChatUsers = allChatUsers.filter(
    (user, index, array) =>
      array.findIndex(u => u.userId === user.userId) === index
  );
  // Helper function to render user cards
  const renderUserCard = (userPresence: UserPresence) => (
    <UserCard
      key={userPresence.userId}
      userPresence={userPresence}
      onlineUsers={onlineUsers}
      existingConversations={existingConversations}
      pendingRequests={pendingRequests}
      onChatAction={onChatAction}
      onCancelChatRequest={onCancelChatRequest}
      canUserReconnect={canUserReconnect}
      getReconnectTimeRemaining={getReconnectTimeRemaining}
      onOpenProfileSidebar={onOpenProfileSidebar}
      onUserCardClick={onUserCardClick}
      isProfileSidebarOpen={isProfileSidebarOpen}
      selectedUserId={selectedUserId}
    />
  );

  // Helper function to sort users with online users first
  const sortUsersByOnlineStatus = (users: UserPresence[]) => {
    return [...users].sort((a, b) => {
      const aIsOnline = onlineUsers.some(ou => ou.userId === a.userId);
      const bIsOnline = onlineUsers.some(ou => ou.userId === b.userId);

      // Online users first
      if (aIsOnline && !bIsOnline) return -1;
      if (!aIsOnline && bIsOnline) return 1;
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

    // Sort users with online users first
    return sortUsersByOnlineStatus(users);
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
          title: 'Suggested',
          description: 'Find and connect with new people',
          emptyIcon: Sparkles,
          emptyMessage: 'No suggestions available',
        };
      case 'search':
        return {
          title: 'Search',
          description: 'Search for professionals',
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
  const {
    title,
    description,
    emptyIcon: EmptyIcon,
    emptyMessage,
  } = sectionInfo;

  // Special handling for search section
  if (activeSection === 'search') {
    return (
      <SearchSectionContent
        onChatRequestSent={() => {
          // Call the onChatAction callback if needed
          // onChatAction could be used here if we need to track search chat requests
        }}
        searchQuery={searchQuery}
        shouldSearch={shouldTriggerSearch}
      />
    );
  }

  return (
    <div>
      <div className='mb-6 sm:mb-8 lg:mb-10'>
        <h2 className='text-xl sm:text-2xl font-bold text-zinc-900 mb-1'>
          {title}
        </h2>
        <p className='text-sm text-zinc-500'>{description}</p>
      </div>
      <div className='space-y-2.5 sm:space-y-3'>
        {usersToShow.length > 0 ? (
          usersToShow.map(renderUserCard)
        ) : (
          <div className='flex flex-col items-center justify-center h-full text-center'>
            <div className='w-16 h-16 mx-auto mb-4 bg-zinc-100 rounded-full flex items-center justify-center'>
              <EmptyIcon className='w-8 h-8 text-zinc-500' />
            </div>
            <h3 className='text-lg font-medium text-zinc-900 mb-2'>
              {emptyMessage}
            </h3>
            <p className='text-zinc-500'>
              {activeSection === 'connections'
                ? 'Start chatting to build connections'
                : activeSection === 'suggested'
                  ? 'Check back later for new suggestions'
                  : 'No conversations yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
