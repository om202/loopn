'use client';

import { MessageCircle, Sparkles, Users } from 'lucide-react';

import type { Schema } from '../../../amplify/data/resource';

import UserCard from './UserCard';

type UserPresence = Schema['UserPresence']['type'];
type Conversation = Schema['Conversation']['type'];
type SidebarSection = 'all' | 'connections' | 'suggested';

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

  // Determine which users to show based on active section (filter)
  const getUsersToShow = () => {
    switch (activeSection) {
      case 'connections':
        return connectionUsers;
      case 'suggested':
        return suggestedUsers;
      case 'all':
      default:
        return uniqueAllChatUsers;
    }
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
