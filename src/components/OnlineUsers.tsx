'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { CheckCircle2, Clock, MessageCircle } from 'lucide-react';
import UserAvatar from './UserAvatar';
import { formatPresenceTime } from '../lib/presence-utils';

import type { Schema } from '../../amplify/data/resource';
import { chatService } from '../services/chat.service';
import { userPresenceService } from '../services/user.service';

import {
  DashboardSidebar,
  DashboardSectionContent,
  NotificationsContent,
  AccountContent,
} from './dashboard';
import LoadingContainer from './LoadingContainer';
import SearchUser from './SearchUser';
import { useChatActions } from '../hooks/useChatActions';
import { useUserCategorization } from '../hooks/useUserCategorization';
import { useRealtimeOnlineUsers } from '../hooks/realtime';
import { useChatRequests } from '../hooks/realtime/useChatRequests';
import { useRealtime } from '../contexts/RealtimeContext';

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
  | 'notifications'
  | 'account';

export default function OnlineUsers({
  onChatRequestSent,
  onProfessionalRequest,
}: OnlineUsersProps) {
  const [allUsers, setAllUsers] = useState<UserPresence[]>([]);
  const [existingConversations, setExistingConversations] = useState<
    Map<string, Conversation>
  >(new Map());
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
  const [profileSidebarOpen, setProfileSidebarOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [, setConversationsLoaded] = useState(false);
  const [activeSection, setActiveSection] =
    useState<SidebarSection>('suggested');
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
          const { UserProfileService } = await import(
            '../services/user-profile.service'
          );
          const [profileDetails, profileResult] = await Promise.all([
            UserProfileService.getProfileDetails(firstUser.userId),
            new UserProfileService().getUserProfile(firstUser.userId),
          ]);
          setProfileSidebarFullProfile(profileDetails);
          setProfileSidebarUserProfile(
            profileResult.data
              ? {
                  fullName: profileResult.data.fullName || undefined,
                  email: profileResult.data.email || undefined,
                  profilePictureUrl:
                    profileResult.data.profilePictureUrl || undefined,
                  hasProfilePicture:
                    profileResult.data.hasProfilePicture || false,
                }
              : null
          );
        } catch (e) {
          console.error('Failed to load profile summary for sidebar', e);
        } finally {
          setProfileSidebarLoading(false);
        }
      };

      loadProfile();
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
      const { UserProfileService } = await import(
        '../services/user-profile.service'
      );
      const [profileDetails, profileResult] = await Promise.all([
        UserProfileService.getProfileDetails(userPresence.userId),
        new UserProfileService().getUserProfile(userPresence.userId),
      ]);
      setProfileSidebarFullProfile(profileDetails);
      setProfileSidebarUserProfile(
        profileResult.data
          ? {
              fullName: profileResult.data.fullName || undefined,
              email: profileResult.data.email || undefined,
              profilePictureUrl:
                profileResult.data.profilePictureUrl || undefined,
              hasProfilePicture: profileResult.data.hasProfilePicture || false,
            }
          : null
      );
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
      const { UserProfileService } = await import(
        '../services/user-profile.service'
      );
      const [profileDetails, profileResult] = await Promise.all([
        UserProfileService.getProfileDetails(userPresence.userId),
        new UserProfileService().getUserProfile(userPresence.userId),
      ]);
      setProfileSidebarFullProfile(profileDetails);
      setProfileSidebarUserProfile(
        profileResult.data
          ? {
              fullName: profileResult.data.fullName || undefined,
              email: profileResult.data.email || undefined,
              profilePictureUrl:
                profileResult.data.profilePictureUrl || undefined,
              hasProfilePicture: profileResult.data.hasProfilePicture || false,
            }
          : null
      );
    } catch (e) {
      console.error('Failed to load profile summary for sidebar', e);
    } finally {
      setProfileSidebarLoading(false);
    }
  };

  if (error || onlineUsersError || sentRequestsError || chatActions.error) {
    return (
      <div className='p-4 sm:p-6 text-b_red-500 bg-b_red-100 rounded-2xl border border-b_red-200 text-center'>
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
        <div className='flex-shrink-0 mb-4 sm:mb-6'>
          <SearchUser onProfessionalRequest={onProfessionalRequest} />
        </div>

        <div className='overflow-y-auto flex-1'>
          {activeSection === 'notifications' ? (
            <NotificationsContent />
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
              onChatAction={handleChatAction}
              onCancelChatRequest={handleCancelChatRequest}
              canUserReconnect={userCategories.canUserReconnect}
              getReconnectTimeRemaining={
                userCategories.getReconnectTimeRemaining
              }
              onOpenProfileSidebar={handleOpenProfileSidebar}
              onUserCardClick={handleUserCardClick}
              isProfileSidebarOpen={profileSidebarOpen}
              selectedUserId={profileSidebarUser?.userId}
            />
          )}
        </div>
      </div>

      {/* Right push sidebar: desktop only */}
      {profileSidebarOpen && profileSidebarUser && (
        <div className='hidden md:flex w-[340px] xl:w-[350px] flex-shrink-0'>
          <div className='bg-white rounded-2xl border border-zinc-200 w-full h-full flex flex-col relative'>
            {/* Trial indicator - top right corner */}
            {existingConversations.has(profileSidebarUser.userId) &&
              !existingConversations.get(profileSidebarUser.userId)
                ?.isConnected && (
                <div className='absolute top-4 right-4 z-10'>
                  <span className='px-1.5 py-0.5 text-xs border border-zinc-200 text-zinc-500 rounded-full flex-shrink-0 flex items-center gap-1'>
                    <Clock className='w-3 h-3' />
                    Trial
                  </span>
                </div>
              )}

            <div className='p-6 pb-4 flex justify-center'>
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
                  size='lg'
                  showStatus
                  status={
                    onlineUsers.find(
                      u => u.userId === profileSidebarUser.userId
                    )
                      ? profileSidebarUser.status
                      : profileSidebarUser.lastSeen &&
                          formatPresenceTime(profileSidebarUser.lastSeen) ===
                            'Recently active'
                        ? 'RECENTLY_ACTIVE'
                        : 'OFFLINE'
                  }
                />
                <div className='mt-4'>
                  <div className='mb-1'>
                    <div className='font-medium text-zinc-900 text-base'>
                      {profileSidebarUserProfile?.fullName ||
                        profileSidebarUserProfile?.email ||
                        `User${profileSidebarUser.userId.slice(-4)}`}
                    </div>
                  </div>
                  <div className='text-sm text-zinc-500'>
                    {onlineUsers.find(
                      u => u.userId === profileSidebarUser.userId
                    )
                      ? 'Online now'
                      : profileSidebarUser.lastSeen
                        ? formatPresenceTime(profileSidebarUser.lastSeen)
                        : 'Offline'}
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons section */}
            <div className='px-6 pb-6'>
              <div className='w-full'>
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

                  return (
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
                      className='w-full px-4 py-2.5 text-sm font-medium rounded-xl border transition-colors bg-white text-brand-500 border-zinc-200 hover:bg-brand-100 hover:border-zinc-200 flex items-center justify-center gap-2'
                    >
                      {combinedPendingRequests.has(
                        profileSidebarUser.userId
                      ) ? (
                        <>
                          <span className='text-zinc-600'>Cancel Request</span>
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
                                <span>Send Request</span>
                              </>
                            ) : (
                              <>
                                <MessageCircle className='w-4 h-4' />
                                <span>View Chat</span>
                              </>
                            )
                          ) : (
                            <>
                              <MessageCircle className='w-4 h-4' />
                              <span>Chat</span>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className='w-4 h-4' />
                          <span>Start Trial</span>
                        </>
                      )}
                    </button>
                  );
                })()}
              </div>
            </div>

            <div className='flex-1 overflow-y-auto'>
              <div className='px-6'>
                {profileSidebarLoading ? (
                  <div className='flex flex-col items-center gap-3 text-sm text-zinc-500'>
                    <div className='w-4 h-4 bg-zinc-100 rounded-full animate-pulse'></div>
                    <span className='text-center'>
                      Loading profile details...
                    </span>
                  </div>
                ) : profileSidebarFullProfile ? (
                  <div className='text-sm text-zinc-900 leading-relaxed rounded-lg px-3 py-2 bg-zinc-100 space-y-3'>
                    <div className='mb-2 font-semibold'>Profile Details</div>
                    {profileSidebarFullProfile.fullName && (
                      <div>
                        <span className='text-xs font-medium text-zinc-500'>Name:</span>
                        <p className='text-sm text-zinc-700'>{profileSidebarFullProfile.fullName}</p>
                      </div>
                    )}
                    {profileSidebarFullProfile.jobRole && (
                      <div>
                        <span className='text-xs font-medium text-zinc-500'>Role:</span>
                        <p className='text-sm text-zinc-700'>{profileSidebarFullProfile.jobRole}</p>
                      </div>
                    )}
                    {profileSidebarFullProfile.companyName && (
                      <div>
                        <span className='text-xs font-medium text-zinc-500'>Company:</span>
                        <p className='text-sm text-zinc-700'>{profileSidebarFullProfile.companyName}</p>
                      </div>
                    )}
                    {profileSidebarFullProfile.industry && (
                      <div>
                        <span className='text-xs font-medium text-zinc-500'>Industry:</span>
                        <p className='text-sm text-zinc-700'>{profileSidebarFullProfile.industry}</p>
                      </div>
                    )}
                    {profileSidebarFullProfile.yearsOfExperience !== null && profileSidebarFullProfile.yearsOfExperience !== undefined && (
                      <div>
                        <span className='text-xs font-medium text-zinc-500'>Experience:</span>
                        <p className='text-sm text-zinc-700'>{profileSidebarFullProfile.yearsOfExperience} years</p>
                      </div>
                    )}
                    {profileSidebarFullProfile.education && (
                      <div>
                        <span className='text-xs font-medium text-zinc-500'>Education:</span>
                        <p className='text-sm text-zinc-700'>{profileSidebarFullProfile.education}</p>
                      </div>
                    )}
                    {profileSidebarFullProfile.about && (
                      <div>
                        <span className='text-xs font-medium text-zinc-500'>About:</span>
                        <p className='text-sm text-zinc-700'>{profileSidebarFullProfile.about}</p>
                      </div>
                    )}
                    {profileSidebarFullProfile.interests && profileSidebarFullProfile.interests.length > 0 && (
                      <div>
                        <span className='text-xs font-medium text-zinc-500'>Interests:</span>
                        <p className='text-sm text-zinc-700'>{profileSidebarFullProfile.interests.join(', ')}</p>
                      </div>
                    )}
                    {profileSidebarFullProfile.skills && profileSidebarFullProfile.skills.length > 0 && (
                      <div>
                        <span className='text-xs font-medium text-zinc-500'>Skills:</span>
                        <p className='text-sm text-zinc-700'>{profileSidebarFullProfile.skills.join(', ')}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className='text-sm text-zinc-900 leading-relaxed rounded-lg px-3 py-2 bg-zinc-50 text-center'>
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
