'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useState, useEffect, useCallback, useMemo } from 'react';
import ProfileSidebar from './ProfileSidebar';
import { simplePresenceManager } from '../lib/presence-utils';
import { useAuth } from '../contexts/AuthContext';

import type { Schema } from '../../amplify/data/resource';
import { chatService } from '../services/chat.service';
import { userPresenceService } from '../services/user.service';

import {
  DashboardSidebar,
  DashboardSectionContent,
  NotificationsContent,
  AccountContent,
  HelpContent,
} from './dashboard';
import SearchUser from './SearchUser';
import BugReportDialog from './BugReportDialog';
import { useChatActions } from '../hooks/useChatActions';
import { useUserCategorization } from '../hooks/useUserCategorization';
import { useOnlineUsers } from '../hooks/useOnlineUsers';
import { useConversations } from '../hooks/useConversations';
import { useChatRequests } from '../hooks/useChatRequests';
import { useNotifications } from '../hooks/useNotifications';
import { notificationService } from '../services/notification.service';
import { useSubscriptionStore } from '../stores/subscription-store';
import { OnlineUsers_Shimmer, ShimmerProvider } from './ShimmerLoader/exports';

type UserPresence = Schema['UserPresence']['type'];
type Conversation = Schema['Conversation']['type'];

interface OnlineUsersProps {
  onChatRequestSent: () => void;
  onProfessionalRequest?: (request: string) => void;
}

type SidebarSection =
  | 'all'
  | 'connections'
  | 'suggested'
  | 'search'
  | 'notifications'
  | 'help'
  | 'account';

