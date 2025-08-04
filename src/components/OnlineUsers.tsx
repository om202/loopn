'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useState, useEffect, useCallback, useMemo } from 'react';

import type { Schema } from '../../amplify/data/resource';
import { chatService } from '../services/chat.service';
import { userService } from '../services/user.service';

import { DashboardSidebar, DashboardSectionContent } from './dashboard';
import LoadingContainer from './LoadingContainer';
import { useChatActions } from '../hooks/useChatActions';
import { useUserCategorization } from '../hooks/useUserCategorization';
import { useRealtimeOnlineUsers } from '../hooks/realtime';
import { useChatRequests } from '../hooks/realtime/useChatRequests';
import { useRealtime } from '../contexts/RealtimeContext';

type UserPresence = Schema['UserPresence']['type'];
type Conversation = Schema['Conversation']['type'];

interface OnlineUsersProps {
  onChatRequestSent: () => void;
}

type SidebarSection = 'online' | 'connections' | 'chat-trial';

export default function OnlineUsers({ onChatRequestSent }: OnlineUsersProps) {
  const [allUsers, setAllUsers] = useState<UserPresence[]>([]);
  const [existingConversations, setExistingConversations] = useState<
    Map<string, Conversation>
  >(new Map());
  const [error, setError] = useState<string | null>(null);
  const [, setConversationsLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState<SidebarSection>('online');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [optimisticPendingRequests, setOptimisticPendingRequests] = useState<
    Set<string>
  >(new Set());
  const { user } = useAuthenticator();
  const { subscribeToConversations } = useRealtime();

  const {
    onlineUsers: allOnlineUsers,
    isLoading: onlineUsersLoading,
    error: onlineUsersError,
  } = useRealtimeOnlineUsers({
    enabled: !!user?.userId,
  });

  const { pendingReceiverIds, error: sentRequestsError } = useChatRequests({
    userId: user?.userId || '',
    enabled: !!user?.userId,
  });

  // Combine real-time pending requests with optimistic updates
  const combinedPendingRequests = useMemo(() => {
    const combined = new Set([
      ...pendingReceiverIds,
      ...optimisticPendingRequests,
    ]);
    return combined;
  }, [pendingReceiverIds, optimisticPendingRequests]);

  const onlineUsers = useMemo(() => {
    return allOnlineUsers.filter(u => u?.userId && u.userId !== user?.userId);
  }, [allOnlineUsers, user?.userId]);

  const initialLoading = onlineUsersLoading;

  const isAuthSessionReady = async (): Promise<boolean> => {
    try {
      const session = await fetchAuthSession();
      return !!(session.tokens?.accessToken && session.credentials);
    } catch (error) {
      console.error('Auth session not ready yet:', error);
      return false;
    }
  };

  const loadConversations = useCallback(async () => {
    if (!user) {
      setConversationsLoaded(true);
      return;
    }

    try {
      const conversationsResult = await chatService.getUserConversations(
        user.userId
      );
      if (conversationsResult.error) {
        setError(conversationsResult.error);
        setConversationsLoaded(true);
        return;
      }

      const conversations = conversationsResult.data || [];
      const conversationMap = new Map<string, Conversation>();
      const userIds = new Set<string>();

      const sortedConversations = conversations.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      sortedConversations.forEach(conv => {
        const otherUserId =
          conv.participant1Id === user.userId
            ? conv.participant2Id
            : conv.participant1Id;
        if (otherUserId && !conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, conv);
          userIds.add(otherUserId);
        }
      });

      const userPresencePromises = Array.from(userIds).map(async userId => {
        try {
          const result = await userService.getUserPresence(userId);
          return result.data;
        } catch {
          console.error('Error getting user presence for:', userId);
          return null;
        }
      });

      const userPresences = await Promise.all(userPresencePromises);
      const validUserPresences = userPresences.filter(
        Boolean
      ) as UserPresence[];

      setExistingConversations(conversationMap);
      return validUserPresences;
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError('Failed to load conversations');
      return [];
    } finally {
      setConversationsLoaded(true);
    }
  }, [user]);

  const userCategories = useUserCategorization({
    onlineUsers,
    allUsers,
    existingConversations,
    currentTime,
  });

  const chatActions = useChatActions({
    user,
    existingConversations,
    canUserReconnect: userCategories.canUserReconnect,
    onChatRequestSent,
  });

  const [conversationUsers, setConversationUsers] = useState<UserPresence[]>(
    []
  );

  useEffect(() => {
    if (!user) {
      return;
    }

    const conversationDelay = setTimeout(async () => {
      const authReady = await isAuthSessionReady();
      if (authReady) {
        loadConversations().then(users => {
          setConversationUsers(users || []);
        });
      } else {
        console.error('Auth session not ready for conversation loading');
        setConversationsLoaded(true);
      }
    }, 800);

    return () => {
      clearTimeout(conversationDelay);
    };
  }, [user, loadConversations]);

  useEffect(() => {
    if (!user?.userId) {
      return;
    }

    const subscription = subscribeToConversations(user.userId, data => {
      const conversations = (data as { items?: Conversation[] }).items || [];
      const conversationMap = new Map<string, Conversation>();

      const sortedConversations = conversations.sort(
        (a: Conversation, b: Conversation) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        }
      );

      sortedConversations.forEach((conv: Conversation) => {
        const otherUserId =
          conv.participant1Id === user.userId
            ? conv.participant2Id
            : conv.participant1Id;
        if (otherUserId && !conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, conv);
        }
      });

      setExistingConversations(conversationMap);
    });

    return () => {
      subscription();
    };
  }, [user?.userId, subscribeToConversations]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Clean up optimistic pending requests that are now reflected in real-time data
  useEffect(() => {
    setOptimisticPendingRequests(prev => {
      const newOptimistic = new Set(prev);
      let hasChanges = false;

      // Remove any optimistic requests that are now in real-time data
      prev.forEach(receiverId => {
        if (pendingReceiverIds.has(receiverId)) {
          newOptimistic.delete(receiverId);
          hasChanges = true;
        }
      });

      return hasChanges ? newOptimistic : prev;
    });
  }, [pendingReceiverIds]);

  useEffect(() => {
    const combinedUsers = [...onlineUsers];
    conversationUsers.forEach(userPresence => {
      if (!combinedUsers.find(u => u.userId === userPresence.userId)) {
        combinedUsers.push(userPresence);
      }
    });
    setAllUsers(combinedUsers);
  }, [onlineUsers, conversationUsers]);

  const handleChatAction = async (receiverId: string) => {
    const action = await chatActions.handleChatAction(
      receiverId,
      combinedPendingRequests
    );
    if (action === 'send-request') {
      chatActions.handleSendChatRequest(
        receiverId,
        setOptimisticPendingRequests
      );
    }
  };

  const handleCancelChatRequest = (receiverId: string) => {
    chatActions.handleCancelChatRequest(
      receiverId,
      setOptimisticPendingRequests
    );
  };

  if (error || onlineUsersError || sentRequestsError || chatActions.error) {
    return (
      <div className='p-4 sm:p-6 text-red-600 bg-red-50 rounded-2xl border border-red-200 text-center'>
        <div className='text-sm sm:text-sm font-medium mb-1'>Error</div>
        <div className='text-sm sm:text-sm'>
          {error || onlineUsersError || sentRequestsError || chatActions.error}
        </div>
      </div>
    );
  }

  if (initialLoading) {
    return <LoadingContainer />;
  }

  return (
    <div className='flex lg:gap-4 h-[calc(100vh-5rem)] pb-20 lg:pb-0'>
      <DashboardSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onlineUsersCount={userCategories.onlineUsers.length}
        connectionsCount={userCategories.connectionUsers.length}
        chatTrialsCount={
          userCategories.activeChatTrialUsers.length +
          userCategories.endedChatTrialUsers.length
        }
      />

      <div className='flex-1 bg-white sm:rounded-2xl sm:border sm:border-gray-200 p-4 lg:p-6 overflow-y-auto'>
        <DashboardSectionContent
          activeSection={activeSection}
          onlineUsers={userCategories.onlineUsers}
          connectionUsers={userCategories.connectionUsers}
          activeChatTrialUsers={userCategories.activeChatTrialUsers}
          endedChatTrialUsers={userCategories.endedChatTrialUsers}
          existingConversations={existingConversations}
          pendingRequests={combinedPendingRequests}
          onChatAction={handleChatAction}
          onCancelChatRequest={handleCancelChatRequest}
          canUserReconnect={userCategories.canUserReconnect}
          getReconnectTimeRemaining={userCategories.getReconnectTimeRemaining}
        />
      </div>
    </div>
  );
}
