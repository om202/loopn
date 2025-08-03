'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useState, useEffect, useCallback } from 'react';

import type { Schema } from '../../amplify/data/resource';
import { chatService } from '../services/chat.service';
import { userService } from '../services/user.service';

import { DashboardSidebar, DashboardSectionContent } from './dashboard';
import LoadingContainer from './LoadingContainer';
import { useChatActions } from '../hooks/useChatActions';
import { useUserCategorization } from '../hooks/useUserCategorization';

type UserPresence = Schema['UserPresence']['type'];
type Conversation = Schema['Conversation']['type'];

interface OnlineUsersProps {
  onChatRequestSent: () => void;
}

type SidebarSection = 'online' | 'connections' | 'chat-trial';

export default function OnlineUsers({ onChatRequestSent }: OnlineUsersProps) {
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [allUsers, setAllUsers] = useState<UserPresence[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(
    new Set()
  );
  const [existingConversations, setExistingConversations] = useState<
    Map<string, Conversation>
  >(new Map());
  const [error, setError] = useState<string | null>(null);
  const [pendingRequestsLoaded, setPendingRequestsLoaded] = useState(false);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState<SidebarSection>('online');
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user } = useAuthenticator();

  // Helper function to check if authentication session is ready
  const isAuthSessionReady = async (): Promise<boolean> => {
    try {
      const session = await fetchAuthSession();
      return !!(session.tokens?.accessToken && session.credentials);
    } catch (error) {
      console.log('Auth session not ready yet:', error);
      return false;
    }
  };

  const loadConversations = useCallback(async () => {
    if (!user) {
      setConversationsLoaded(true);
      return;
    }

    try {
      // Get all conversations for the user
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

      // Sort conversations by creation date (newest first) to ensure we get the latest conversation per user
      const sortedConversations = conversations.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA; // Newest first
      });

      // Extract participant IDs and conversation mappings (newest conversation per user)
      sortedConversations.forEach(conv => {
        const otherUserId =
          conv.participant1Id === user.userId
            ? conv.participant2Id
            : conv.participant1Id;
        if (otherUserId && !conversationMap.has(otherUserId)) {
          // Only set if we haven't seen this user yet (since we're going newest first)
          conversationMap.set(otherUserId, conv);
          userIds.add(otherUserId);
        }
      });

      // Get user presence data for all conversation participants
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
  }, [user]); // State setters are stable and don't need to be included

  // Use extracted hooks
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

  useEffect(() => {
    if (!user) {
      return;
    }

    // Reset loading state for new user
    setInitialLoading(true);
    setPendingRequestsLoaded(false);
    setConversationsLoaded(false);

    let sentRequestsSubscription: any;
    let onlineUsersSubscription: any;

    // Add delay and wait for authentication session to be fully established
    const authDelay = setTimeout(async () => {
      // Wait for auth session to be ready with retry logic
      let authReady = false;
      let retries = 0;
      const maxRetries = 5;

      while (!authReady && retries < maxRetries) {
        authReady = await isAuthSessionReady();
        if (!authReady) {
          retries++;
          console.log(`Waiting for auth session... (${retries}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!authReady) {
        console.error('Failed to establish auth session after retries');
        setPendingRequestsLoaded(true);
        setInitialLoading(false);
        return;
      }

      // Subscribe to sent chat requests for real-time updates
      sentRequestsSubscription = chatService.observeSentChatRequests(
        user.userId,
        requests => {
          const receiverIds = requests.map(req => req.receiverId);
          setPendingRequests(new Set(receiverIds));
          setPendingRequestsLoaded(true);
        },
        error => {
          console.error('Error observing sent chat requests:', error);
          setPendingRequestsLoaded(true);
        }
      );

      // Subscribe to online users updates
      onlineUsersSubscription = userService.observeOnlineUsers(
        users => {
          // Filter out current user and remove duplicates
          const otherUsers = users
            .filter(u => u?.userId && u.userId !== user.userId)
            .filter(
              (user, index, self) =>
                index === self.findIndex(u => u.userId === user.userId)
            );

          setOnlineUsers(otherUsers);
        },
        () => {
          console.error('Error observing online users');
          setError('Failed to load online users');
          setInitialLoading(false); // Also mark as loaded on error
        }
      );
    }, 500); // Initial delay before checking auth

    return () => {
      clearTimeout(authDelay);
      if (sentRequestsSubscription) {
        sentRequestsSubscription.unsubscribe();
      }
      if (onlineUsersSubscription) {
        onlineUsersSubscription.unsubscribe();
      }
    };
  }, [user]);

  // Store conversation users separately
  const [conversationUsers, setConversationUsers] = useState<UserPresence[]>(
    []
  );

  // Load conversations when user changes
  useEffect(() => {
    if (!user) {
      return;
    }

    // Add delay to ensure authentication session is fully established before loading conversations
    const conversationDelay = setTimeout(async () => {
      // Wait for auth session to be ready
      const authReady = await isAuthSessionReady();
      if (authReady) {
        loadConversations().then(users => {
          setConversationUsers(users || []);
          // No automatic reconnect checks to avoid infinite requests
          // Users can refresh the page to check reconnect availability
        });
      } else {
        console.log('Auth session not ready for conversation loading');
        setConversationsLoaded(true); // Mark as loaded to prevent infinite waiting
      }
    }, 800); // Delay for conversations

    return () => {
      clearTimeout(conversationDelay);
    };
  }, [user, loadConversations]);

  // Subscribe to real-time conversation updates to keep status current
  useEffect(() => {
    if (!user?.userId) {
      return;
    }

    const subscription = chatService.observeConversations(
      user.userId,
      conversations => {
        const conversationMap = new Map<string, Conversation>();

        // Sort conversations by creation date (newest first) and update mappings with latest data
        const sortedConversations = conversations.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA; // Newest first
        });

        // Update conversation mappings (newest conversation per user)
        sortedConversations.forEach(conv => {
          const otherUserId =
            conv.participant1Id === user.userId
              ? conv.participant2Id
              : conv.participant1Id;
          if (otherUserId && !conversationMap.has(otherUserId)) {
            // Only set if we haven't seen this user yet (since we're going newest first)
            conversationMap.set(otherUserId, conv);
          }
        });

        setExistingConversations(conversationMap);
        // Only check reconnectable users occasionally to avoid excessive calls
        // The interval will handle regular updates
      },
      error => {
        console.error(
          'Error observing conversation updates in dashboard:',
          error
        );
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.userId]);

  // Timer to update countdown every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Combine online users with conversation users whenever either changes
  useEffect(() => {
    const combinedUsers = [...onlineUsers];
    conversationUsers.forEach(userPresence => {
      if (!combinedUsers.find(u => u.userId === userPresence.userId)) {
        combinedUsers.push(userPresence);
      }
    });
    setAllUsers(combinedUsers);
  }, [onlineUsers, conversationUsers]);

  // Update initialLoading when both pending requests and conversations are loaded
  useEffect(() => {
    if (pendingRequestsLoaded && conversationsLoaded) {
      setInitialLoading(false);
    }
  }, [pendingRequestsLoaded, conversationsLoaded]);

  const handleChatAction = async (receiverId: string) => {
    const action = await chatActions.handleChatAction(
      receiverId,
      pendingRequests
    );
    if (action === 'send-request') {
      chatActions.handleSendChatRequest(receiverId, setPendingRequests);
    }
  };

  const handleCancelChatRequest = (receiverId: string) => {
    chatActions.handleCancelChatRequest(receiverId, setPendingRequests);
  };

  if (error || chatActions.error) {
    return (
      <div className='p-4 sm:p-6 text-red-600 bg-red-50 rounded-2xl border border-red-200 text-center'>
        <div className='text-xs sm:text-sm font-medium mb-1'>Error</div>
        <div className='text-xs sm:text-sm'>{error || chatActions.error}</div>
      </div>
    );
  }

  if (initialLoading) {
    return <LoadingContainer />;
  }

  return (
    <div className='flex gap-4 h-[calc(100vh-5rem)]'>
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

      {/* Main Content */}
      <div className='flex-1 bg-white rounded-2xl border border-gray-200 p-6 overflow-y-auto'>
        <DashboardSectionContent
          activeSection={activeSection}
          onlineUsers={userCategories.onlineUsers}
          connectionUsers={userCategories.connectionUsers}
          activeChatTrialUsers={userCategories.activeChatTrialUsers}
          endedChatTrialUsers={userCategories.endedChatTrialUsers}
          existingConversations={existingConversations}
          pendingRequests={pendingRequests}
          onChatAction={handleChatAction}
          onCancelChatRequest={handleCancelChatRequest}
          canUserReconnect={userCategories.canUserReconnect}
          getReconnectTimeRemaining={userCategories.getReconnectTimeRemaining}
        />
      </div>
    </div>
  );
}
