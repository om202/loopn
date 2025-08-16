'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { CheckCircle2, Clock, MessageCircle } from 'lucide-react';
import UserAvatar from './UserAvatar';
import {
  formatPresenceTime,
  simplePresenceManager,
} from '../lib/presence-utils';
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
import { useChatActions } from '../hooks/useChatActions';
import { useUserCategorization } from '../hooks/useUserCategorization';
import { useOnlineUsers } from '../hooks/useOnlineUsers';
import { useConversations } from '../hooks/useConversations';
import { useNotifications } from '../hooks/useNotifications';
import { notificationService } from '../services/notification.service';
import { useSubscriptionStore } from '../stores/subscription-store';
import {
  OnlineUsers_Shimmer,
  ShimmerProvider,
  ProfileDetails_Shimmer,
} from './ShimmerLoader/exports';

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
  // Existing conversations now managed by centralized hook
  const [profileSidebarUser, setProfileSidebarUser] =
    useState<UserPresence | null>(null);
  const [profileSidebarFullProfile, setProfileSidebarFullProfile] = useState<
    Schema['UserProfile']['type'] | null
  >(null);
  const [profileSidebarUserProfile, setProfileSidebarUserProfile] = useState<{
    fullName?: string;
    email?: string;
    profilePictureUrl?: string;
    hasProfilePicture?: boolean;
  } | null>(null);
  const [profileSidebarLoading, setProfileSidebarLoading] = useState(false);

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

  // Use Zustand store for chat requests
  const {
    incomingChatRequests,
    sentChatRequests,
    subscribeToIncomingChatRequests,
    subscribeToSentChatRequests,
    setIncomingChatRequests,
  } = useSubscriptionStore();

  // Use centralized conversations
  const { getConversationByParticipant } = useConversations({
    userId: user?.userId || '',
    enabled: !!user?.userId,
  });

  // Use centralized notifications for mark all as read functionality
  const { notifications: centralizedNotifications } = useNotifications({
    userId: user?.userId || '',
    enabled: !!user?.userId,
  });

  // Subscribe to chat requests using Zustand store
  useEffect(() => {
    if (!user?.userId) return;

    const unsubscribeIncoming = subscribeToIncomingChatRequests(user.userId);
    const unsubscribeSent = subscribeToSentChatRequests(user.userId);

    return () => {
      unsubscribeIncoming();
      unsubscribeSent();
    };
  }, [
    user?.userId,
    subscribeToIncomingChatRequests,
    subscribeToSentChatRequests,
  ]);

  // Derive pending receiver IDs from sent requests
  const pendingReceiverIds = useMemo(() => {
    return new Set(
      sentChatRequests
        .filter(req => req.status === 'PENDING')
        .map(req => req.receiverId)
    );
  }, [sentChatRequests]);

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
  useEffect(() => {
    try {
      const stored = localStorage.getItem('dashboard.profileSidebarOpen');
      if (stored === 'true') {
        setProfileSidebarOpen(true);
      }
    } catch {
      // ignore
    }
  }, []);

  // Auto-select first user when sidebar is restored and users are available
  useEffect(() => {
    if (profileSidebarOpen && !profileSidebarUser && allUsers.length > 0) {
      const firstUser = allUsers[0];
      setProfileSidebarUser(firstUser);
      setProfileSidebarLoading(true);
      setProfileSidebarFullProfile(null);

      const loadProfile = async () => {
        try {
          // Use our centralized profile fetching (with caching)
          const profile = await fetchUserProfile(firstUser.userId);

          if (profile) {
            setProfileSidebarFullProfile(profile);
            setProfileSidebarUserProfile({
              fullName: profile.fullName || undefined,
              email: profile.email || undefined,
              profilePictureUrl: profile.profilePictureUrl || undefined,
              hasProfilePicture: profile.hasProfilePicture || false,
            });
          }
        } catch (e) {
          console.error('Failed to load profile summary for sidebar', e);
        } finally {
          setProfileSidebarLoading(false);
        }
      };

      loadProfile();
    }
  }, [profileSidebarOpen, profileSidebarUser, allUsers, fetchUserProfile]);

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
          const result = await userPresenceService.getUserPresence(userId);
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

    // Populate map by checking ALL users (online, offline, recently active) for existing conversations
    // This ensures that users with active conversations show "Chat" button regardless of online status
    allUsers.forEach(user => {
      const conversation = getConversationByParticipant(user.userId);
      if (conversation) {
        conversationMap.set(user.userId, conversation);
      }
    });

    return conversationMap;
  }, [allUsers, getConversationByParticipant]);

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

  // Load all users for suggested section
  useEffect(() => {
    if (!user) {
      return;
    }

    const loadSuggestedUsers = async () => {
      try {
        const result = await userPresenceService.getAllUsers();
        if (result.error) {
          console.error('Error loading suggested users:', result.error);
          return;
        }

        // Filter out current user and remove duplicates
        const filteredUsers = (result.data || []).filter(
          u => u?.userId && u.userId !== user.userId
        );
        setSuggestedUsers(filteredUsers);
      } catch (error) {
        console.error('Error loading suggested users:', error);
      }
    };

    loadSuggestedUsers();
  }, [user]);

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

  const handleAcceptChatRequest = async (requesterId: string) => {
    const chatRequest = incomingRequestsByUserId.get(requesterId);
    if (!chatRequest) {
      console.error('Chat request not found for user:', requesterId);
      return;
    }

    // Optimistic update: immediately remove from incoming requests to prevent flicker
    const optimisticIncomingRequests = incomingChatRequests.filter(
      req => req.requesterId !== requesterId
    );
    setIncomingChatRequests(optimisticIncomingRequests);

    try {
      const result = await chatService.respondToChatRequest(
        chatRequest.id,
        'ACCEPTED'
      );

      if (result.error) {
        setError(result.error);
        // Revert optimistic update on error - restore the original request
        setIncomingChatRequests(incomingChatRequests);
      } else {
        // The real-time subscription will automatically update the UI with the new conversation
        onChatRequestSent();
      }
    } catch (error) {
      console.error('Error accepting chat request:', error);
      setError('Failed to accept chat request');
      // Revert optimistic update on error - restore the original request
      setIncomingChatRequests(incomingChatRequests);
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
      const markPromises = centralizedNotifications.map(notification => {
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
    // Toggle open/close and persist only the open state; selection is ephemeral
    if (profileSidebarOpen) {
      setProfileSidebarOpen(false);
      try {
        localStorage.setItem('dashboard.profileSidebarOpen', 'false');
      } catch {
        // ignore
      }
      setProfileSidebarUser(null);
      setProfileSidebarFullProfile(null);
      setProfileSidebarLoading(false);
      return;
    }

    setProfileSidebarOpen(true);
    try {
      localStorage.setItem('dashboard.profileSidebarOpen', 'true');
    } catch {
      // ignore
    }
    setProfileSidebarUser(userPresence);
    setProfileSidebarLoading(true);
    setProfileSidebarFullProfile(null);
    setProfileSidebarUserProfile(null);
    try {
      // Use our centralized profile fetching (with caching)
      const profile = await fetchUserProfile(userPresence.userId);

      if (profile) {
        setProfileSidebarFullProfile(profile);
        setProfileSidebarUserProfile({
          fullName: profile.fullName || undefined,
          email: profile.email || undefined,
          profilePictureUrl: profile.profilePictureUrl || undefined,
          hasProfilePicture: profile.hasProfilePicture || false,
        });
      }
    } catch (e) {
      console.error('Failed to load profile summary for sidebar', e);
    } finally {
      setProfileSidebarLoading(false);
    }
  };

  const handleUserCardClick = async (userPresence: UserPresence) => {
    // If sidebar is not open, open it
    if (!profileSidebarOpen) {
      setProfileSidebarOpen(true);
      try {
        localStorage.setItem('dashboard.profileSidebarOpen', 'true');
      } catch {
        // ignore
      }
    }

    // Always update the selected user and load their profile
    setProfileSidebarUser(userPresence);
    setProfileSidebarLoading(true);
    setProfileSidebarFullProfile(null);
    setProfileSidebarUserProfile(null);
    try {
      // Use our centralized profile fetching (with caching)
      const profile = await fetchUserProfile(userPresence.userId);

      if (profile) {
        setProfileSidebarFullProfile(profile);
        setProfileSidebarUserProfile({
          fullName: profile.fullName || undefined,
          email: profile.email || undefined,
          profilePictureUrl: profile.profilePictureUrl || undefined,
          hasProfilePicture: profile.hasProfilePicture || false,
        });
      }
    } catch (e) {
      console.error('Failed to load profile summary for sidebar', e);
    } finally {
      setProfileSidebarLoading(false);
    }
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
    <div className='flex lg:gap-4 h-full pb-20 lg:pb-0'>
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

      <div className='flex-1 bg-white sm:rounded-2xl sm:border sm:border-zinc-200 p-2 sm:p-4 lg:p-6 ultra-compact overflow-hidden flex flex-col min-h-0'>
        {/* Search User - Always visible at top */}
        <div className='flex-shrink-0 mb-2 sm:mb-2'>
          <SearchUser
            onProfessionalRequest={handleProfessionalRequest}
            userProfile={currentUserProfile || undefined}
          />
        </div>

        {/* Section Header - Fixed at top */}
        <div className='flex-shrink-0 mb-4 sm:mb-5 lg:mb-6'>
          {activeSection === 'notifications' && (
            <div className='flex items-start justify-between'>
              <div>
                <h2 className='text-xl sm:text-2xl font-bold text-zinc-900 mb-1'>
                  Notifications
                </h2>
                <p className='text-sm text-zinc-500'>
                  Keep up with your latest activity
                </p>
              </div>
              {centralizedNotifications.length > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className='text-sm text-brand-500 hover:text-brand-700 font-medium py-2 px-3 rounded-lg hover:bg-brand-50 transition-colors ml-4 flex-shrink-0'
                >
                  Mark all as read
                </button>
              )}
            </div>
          )}
          {activeSection === 'help' && (
            <div>
              <h2 className='text-xl sm:text-2xl font-bold text-zinc-900 mb-1'>
                Help & Support
              </h2>
              <p className='text-sm text-zinc-500'>
                Common questions and troubleshooting
              </p>
            </div>
          )}
          {activeSection === 'account' && (
            <div className='flex items-start justify-between'>
              <div>
                <h2 className='text-xl sm:text-2xl font-bold text-zinc-900 mb-1'>
                  Account
                </h2>
                <p className='text-sm text-zinc-500'>
                  Manage your profile and settings
                </p>
              </div>
              <button
                onClick={handleSignOutClick}
                className='flex items-center gap-2 px-4 py-2.5 text-b_red-600 hover:bg-b_red-50 rounded-lg border border-b_red-200 ml-4 flex-shrink-0'
              >
                <span className='text-sm font-medium'>Log Out</span>
              </button>
            </div>
          )}
          {activeSection === 'connections' && (
            <div>
              <h2 className='text-xl sm:text-2xl font-bold text-zinc-900 mb-1'>
                Connections
              </h2>
              <p className='text-sm text-zinc-500'>Your connections</p>
            </div>
          )}
          {activeSection === 'suggested' && (
            <div>
              <h2 className='text-xl sm:text-2xl font-bold text-zinc-900 mb-1'>
                Discover
              </h2>
              <p className='text-sm text-zinc-500'>
                Find and connect with new people
              </p>
            </div>
          )}
          {activeSection === 'search' && (
            <div>
              <h2 className='text-xl sm:text-2xl font-bold text-zinc-900 mb-1'>
                Search
              </h2>
              <p className='text-sm text-zinc-500'>Search for professionals</p>
            </div>
          )}
          {activeSection === 'all' && (
            <div>
              <h2 className='text-xl sm:text-2xl font-bold text-zinc-900 mb-1'>
                Chats
              </h2>
              <p className='text-sm text-zinc-500'>Your conversations</p>
            </div>
          )}
        </div>

        <div className='relative flex-1 overflow-hidden'>
          {/* Top border - shows when scrolled down */}
          <div className='absolute top-0 left-0 right-0 h-px bg-zinc-200 opacity-0 transition-opacity duration-200 z-10 scroll-top-border'></div>

          {/* Bottom border - shows when not at bottom */}
          <div className='absolute bottom-0 left-0 right-0 h-px bg-zinc-200 opacity-0 transition-opacity duration-200 z-10 scroll-bottom-border'></div>

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
              <HelpContent />
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
                existingConversations={existingConversations}
                pendingRequests={combinedPendingRequests}
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
          <div className='bg-white rounded-2xl border border-zinc-200 w-full h-full flex flex-col relative'>

            <div className='p-6 pb-2 flex justify-center'>
              <div className='flex flex-col items-center text-center'>
                <UserAvatar
                  email={profileSidebarUserProfile?.email}
                  userId={profileSidebarUser.userId}
                  profilePictureUrl={
                    profileSidebarUserProfile?.profilePictureUrl
                  }
                  hasProfilePicture={
                    profileSidebarUserProfile?.hasProfilePicture
                  }
                  size='xl'
                  showStatus
                  status={
                    onlineUsers.find(
                      u => u.userId === profileSidebarUser.userId
                    )
                      ? 'ONLINE'
                      : profileSidebarUser.lastSeen &&
                          formatPresenceTime(profileSidebarUser.lastSeen) ===
                            'Recently active'
                        ? 'RECENTLY_ACTIVE'
                        : 'OFFLINE'
                  }
                />
                <div className='mt-2'>
                  <div className='mb-1'>
                    <div className='font-medium text-zinc-900 text-base'>
                      {profileSidebarUserProfile?.fullName ||
                        profileSidebarUserProfile?.email ||
                        `User${profileSidebarUser.userId.slice(-4)}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons section */}
            <div className='px-6 pb-6 pt-2'>
              <div className='w-full flex justify-center'>
                {(() => {
                  const conversation = existingConversations.get(
                    profileSidebarUser.userId
                  );
                  const isEndedWithTimer =
                    conversation?.chatStatus === 'ENDED' &&
                    !userCategories.canUserReconnect(
                      profileSidebarUser.userId
                    ) &&
                    userCategories.getReconnectTimeRemaining(
                      profileSidebarUser.userId
                    );

                  if (isEndedWithTimer) {
                    const timeRemaining =
                      userCategories.getReconnectTimeRemaining(
                        profileSidebarUser.userId
                      );
                    return (
                      <div className='text-sm text-center p-3 bg-zinc-50 rounded-xl border border-zinc-200'>
                        <div className='text-zinc-500 mb-1'>Reconnect in</div>
                        <div className='text-zinc-600 flex items-center justify-center gap-1'>
                          <Clock className='w-3 h-3' />
                          <span className='font-medium'>{timeRemaining}</span>
                        </div>
                      </div>
                    );
                  }

                  const isTrialConversation = existingConversations.has(profileSidebarUser.userId) &&
                    !existingConversations.get(profileSidebarUser.userId)?.isConnected;

                  return (
                    <div className='flex items-center gap-3'>
                      <button
                        onClick={() => {
                          if (
                            combinedPendingRequests.has(profileSidebarUser.userId)
                          ) {
                            handleCancelChatRequest(profileSidebarUser.userId);
                          } else {
                            handleChatAction(profileSidebarUser.userId);
                          }
                        }}
                        className='px-2 py-1.5 text-sm font-medium rounded-xl border transition-colors bg-white text-brand-500 border-brand-200 hover:bg-brand-100 hover:border-brand-300 flex items-center justify-center gap-2'
                      >
                      {combinedPendingRequests.has(
                        profileSidebarUser.userId
                      ) ? (
                        <>
                          <span className='text-zinc-600 text-sm font-medium'>
                            Cancel Request
                          </span>
                        </>
                      ) : existingConversations.has(
                          profileSidebarUser.userId
                        ) ? (
                        <>
                          {existingConversations.get(profileSidebarUser.userId)
                            ?.chatStatus === 'ENDED' ? (
                            userCategories.canUserReconnect(
                              profileSidebarUser.userId
                            ) ? (
                              <>
                                <MessageCircle className='w-4 h-4' />
                                <span className='text-sm font-medium'>
                                  Send Request
                                </span>
                              </>
                            ) : (
                              <>
                                <MessageCircle className='w-4 h-4' />
                                <span className='text-sm font-medium'>
                                  View Chat
                                </span>
                              </>
                            )
                          ) : (
                            <>
                              <MessageCircle className='w-4 h-4' />
                              <span className='text-sm font-medium'>Chat</span>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className='w-4 h-4' />
                          <span className='text-sm font-medium'>
                            Send Request
                          </span>
                        </>
                      )}
                      </button>
                      {isTrialConversation && (
                        <span className='px-2 py-1.5 text-sm font-medium text-zinc-500 rounded-xl flex-shrink-0 flex items-center gap-1'>
                          <Clock className='w-4 h-4' />
                          Trial
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className='flex-1 overflow-y-auto'>
              <div className='px-6 pb-8'>
                {profileSidebarLoading ? (
                  <ShimmerProvider>
                    <ProfileDetails_Shimmer />
                  </ShimmerProvider>
                ) : profileSidebarFullProfile ? (
                  <div className='divide-y divide-zinc-100'>
                    {/* Professional Info Section */}
                    {(profileSidebarFullProfile.jobRole ||
                      profileSidebarFullProfile.companyName ||
                      profileSidebarFullProfile.industry ||
                      profileSidebarFullProfile.yearsOfExperience !== null) && (
                      <div className='pb-4'>
                        <h4 className='text-sm font-semibold text-zinc-900 mb-4 -mx-6 px-6 py-3 bg-zinc-50'>
                          Profile Details
                        </h4>
                        <div className='divide-y divide-zinc-100'>
                          {profileSidebarFullProfile.jobRole && (
                            <div className='pb-3'>
                              <dt className='text-sm font-medium text-zinc-600 mb-1.5'>
                                Role
                              </dt>
                              <dd className='text-sm text-zinc-900 font-medium'>
                                {profileSidebarFullProfile.jobRole}
                              </dd>
                            </div>
                          )}
                          {profileSidebarFullProfile.companyName && (
                            <div className='py-3'>
                              <dt className='text-sm font-medium text-zinc-600 mb-1.5'>
                                Company
                              </dt>
                              <dd className='text-sm text-zinc-900 font-medium'>
                                {profileSidebarFullProfile.companyName}
                              </dd>
                            </div>
                          )}
                          {profileSidebarFullProfile.industry && (
                            <div className='py-3'>
                              <dt className='text-sm font-medium text-zinc-600 mb-1.5'>
                                Industry
                              </dt>
                              <dd className='text-sm text-zinc-900 font-medium'>
                                {profileSidebarFullProfile.industry}
                              </dd>
                            </div>
                          )}
                          {profileSidebarFullProfile.yearsOfExperience !==
                            null &&
                            profileSidebarFullProfile.yearsOfExperience !==
                              undefined && (
                              <div className='pt-3'>
                                <dt className='text-sm font-medium text-zinc-600 mb-1.5'>
                                  Experience
                                </dt>
                                <dd className='text-sm text-zinc-900 font-medium'>
                                  {profileSidebarFullProfile.yearsOfExperience}{' '}
                                  years
                                </dd>
                              </div>
                            )}
                        </div>
                      </div>
                    )}

                    {/* Education Section */}
                    {profileSidebarFullProfile.education && (
                      <div className='py-4'>
                        <h4 className='text-sm font-semibold text-zinc-900 mb-4'>
                          Education
                        </h4>
                        <div className='text-sm text-zinc-900 font-medium leading-relaxed'>
                          {profileSidebarFullProfile.education}
                        </div>
                      </div>
                    )}

                    {/* About Section */}
                    {profileSidebarFullProfile.about && (
                      <div className='py-4'>
                        <h4 className='text-sm font-semibold text-zinc-900 mb-4'>
                          About
                        </h4>
                        <div className='text-sm text-zinc-900 leading-relaxed'>
                          {profileSidebarFullProfile.about}
                        </div>
                      </div>
                    )}

                    {/* Skills & Interests Section */}
                    {((profileSidebarFullProfile.skills &&
                      profileSidebarFullProfile.skills.length > 0) ||
                      (profileSidebarFullProfile.interests &&
                        profileSidebarFullProfile.interests.length > 0)) && (
                      <div className='pt-4'>
                        <h4 className='text-sm font-semibold text-zinc-900 mb-4'>
                          Skills & Interests
                        </h4>
                        <div className='divide-y divide-zinc-100'>
                          {profileSidebarFullProfile.skills &&
                            profileSidebarFullProfile.skills.length > 0 && (
                              <div className='pb-3'>
                                <dt className='text-sm font-medium text-zinc-600 mb-3'>
                                  Skills
                                </dt>
                                <dd className='flex flex-wrap gap-2'>
                                  {profileSidebarFullProfile.skills.map(
                                    (skill, index) => (
                                      <span
                                        key={index}
                                        className='px-3 py-1.5 text-sm bg-brand-50 text-brand-700 rounded-lg font-medium'
                                      >
                                        {skill}
                                      </span>
                                    )
                                  )}
                                </dd>
                              </div>
                            )}
                          {profileSidebarFullProfile.interests &&
                            profileSidebarFullProfile.interests.length > 0 && (
                              <div className='pt-3'>
                                <dt className='text-sm font-medium text-zinc-600 mb-3'>
                                  Interests
                                </dt>
                                <dd className='flex flex-wrap gap-2'>
                                  {profileSidebarFullProfile.interests.map(
                                    (interest, index) => (
                                      <span
                                        key={index}
                                        className='px-3 py-1.5 text-sm bg-b_green-50 text-b_green-700 rounded-lg font-medium'
                                      >
                                        {interest}
                                      </span>
                                    )
                                  )}
                                </dd>
                              </div>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className='text-sm text-zinc-500 text-center py-8'>
                    No profile details available.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