export default function OnlineUsers({
  onChatRequestSent,
  onProfessionalRequest,
}: OnlineUsersProps) {
  const [allUsers, setAllUsers] = useState<UserPresence[]>([]);
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);
  // Existing conversations now managed by centralized hook
  const [profileSidebarUser, setProfileSidebarUser] =
    useState<UserPresence | null>(null);

  // Current user profile for search context
  const [currentUserProfile, setCurrentUserProfile] = useState<
    Schema['UserProfile']['type'] | null
  >(null);
  const [profileSidebarOpen, setProfileSidebarOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [, setConversationsLoaded] = useState(false);
  const [activeSection, setActiveSection] =
    useState<SidebarSection>('suggested');
  const [searchQuery, setSearchQuery] = useState('');
  const [shouldTriggerSearch, setShouldTriggerSearch] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [optimisticPendingRequests, setOptimisticPendingRequests] = useState<
    Set<string>
  >(new Set());
  const { user } = useAuthenticator();
  const { handleSignOut } = useAuth();

  const handleSignOutClick = async () => {
    await simplePresenceManager.setOffline();
    handleSignOut();
  };
  // Conversation subscription now handled by centralized hook
  const { fetchUserProfile } = useSubscriptionStore();

  const {
    onlineUsers: allOnlineUsers,
    isLoading: onlineUsersLoading,
    error: onlineUsersError,
  } = useOnlineUsers({
    enabled: !!user?.userId,
  });

  // Use centralized hooks for all subscriptions (no direct subscription calls)
  const { conversations } = useSubscriptionStore();

  // Use centralized conversations for subscription management
  useConversations({
    userId: user?.userId || '',
    enabled: !!user?.userId,
  });

  // Use centralized chat requests hook (handles subscriptions internally)
  const { incomingRequests: incomingChatRequests, pendingReceiverIds } =
    useChatRequests({
      userId: user?.userId || '',
      enabled: !!user?.userId,
    });

  // Use centralized notifications for mark all as read functionality
  const { notifications: centralizedNotifications } = useNotifications({
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

  // Create a set of user IDs who have sent requests to the current user
  const incomingRequestSenderIds = useMemo(() => {
    return new Set(
      incomingChatRequests
        .filter(req => req.status === 'PENDING')
        .map(req => req.requesterId)
    );
  }, [incomingChatRequests]);

  // Create a map of user ID to chat request for easy lookup
  const incomingRequestsByUserId = useMemo(() => {
    const map = new Map();
    incomingChatRequests
      .filter(req => req.status === 'PENDING')
      .forEach(req => {
        map.set(req.requesterId, req);
      });
    return map;
  }, [incomingChatRequests]);

  const onlineUsers = useMemo(() => {
    return allOnlineUsers.filter(u => u?.userId && u.userId !== user?.userId);
  }, [allOnlineUsers, user?.userId]);

  const initialLoading = onlineUsersLoading;

  // Load current user profile for search context
  useEffect(() => {
    let mounted = true;
    const loadCurrentUserProfile = async () => {
      if (!user?.userId) return;
      try {
        // Use our centralized profile fetching (with caching)
        const profile = await fetchUserProfile(user.userId);
        if (mounted) setCurrentUserProfile(profile);
      } catch (error) {
        console.error('Error loading current user profile for search:', error);
      }
    };
    loadCurrentUserProfile();
    return () => {
      mounted = false;
    };
  }, [user?.userId, fetchUserProfile]);

  // Persist and restore sidebar open/close state only (not the selected user)
  // Profile sidebar starts closed by default (no localStorage persistence)

  // Auto-select first user when sidebar is restored and users are available
  useEffect(() => {
    if (profileSidebarOpen && !profileSidebarUser && allUsers.length > 0) {
      const firstUser = allUsers[0];
      setProfileSidebarUser(firstUser);
    }
  }, [profileSidebarOpen, profileSidebarUser, allUsers]);

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

      // Create basic presence entries for conversation participants
      // Real-time presence data will be merged later via the onlineUsers state
      const validUserPresences = Array.from(userIds).map(userId => ({
        userId,
        isOnline: false, // Will be updated by real-time data if user is online
        status: 'OFFLINE' as const,
        lastSeen: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      return validUserPresences;
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError('Failed to load conversations');
      return [];
    } finally {
      setConversationsLoaded(true);
    }
  }, [user]);

  // Create a conversations map for compatibility with existing hooks
  const existingConversations = useMemo(() => {
    const conversationMap = new Map<string, Conversation>();

    // Get all conversations from the subscription store directly
    const allConversations = Array.from(conversations.values());

    // Map conversations by participant ID for quick lookup
    allConversations.forEach(conversation => {
      const otherUserId =
        conversation.participant1Id === user?.userId
          ? conversation.participant2Id
          : conversation.participant1Id;

      conversationMap.set(otherUserId, conversation);
    });

    return conversationMap;
  }, [conversations, user?.userId]);

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
  const [suggestedUsers, setSuggestedUsers] = useState<UserPresence[]>([]);
  const [suggestedUsersLoading, setSuggestedUsersLoading] = useState(true);
  const [lastSuggestedUsersLoad, setLastSuggestedUsersLoad] =
    useState<number>(0);

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

  // Conversation subscription now handled by centralized hook

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000); // Update every 10 seconds for lazy timer

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

  // Load all users for suggested section with caching
  useEffect(() => {
    if (!user) {
      return;
    }

    const loadSuggestedUsers = async () => {
      const now = Date.now();
      const cacheExpiry = 2 * 60 * 1000; // 2 minutes cache

      // If we have cached data that's less than 2 minutes old, don't reload
      if (
        lastSuggestedUsersLoad &&
        now - lastSuggestedUsersLoad < cacheExpiry &&
        suggestedUsers.length > 0
      ) {
        setSuggestedUsersLoading(false);
        return;
      }

      setSuggestedUsersLoading(true);
      try {
        const result = await userPresenceService.getAllUsers();
        if (result.error) {
          console.error('Error loading suggested users:', result.error);
          setSuggestedUsersLoading(false);
          return;
        }

        // Filter out current user, users with existing conversations (except reconnectable), and remove duplicates
        const filteredUsers = (result.data || []).filter((u: UserPresence) => {
          // Exclude current user
          if (!u?.userId || u.userId === user.userId) {
            return false;
          }

          const conversation = existingConversations.get(u.userId);

          // If no conversation exists, include the user
          if (!conversation) {
            return true;
          }

          // If conversation exists, only include if it's ended and user can reconnect
          const isEndedAndReconnectable =
            conversation.chatStatus === 'ENDED' &&
            userCategories.canUserReconnect(u.userId);

          // Exclude users with active conversations or permanent connections
          // Include users who can be reconnected
          return isEndedAndReconnectable;
        });
        setSuggestedUsers(filteredUsers);
        setLastSuggestedUsersLoad(now);
        setSuggestedUsersLoading(false);
      } catch (error) {
        console.error('Error loading suggested users:', error);
        setSuggestedUsersLoading(false);
      }
    };

    loadSuggestedUsers();
  }, [
    user,
    lastSuggestedUsersLoad,
    suggestedUsers.length,
    existingConversations,
    userCategories,
  ]);

  useEffect(() => {
    const combinedUsers = [...onlineUsers];
    conversationUsers.forEach(userPresence => {
      // Check if user is already in online users (has real-time presence data)
      const existingUser = combinedUsers.find(
        u => u.userId === userPresence.userId
      );
      if (!existingUser) {
        // User is not currently online, add them with offline status
        combinedUsers.push(userPresence);
      }
      // If user exists in onlineUsers, real-time data takes precedence
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

  const handleAcceptChatRequest = async (requesterId: string) => {
    const chatRequest = incomingRequestsByUserId.get(requesterId);
    if (!chatRequest) {
      console.error('Chat request not found for user:', requesterId);
      return;
    }

    try {
      const result = await chatService.respondToChatRequest(
        chatRequest.id,
        'ACCEPTED'
      );

      if (result.error) {
        setError(result.error);
      } else {
        // The real-time subscription will automatically update the UI with the new conversation
        onChatRequestSent();
      }
    } catch (error) {
      console.error('Error accepting chat request:', error);
      setError('Failed to accept chat request');
    }
  };

  const handleProfessionalRequest = (query: string) => {
    // Switch to search section and trigger search
    setActiveSection('search');
    setSearchQuery(query);
    setShouldTriggerSearch(true);

    // Reset trigger after a moment to allow for new searches
    setTimeout(() => setShouldTriggerSearch(false), 100);

    // Call the original callback if provided
    onProfessionalRequest?.(query);
  };

  const handleMarkAllAsRead = async () => {
    if (!user || !centralizedNotifications.length) return;
    try {
      const markPromises = centralizedNotifications
        .filter(notification => notification.type !== 'connection') // Skip connection requests entirely
        .map(notification => {
          if (
            notification.type === 'message' &&
            notification.data &&
            typeof notification.data === 'object' &&
            'conversationId' in notification.data
          ) {
            // Delete message notifications for the entire conversation
            return notificationService.deleteNotificationsForConversation(
              user.userId,
              (notification.data as { conversationId: string }).conversationId
            );
          } else if (notification.type === 'chat_request') {
            // Delete chat requests as they should be removed on mark all as read
            return notificationService.deleteNotification(notification.id);
          } else {
            // For other notification types (not connection requests), just mark as read
            return notificationService.markNotificationAsRead(notification.id);
          }
        });
      await Promise.all(markPromises);
    } catch (error) {
      console.error('Error processing notifications:', error);
    }
  };

  const handleOpenProfileSidebar = async (userPresence: UserPresence) => {
    // Toggle open/close (no localStorage persistence)
    if (profileSidebarOpen) {
      setProfileSidebarOpen(false);
      setProfileSidebarUser(null);
      return;
    }

    setProfileSidebarOpen(true);
    setProfileSidebarUser(userPresence);
  };

  const handleUserCardClick = async (userPresence: UserPresence) => {
    // If sidebar is not open, open it
    if (!profileSidebarOpen) {
      setProfileSidebarOpen(true);
    }

    // Always update the selected user
    setProfileSidebarUser(userPresence);
  };

  if (error || onlineUsersError || chatActions.error) {
    return (
      <div className='p-4 sm:p-6 text-b_red-500 bg-b_red-100 rounded-2xl border border-b_red-200 text-center'>
        <div className='text-sm sm:text-sm font-medium mb-1'>Error</div>
        <div className='text-sm sm:text-sm'>
          {error || onlineUsersError || chatActions.error}
        </div>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <ShimmerProvider>
        <OnlineUsers_Shimmer userCount={6} />
      </ShimmerProvider>
    );
  }

  return (
    <div className='flex lg:gap-4 h-full pb-16 lg:pb-0'>
      <DashboardSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onlineUsersCount={userCategories.onlineUsers.length}
        connectionsCount={userCategories.connectionUsers.length}
        chatTrialsCount={
          userCategories.activeChatTrialUsers.length +
          userCategories.endedChatTrialUsers.length
        }
        suggestedUsersCount={suggestedUsers.length}
      />

      <div className='flex-1 bg-white sm:rounded-2xl shadow-md p-3 sm:p-4 lg:p-6 ultra-compact overflow-hidden flex flex-col min-h-0'>
        {/* Search User - Always visible at top */}
        <div className='flex-shrink-0 mb-4 sm:mb-6 mx-auto max-w-[860px] w-full'>
          <SearchUser
            onProfessionalRequest={handleProfessionalRequest}
            userProfile={currentUserProfile || undefined}
          />
        </div>

        {/* Section Header - Fixed at top */}
        <div className='flex-shrink-0 mb-4 sm:mb-5 lg:mb-6 mx-auto max-w-[860px] w-full'>
          {activeSection === 'notifications' && (
            <div className='flex items-start justify-between'>
              <div>
                <h2 className='text-2xl sm:text-2xl font-bold text-black mb-1'>
                  Notifications
                </h2>
                <p className='text-base text-neutral-500'>
                  Keep up with your latest activity
                </p>
              </div>
              {centralizedNotifications.length > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className='text-sm text-brand-600 hover:text-brand-600 font-medium py-2 px-3 rounded-lg hover:bg-brand-50 transition-colors ml-4 flex-shrink-0'
                >
                  Mark all as read
                </button>
              )}
            </div>
          )}
          {activeSection === 'help' && (
            <div>
              <h2 className='text-xl sm:text-2xl font-bold text-black mb-1'>
                Help & Support
              </h2>
              <p className='text-base text-neutral-500'>
                Common questions and troubleshooting
              </p>
            </div>
          )}
          {activeSection === 'account' && (
            <div className='flex items-start justify-between'>
              <div>
                <h2 className='text-2xl sm:text-2xl font-bold text-black mb-1'>
                  Account
                </h2>
                <p className='text-base text-neutral-500'>
                  Manage your profile and settings
                </p>
              </div>
              <button
                onClick={handleSignOutClick}
                className='flex items-center gap-2 px-4 py-2.5 text-b_red-600 hover:bg-b_red-50 rounded-lg border border-b_red-200 ml-4 flex-shrink-0'
              >
                <span className='text-base font-medium'>Log Out</span>
              </button>
            </div>
          )}
          {activeSection === 'connections' && (
            <div>
              <h2 className='text-xl sm:text-2xl font-bold text-black mb-1'>
                Connections
              </h2>
              <p className='text-base text-neutral-500'>Your connections</p>
            </div>
          )}
          {activeSection === 'suggested' && (
            <div>
              <h2 className='text-xl sm:text-2xl font-bold text-black mb-1'>
                Discover
              </h2>
              <p className='text-base text-neutral-500'>
                Find and connect with new people
              </p>
            </div>
          )}
          {activeSection === 'search' && (
            <div>
              <h2 className='text-xl sm:text-2xl font-bold text-black mb-1'>
                {searchQuery ? 'Search Results' : 'Search'}
              </h2>
              <p className='text-base text-neutral-500'>
                {searchQuery ? `"${searchQuery}"` : 'Search for professionals'}
              </p>
            </div>
          )}
          {activeSection === 'all' && (
            <div>
              <h2 className='text-xl sm:text-2xl font-bold text-black mb-1'>
                Chats
              </h2>
              <p className='text-base text-neutral-500'>Your conversations</p>
            </div>
          )}
        </div>

        <div className='relative flex-1 overflow-hidden'>
          {/* Top border - shows when scrolled down */}
          <div className='absolute top-0 left-0 right-0 h-px bg-stone-200 opacity-0 transition-opacity duration-200 z-10 scroll-top-border'></div>

          {/* Bottom border - shows when not at bottom */}
          <div className='absolute bottom-0 left-0 right-0 h-px bg-stone-200 opacity-0 transition-opacity duration-200 z-10 scroll-bottom-border'></div>

          <div
            className='overflow-y-auto flex-1 h-full'
            onScroll={e => {
              const target = e.target as HTMLDivElement;
              const { scrollTop, scrollHeight, clientHeight } = target;

              // Show top border when scrolled down
              const topBorder = target.parentElement?.querySelector(
                '.scroll-top-border'
              ) as HTMLElement;
              if (topBorder) {
                topBorder.style.opacity = scrollTop > 0 ? '1' : '0';
              }

              // Show bottom border when not at bottom
              const bottomBorder = target.parentElement?.querySelector(
                '.scroll-bottom-border'
              ) as HTMLElement;
              if (bottomBorder) {
                const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
                bottomBorder.style.opacity = isAtBottom ? '0' : '1';
              }
            }}
          >
            {activeSection === 'notifications' ? (
              <NotificationsContent />
            ) : activeSection === 'help' ? (
              <HelpContent onOpenBugReport={() => setIsBugReportOpen(true)} />
            ) : activeSection === 'account' ? (
              <AccountContent />
            ) : (
              <DashboardSectionContent
                activeSection={activeSection}
                onlineUsers={userCategories.onlineUsers}
                connectionUsers={userCategories.connectionUsers}
                activeChatTrialUsers={userCategories.activeChatTrialUsers}
                endedChatTrialUsers={userCategories.endedChatTrialUsers}
                suggestedUsers={suggestedUsers}
                suggestedUsersLoading={suggestedUsersLoading}
                existingConversations={existingConversations}
                pendingRequests={combinedPendingRequests}
                optimisticPendingRequests={optimisticPendingRequests}
                incomingRequestSenderIds={incomingRequestSenderIds}
                onChatAction={handleChatAction}
                onCancelChatRequest={handleCancelChatRequest}
                onAcceptChatRequest={handleAcceptChatRequest}
                canUserReconnect={userCategories.canUserReconnect}
                getReconnectTimeRemaining={
                  userCategories.getReconnectTimeRemaining
                }
                onOpenProfileSidebar={handleOpenProfileSidebar}
                onUserCardClick={handleUserCardClick}
                isProfileSidebarOpen={profileSidebarOpen}
                selectedUserId={profileSidebarUser?.userId}
                searchQuery={searchQuery}
                shouldTriggerSearch={shouldTriggerSearch}
                setOptimisticPendingRequests={setOptimisticPendingRequests}
              />
            )}
          </div>
        </div>
      </div>

      {/* Right push sidebar: desktop only */}
      {profileSidebarOpen && profileSidebarUser && (
        <div className='hidden md:flex w-[340px] xl:w-[350px] flex-shrink-0'>
          <ProfileSidebar
            userId={profileSidebarUser.userId}
            userPresence={profileSidebarUser}
            onlineUsers={onlineUsers}
            showActionButtons={true}
            existingConversations={existingConversations}
            pendingRequests={combinedPendingRequests}
            onChatAction={handleChatAction}
            onCancelChatRequest={handleCancelChatRequest}
            canUserReconnect={userCategories.canUserReconnect}
            getReconnectTimeRemaining={userCategories.getReconnectTimeRemaining}
          />
        </div>
      )}

      {/* Bug Report Dialog */}
      <BugReportDialog
        isOpen={isBugReportOpen}
        onClose={() => setIsBugReportOpen(false)}
      />
    </div>
  );
}
