'use client';

import { Globe, MessageCircle, Timer, Calendar } from 'lucide-react';

import type { Schema } from '../../../amplify/data/resource';

import UserCard from './UserCard';

type UserPresence = Schema['UserPresence']['type'];
type Conversation = Schema['Conversation']['type'];
type SidebarSection = 'online' | 'connections' | 'chat-trial';

interface DashboardSectionContentProps {
  activeSection: SidebarSection;
  onlineUsers: UserPresence[];
  connectionUsers: UserPresence[];
  activeChatTrialUsers: UserPresence[];
  endedChatTrialUsers: UserPresence[];
  existingConversations: Map<string, Conversation>;
  pendingRequests: Set<string>;
  onChatAction: (userId: string) => void;
  onCancelChatRequest: (userId: string) => void;
  canUserReconnect: (userId: string) => boolean;
  getReconnectTimeRemaining: (userId: string) => string | null;
}

export default function DashboardSectionContent({
  activeSection,
  onlineUsers,
  connectionUsers,
  activeChatTrialUsers,
  endedChatTrialUsers,
  existingConversations,
  pendingRequests,
  onChatAction,
  onCancelChatRequest,
  canUserReconnect,
  getReconnectTimeRemaining,
}: DashboardSectionContentProps) {
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
    />
  );

  switch (activeSection) {
    case 'online':
      return (
        <div>
          <div className='mb-6 lg:mb-8'>
            <h2 className='text-lg lg:text-xl font-semibold text-gray-900 mb-1'>
              Online Now
            </h2>
            <p className='text-sm lg:text-base text-gray-600'>
              All users currently online and available to chat
            </p>
          </div>
          <div className='space-y-3'>
            {onlineUsers.length > 0 ? (
              onlineUsers.map(renderUserCard)
            ) : (
              <div className='text-center py-6 lg:py-8 text-gray-500'>
                <Globe className='w-6 lg:w-8 h-6 lg:h-8 mx-auto mb-2 text-gray-400' />
                <p className='text-sm lg:text-base'>
                  No users online right now
                </p>
              </div>
            )}
          </div>
        </div>
      );

    case 'connections':
      return (
        <div>
          <div className='mb-6 lg:mb-8'>
            <h2 className='text-lg lg:text-xl font-semibold text-gray-900 mb-1'>
              Connections
            </h2>
            <p className='text-sm lg:text-base text-gray-600'>
              Your permanent connections for ongoing conversations
            </p>
          </div>
          <div className='space-y-3'>
            {connectionUsers.length > 0 ? (
              connectionUsers.map(renderUserCard)
            ) : (
              <div className='text-center py-6 lg:py-8 text-gray-500'>
                <MessageCircle className='w-6 lg:w-8 h-6 lg:h-8 mx-auto mb-2 text-gray-400' />
                <p className='text-sm lg:text-base'>No connections yet</p>
              </div>
            )}
          </div>
        </div>
      );

    case 'chat-trial':
      return (
        <div>
          <div className='mb-6 lg:mb-10'>
            <h2 className='text-lg lg:text-xl font-semibold text-gray-900 mb-1'>
              Chat Trials
            </h2>
            <p className='text-sm lg:text-base text-gray-600'>
              Manage your active and ended chat trials
            </p>
          </div>

          {/* Active Chat Trials */}
          <div className='mb-6 lg:mb-8'>
            <div className='mb-4 lg:mb-6'>
              <div className='flex items-center gap-2 lg:gap-3 py-2 px-3 lg:px-4 bg-gray-50 rounded-xl'>
                <Timer className='w-4 lg:w-5 h-4 lg:h-5 text-gray-600 flex-shrink-0' />
                <h3 className='text-sm lg:text-base text-gray-900 font-medium'>
                  Active Chat Trials
                </h3>
                <span className='text-xs lg:text-sm bg-white text-gray-700 px-2 lg:px-3 py-1 rounded-full font-medium ml-auto'>
                  {activeChatTrialUsers.length}
                </span>
              </div>
            </div>
            <div className='space-y-3'>
              {activeChatTrialUsers.length > 0 ? (
                activeChatTrialUsers.map(renderUserCard)
              ) : (
                <div className='text-center py-4 lg:py-6 text-gray-500'>
                  <Timer className='w-6 lg:w-8 h-6 lg:h-8 mx-auto mb-2 text-gray-400' />
                  <p className='text-sm lg:text-base'>No active chat trials</p>
                </div>
              )}
            </div>
          </div>

          {/* Ended Chat Trials */}
          <div className='mt-6 lg:mt-8'>
            <div className='mb-4 lg:mb-6'>
              <div className='flex items-center gap-2 lg:gap-3 py-2 px-3 lg:px-4 bg-gray-50 rounded-xl'>
                <Calendar className='w-4 lg:w-5 h-4 lg:h-5 text-gray-600 flex-shrink-0' />
                <h3 className='text-sm lg:text-base text-gray-900 font-medium'>
                  Ended Chat Trials
                </h3>
                <span className='text-xs lg:text-sm bg-white text-gray-700 px-2 lg:px-3 py-1 rounded-full font-medium ml-auto'>
                  {endedChatTrialUsers.length}
                </span>
              </div>
            </div>
            <div className='space-y-3'>
              {endedChatTrialUsers.length > 0 ? (
                endedChatTrialUsers.map(renderUserCard)
              ) : (
                <div className='text-center py-4 lg:py-6 text-gray-500'>
                  <Calendar className='w-6 lg:w-8 h-6 lg:h-8 mx-auto mb-2 text-gray-400' />
                  <p className='text-sm lg:text-base'>No ended chat trials</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}
