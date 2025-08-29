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
} from './dashboard';
import SearchUser from './SearchUser';
import BugReportDialog from './BugReportDialog';
import { useChatActions } from '../hooks/useChatActions';
import { useUserCategorization } from '../hooks/useUserCategorization';
import { useOnlineUsers } from '../hooks/useOnlineUsers';
import { useConversations } from '../hooks/useConversations';
import { useChatRequests } from '../hooks/useChatRequests';
import { useNotifications } from '../hooks/useNotifications';
import { useSavedUsers } from '../hooks/useSavedUsers';
import { useUserProfile } from '../hooks/useUserProfile';
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
  | 'connections'
  | 'suggested'
  | 'saved'
  | 'search'
  | 'notifications'
  | 'account';

export default function OnlineUsers({
  onChatRequestSent,
  onProfessionalRequest,
}: OnlineUsersProps) {
  const [allUsers, setAllUsers] = useState<UserPresence[]>([]);
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);
  const [profileSidebarUser, setProfileSidebarUser] =
    useState<UserPresence | null>(null);

  const [profileSidebarOpen, setProfileSidebarOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [, setConversationsLoaded] = useState(false);
  const [activeSection, setActiveSection] =
    useState<SidebarSection>('suggested');
  const [searchQuery, setSearchQuery] = useState('');
  const [shouldTriggerSearch, setShouldTriggerSearch] = useState(false);

  const [optimisticPendingRequests, setOptimisticPendingRequests] = useState<
    Set<string>
  >(new Set());
  const { user } = useAuthenticator();

  // Use centralized user profile hook instead of manual fetching
  const { profile: currentUserProfile } = useUserProfile(user?.userId || '');
  const { handleSignOut } = useAuth();

  const handleSignOutClick = async () => {
    await simplePresenceManager.setOffline();
    handleSignOut();
  };
  // No longer need fetchUserProfile - using useUserProfile hook instead

  const {
    onlineUsers: allOnlineUsers,
    isLoading: onlineUsersLoading,
    error: onlineUsersError,
  } = useOnlineUsers({
    enabled: !!user?.userId && activeSection === 'connections',
    currentUserId: user?.userId,
  });

  const { conversations } = useSubscriptionStore();

  useConversations({
    userId: user?.userId || '',
    enabled: !!user?.userId,
  });

  const conversationsLoading = useSubscriptionStore(
    state => state.loading.conversations
  );

  const { incomingRequests: incomingChatRequests, pendingReceiverIds } =
    useChatRequests({
      userId: user?.userId || '',
      enabled: !!user?.userId,
    });

  const { notifications: centralizedNotifications } = useNotifications({
    userId: user?.userId || '',
    enabled: !!user?.userId,
  });

  const { savedUsers: savedUserEntries, isLoading: savedUsersLoading } =
    useSavedUsers({
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

  const incomingRequestSenderIds = useMemo(() => {
    return new Set(
      incomingChatRequests
        .filter(req => req.status === 'PENDING')
        .map(req => req.requesterId)
    );
  }, [incomingChatRequests]);

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

  const savedUsers = useMemo(() => {
    return savedUserEntries
      .map(entry => {
        const userPresence = allUsers.find(u => u.userId === entry.savedUserId);
        if (userPresence) {
          return userPresence;
        }
        return {
          userId: entry.savedUserId,
          isOnline: false,
          status: 'OFFLINE' as const,
          lastSeen: null,
          lastHeartbeat: null,
          activeChatId: null,
          lastChatActivity: null,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
        } as UserPresence;
      })
      .filter(savedUser => savedUser.userId !== user?.userId);
  }, [savedUserEntries, allUsers, user?.userId]);

  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const initialLoading = onlineUsersLoading && !hasInitialLoad;

  useEffect(() => {
    if (!onlineUsersLoading || allOnlineUsers.length > 0) {
      setHasInitialLoad(true);
    }
  }, [onlineUsersLoading, allOnlineUsers.length]);

  // Current user profile is now handled by useUserProfile hook above

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

      const validUserPresences = Array.from(userIds).map(userId => ({
        userId,
        isOnline: false,
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

  const existingConversations = useMemo(() => {
    const conversationMap = new Map<string, Conversation>();

    const allConversations = Array.from(conversations.values());

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
  });

  const chatActions = useChatActions({
    user,
    existingConversations,
    onChatRequestSent,
  });

  const [conversationUsers, setConversationUsers] = useState<UserPresence[]>(
    []
  );
  const [suggestedUsers, setSuggestedUsers] = useState<UserPresence[]>([]);
  const [suggestedUsersLoading, setSuggestedUsersLoading] = useState(true);

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
    setOptimisticPendingRequests(prev => {
      const newOptimistic = new Set(prev);
      let hasChanges = false;

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
    if (!user?.userId || conversationsLoading) {
      return;
    }

    const loadSuggestedUsers = async () => {
      setSuggestedUsersLoading(true);
      try {
        const result = await userPresenceService.getAllUsers();
        if (result.error) {
          console.error('Error loading suggested users:', result.error);
          setSuggestedUsers([]);
          setSuggestedUsersLoading(false);
          return;
        }

        const filteredUsers = (result.data || []).filter((u: UserPresence) => {
          if (!u?.userId || u.userId === user.userId) {
            return false;
          }

          return !existingConversations.has(u.userId);
        });

        setSuggestedUsers(filteredUsers);
        setSuggestedUsersLoading(false);
      } catch (error) {
        console.error('Error loading suggested users:', error);
        setSuggestedUsers([]);
        setSuggestedUsersLoading(false);
      }
    };

    loadSuggestedUsers();
  }, [user?.userId, existingConversations, conversationsLoading]);

  useEffect(() => {
    const combinedUsers = [...onlineUsers];
    conversationUsers.forEach(userPresence => {
      const existingUser = combinedUsers.find(
        u => u.userId === userPresence.userId
      );
      if (!existingUser) {
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

  const handleAcceptChatRequest = async (requesterId: string) => {
    const chatRequest = incomingRequestsByUserId.get(requesterId);
    if (!chatRequest) {
      console.error('Connection request not found for user:', requesterId);
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
        onChatRequestSent();
      }
    } catch (error) {
      console.error('Error accepting connection request:', error);
      setError('Failed to accept connection request');
    }
  };

  const handleProfessionalRequest = (query: string) => {
    setActiveSection('search');
    setSearchQuery(query);
    setShouldTriggerSearch(true);

    setTimeout(() => setShouldTriggerSearch(false), 100);

    onProfessionalRequest?.(query);
  };

  const handleMarkAllAsRead = async () => {
    if (!user || !centralizedNotifications.length) return;
    try {
      const markPromises = centralizedNotifications
        .filter(notification => notification.type !== 'connection')
        .map(notification => {
          if (
            notification.type === 'message' &&
            notification.data &&
            typeof notification.data === 'object' &&
            'conversationId' in notification.data
          ) {
            return notificationService.deleteNotificationsForConversation(
              user.userId,
              (notification.data as { conversationId: string }).conversationId
            );
          } else if (notification.type === 'chat_request') {
            return notificationService.deleteNotification(notification.id);
          } else {
            return notificationService.markNotificationAsRead(notification.id);
          }
        });
      await Promise.all(markPromises);
    } catch (error) {
      console.error('Error processing notifications:', error);
    }
  };

  const handleOpenProfileSidebar = async (userPresence: UserPresence) => {
    if (profileSidebarOpen) {
      setProfileSidebarOpen(false);
      setProfileSidebarUser(null);
      return;
    }

    setProfileSidebarOpen(true);
    setProfileSidebarUser(userPresence);
  };

  const handleUserCardClick = async (userPresence: UserPresence) => {
    if (!profileSidebarOpen) {
      setProfileSidebarOpen(true);
    }

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
    <div className='flex lg:gap-3 h-full pb-16 lg:pb-0'>
      <DashboardSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        connectionsCount={userCategories.connectionUsers.length}
        suggestedUsersCount={suggestedUsers.length}
      />

      <div className='flex-1 bg-white sm:rounded-2xl border border-slate-200 py-3 px-3 sm:py-3 sm:px-3 lg:py-3 lg:px-3 ultra-compact overflow-hidden flex flex-col min-h-0'>
        {/* Search User - Always visible at top */}
        <div className='flex-shrink-0 mb-4 sm:mb-6 w-full max-w-6xl mx-auto'>
          <SearchUser
            onProfessionalRequest={handleProfessionalRequest}
            userProfile={currentUserProfile || undefined}
          />
        </div>

        {/* Section Header - Fixed at top */}
        <div className='flex-shrink-0 mb-4 sm:mb-5 lg:mb-6 w-full max-w-6xl mx-auto'>
          {activeSection === 'notifications' && (
            <div className='flex items-start justify-between'>
              <div>
                <h2 className='text-2xl sm:text-2xl font-bold text-black'>
                  Recent Activity
                </h2>
              </div>
              {centralizedNotifications.length > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className='text-sm text-brand-600 hover:text-brand-700 font-medium py-2 px-3 rounded-lg hover:bg-brand-50 transition-colors ml-4 flex-shrink-0'
                >
                  Mark all as read
                </button>
              )}
            </div>
          )}

          {activeSection === 'account' && (
            <div className='flex items-start justify-between'>
              <div>
                <h2 className='text-2xl sm:text-2xl font-bold text-black'>
                  Account Settings
                </h2>
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
              <h2 className='text-xl sm:text-2xl font-bold text-black'>
                My Connections
              </h2>
            </div>
          )}
          {activeSection === 'suggested' && (
            <div>
              <h2 className='text-xl sm:text-2xl font-bold text-black'>
                Discover Professionals
              </h2>
            </div>
          )}
          {activeSection === 'search' && (
            <div>
              <h2 className='text-xl sm:text-2xl font-bold text-black'>
                Search Professionals
              </h2>
            </div>
          )}
        </div>

        <div className='relative flex-1 overflow-hidden'>
          {/* Top border - shows when scrolled down */}
          <div className='absolute top-0 left-1/2 transform -translate-x-1/2 w-full max-w-4xl h-px bg-slate-200 opacity-0 transition-opacity duration-200 z-10 scroll-top-border'></div>

          {/* Bottom border - shows when not at bottom */}
          <div className='absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-4xl h-px bg-slate-200 opacity-0 transition-opacity duration-200 z-10 scroll-bottom-border'></div>

          <div
            className='overflow-y-auto flex-1 h-full max-w-6xl mx-auto w-full'
            onScroll={e => {
              const target = e.target as HTMLDivElement;
              const { scrollTop, scrollHeight, clientHeight } = target;

              const topBorder = target.parentElement?.querySelector(
                '.scroll-top-border'
              ) as HTMLElement;
              if (topBorder) {
                topBorder.style.opacity = scrollTop > 0 ? '1' : '0';
              }

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
            ) : activeSection === 'account' ? (
              <AccountContent />
            ) : (
              <DashboardSectionContent
                activeSection={activeSection}
                onlineUsers={userCategories.onlineUsers}
                connectionUsers={userCategories.connectionUsers}
                suggestedUsers={suggestedUsers}
                savedUsers={savedUsers}
                savedUsersLoading={savedUsersLoading}
                suggestedUsersLoading={suggestedUsersLoading}
                existingConversations={existingConversations}
                pendingRequests={combinedPendingRequests}
                optimisticPendingRequests={optimisticPendingRequests}
                incomingRequestSenderIds={incomingRequestSenderIds}
                currentUserId={user?.userId}
                onChatAction={handleChatAction}
                onCancelChatRequest={handleCancelChatRequest}
                onAcceptChatRequest={handleAcceptChatRequest}
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
        <div className='hidden md:flex w-[540px] xl:w-[540px] flex-shrink-0'>
          <ProfileSidebar
            userId={profileSidebarUser.userId}
            userPresence={profileSidebarUser}
            onlineUsers={onlineUsers}
            showActionButtons={true}
            existingConversations={existingConversations}
            pendingRequests={combinedPendingRequests}
            incomingRequestSenderIds={incomingRequestSenderIds}
            onChatAction={handleChatAction}
            onCancelChatRequest={handleCancelChatRequest}
            onAcceptChatRequest={handleAcceptChatRequest}
            onClose={() => {
              setProfileSidebarOpen(false);
              setProfileSidebarUser(null);
            }}
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
