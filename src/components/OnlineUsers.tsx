'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import {
  MessageCircle,
  Clock,
  CheckCircle2,
  Globe,
  WifiOff,
  Users,
  Timer,
  Calendar,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import type { Schema } from '../../amplify/data/resource';
import { createShortChatUrl } from '../lib/url-utils';
import { formatPresenceTime } from '../lib/presence-utils';
import { chatService } from '../services/chat.service';
import { userService } from '../services/user.service';

import LoadingContainer from './LoadingContainer';
import UserAvatar from './UserAvatar';

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
  // Calculate reconnectable users directly in render to avoid infinite requests
  const { user } = useAuthenticator();
  const router = useRouter();

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

  // Helper function to check if a user can reconnect (no backend calls)
  const canUserReconnect = (userId: string): boolean => {
    const conversation = existingConversations.get(userId);
    if (
      !conversation ||
      conversation.chatStatus !== 'ENDED' ||
      !conversation.endedAt
    ) {
      return false;
    }

    // Check if restriction period has ended (3 minutes for testing)
    const endedDate = new Date(conversation.endedAt);
    // TODO: when deploying change to 2 weeks (14 * 24 * 60 * 60 * 1000)
    const canReconnectAt = new Date(endedDate.getTime() + 3 * 60 * 1000); // 3 minutes for testing

    return new Date() >= canReconnectAt;
  };

  // Helper function to get reconnection time remaining
  const getReconnectTimeRemaining = (userId: string): string | null => {
    const conversation = existingConversations.get(userId);
    if (
      !conversation ||
      conversation.chatStatus !== 'ENDED' ||
      !conversation.endedAt
    ) {
      return null;
    }

    const endedDate = new Date(conversation.endedAt);
    // TODO: when deploying change to 2 weeks (14 * 24 * 60 * 60 * 1000)
    const canReconnectAt = new Date(endedDate.getTime() + 3 * 60 * 1000); // 3 minutes for testing
    const now = new Date();

    if (now >= canReconnectAt) {
      return null; // Can reconnect now
    }

    const timeRemaining = canReconnectAt.getTime() - now.getTime();
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

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
    // Do nothing if there's already a pending request
    if (pendingRequests.has(receiverId)) {
      return;
    }

    // Check if there's an existing conversation
    const conversation = existingConversations.get(receiverId);

    if (conversation) {
      // If this is a reconnectable ended chat, send a new chat request
      if (conversation.chatStatus === 'ENDED' && canUserReconnect(receiverId)) {
        handleSendChatRequest(receiverId);
        return;
      }

      // Open existing chat with short URL
      router.push(createShortChatUrl(conversation.id));
      return;
    }

    // Send new chat request
    handleSendChatRequest(receiverId);
  };

  const handleSendChatRequest = async (receiverId: string) => {
    if (!user) {
      return;
    }

    // Optimistic update - immediately show pending state
    setPendingRequests(prev => new Set([...prev, receiverId]));

    // Do the API calls in the background without blocking UI
    (async () => {
      try {
        // Check if there's already a pending request
        const existingRequest = await chatService.hasPendingChatRequest(
          user.userId,
          receiverId
        );

        if (existingRequest.error) {
          // Revert optimistic update
          setPendingRequests(prev => {
            const newSet = new Set(prev);
            newSet.delete(receiverId);
            return newSet;
          });
          setError(existingRequest.error);
          return;
        }

        if (existingRequest.data) {
          // Don't revert - they already have a pending request
          return;
        }

        const result = await chatService.sendChatRequest(
          receiverId,
          user.userId
        );

        if (result.error) {
          // Revert optimistic update on error
          setPendingRequests(prev => {
            const newSet = new Set(prev);
            newSet.delete(receiverId);
            return newSet;
          });
          setError(result.error);
        } else {
          onChatRequestSent();
          // Keep optimistic update - subscription will sync
        }
      } catch {
        // Revert optimistic update on any error
        setPendingRequests(prev => {
          const newSet = new Set(prev);
          newSet.delete(receiverId);
          return newSet;
        });
        setError('Failed to send chat request');
      }
    })();
  };

  const handleCancelChatRequest = async (receiverId: string) => {
    if (!user) {
      return;
    }

    // Optimistic update - immediately remove pending state
    setPendingRequests(prev => {
      const newSet = new Set(prev);
      newSet.delete(receiverId);
      return newSet;
    });

    try {
      const result = await chatService.cancelChatRequest(user.userId, receiverId);

      if (result.error) {
        // Revert optimistic update on error
        setPendingRequests(prev => new Set([...prev, receiverId]));
        setError(result.error);
      }
      // On success, keep the optimistic update
    } catch {
      // Revert optimistic update on any error
      setPendingRequests(prev => new Set([...prev, receiverId]));
      setError('Failed to cancel chat request');
    }
  };



  const getDisplayName = (userPresence: UserPresence) => {
    if (userPresence.email) {
      return userPresence.email;
    }
    return `User${userPresence.userId.slice(-4)}`;
  };

  // Helper functions to categorize users
  const getOnlineUsers = () => {
    return onlineUsers;
  };

  const getConnectionUsers = () => {
    // For now, connections is empty since we only have chat trials
    // When permanent connections are implemented, this will filter for permanent connections
    return [];
  };

  const getActiveChatTrialUsers = () => {
    return allUsers.filter(user => {
      const conversation = existingConversations.get(user.userId);
      return conversation && conversation.chatStatus === 'ACTIVE';
    });
  };

  const getEndedChatTrialUsers = () => {
    return allUsers.filter(user => {
      const conversation = existingConversations.get(user.userId);
      return conversation && conversation.chatStatus === 'ENDED';
    });
  };

  if (error) {
    return (
      <div className='p-4 sm:p-6 text-red-600 bg-red-50 rounded-2xl border border-red-200 text-center'>
        <div className='text-xs sm:text-sm font-medium mb-1'>Error</div>
        <div className='text-xs sm:text-sm'>{error}</div>
      </div>
    );
  }

  if (initialLoading) {
    return <LoadingContainer />;
  }

  // Helper function to render user cards
  const renderUserCard = (userPresence: UserPresence) => {
    const isOnline = onlineUsers.some(
      ou => ou.userId === userPresence.userId
    );

    return (
      <div
        key={userPresence.userId}
        className='bg-white rounded-2xl border border-gray-200 px-6 py-4 group hover:shadow-sm transition-shadow'
      >
        <div className='flex items-center gap-4'>
          <div className='flex-shrink-0'>
            <UserAvatar
              email={userPresence.email}
              userId={userPresence.userId}
              size='md'
              showStatus
              status={
                isOnline
                  ? userPresence.status
                  : userPresence.lastSeen &&
                      formatPresenceTime(userPresence.lastSeen) ===
                        'Recently active'
                    ? 'RECENTLY_ACTIVE'
                    : 'OFFLINE'
              }
            />
          </div>

          <div className='flex-1 min-w-0'>
            <div className='font-medium text-gray-900 text-sm mb-1 line-clamp-2 no-email-detection break-words'>
              {getDisplayName(userPresence)}
            </div>
            <div
              className={`text-xs ${
                existingConversations.has(userPresence.userId) &&
                existingConversations.get(userPresence.userId)
                  ?.chatStatus === 'ENDED'
                  ? canUserReconnect(userPresence.userId)
                    ? 'text-blue-600'
                    : 'text-orange-600'
                  : isOnline
                    ? 'text-green-600'
                    : userPresence.lastSeen &&
                        formatPresenceTime(userPresence.lastSeen) ===
                          'Recently active'
                      ? 'text-sky-500'
                      : 'text-gray-600'
              }`}
            >
              {existingConversations.has(userPresence.userId) &&
              existingConversations.get(userPresence.userId)
                ?.chatStatus === 'ENDED'
                ? canUserReconnect(userPresence.userId)
                  ? 'Can Reconnect Now'
                  : 'Chat Trial Ended'
                : isOnline
                  ? 'Online now'
                  : userPresence.lastSeen
                    ? formatPresenceTime(userPresence.lastSeen)
                    : 'Offline'}
            </div>
          </div>

          <div className='flex-shrink-0'>
            {(() => {
              const conversation = existingConversations.get(userPresence.userId);
              const isEndedWithTimer = conversation?.chatStatus === 'ENDED' && 
                !canUserReconnect(userPresence.userId) && 
                getReconnectTimeRemaining(userPresence.userId);
              
              if (isEndedWithTimer) {
                const timeRemaining = getReconnectTimeRemaining(userPresence.userId);
                return (
                  <div className='text-sm text-gray-500'>
                    Can reconnect in {timeRemaining}
                  </div>
                );
              }
              
              return (
                <button 
                  onClick={() => {
                    if (pendingRequests.has(userPresence.userId)) {
                      handleCancelChatRequest(userPresence.userId);
                    } else {
                      handleChatAction(userPresence.userId);
                    }
                  }}
                  className='px-3 py-1.5 text-xs font-medium rounded-full border transition-colors bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 flex items-center gap-1'
                >
              {pendingRequests.has(userPresence.userId) ? (
                <>
                  <Trash2 className='w-4 h-4 mr-1 text-red-600' />
                  <span className='text-red-600'>Cancel Chat Request</span>
                </>
                              ) : existingConversations.has(userPresence.userId) ? (
                  <>
                    <MessageCircle className='w-4 h-4 text-gray-600 mr-1' />
                    {existingConversations.get(userPresence.userId)
                      ?.chatStatus === 'ENDED'
                      ? canUserReconnect(userPresence.userId)
                        ? 'Send New Request'
                        : (() => {
                            const timeRemaining = getReconnectTimeRemaining(userPresence.userId);
                            return timeRemaining ? `Can reconnect in ${timeRemaining}` : 'View';
                          })()
                      : 'Chat'}
                  </>
                ) : (
                <>
                  <CheckCircle2 className='w-3 h-3 text-gray-600' />
                  Start
                </>
              )}
                </button>
              );
            })()}
          </div>
        </div>
      </div>
    );
  };

  const getSectionContent = () => {
    switch (activeSection) {
      case 'online':
        const onlineUsers = getOnlineUsers();
        return (
          <div>
            <div className='mb-4'>
              <h2 className='text-lg font-semibold text-gray-900 mb-2'>Online Now</h2>
              <p className='text-sm text-gray-600'>All users currently online</p>
            </div>
            <div className='space-y-3'>
              {onlineUsers.map(renderUserCard)}
            </div>
          </div>
        );

      case 'connections':
        const connectionUsers = getConnectionUsers();
        return (
          <div>
            <div className='mb-4'>
              <h2 className='text-lg font-semibold text-gray-900 mb-2'>Connections</h2>
              <p className='text-sm text-gray-600'>Your permanent connections</p>
            </div>
            <div className='space-y-3'>
              {connectionUsers.map(renderUserCard)}
            </div>
          </div>
        );

      case 'chat-trial':
        const activeChatTrials = getActiveChatTrialUsers();
        const endedChatTrials = getEndedChatTrialUsers();
        return (
          <div>
            <div className='mb-6'>
              <h2 className='text-lg font-semibold text-gray-900 mb-2'>Chat Trials</h2>
              <p className='text-sm text-gray-600'>Manage your active and ended chat trials</p>
            </div>

            {/* Active Chat Trials */}
            <div className='mb-8'>
              <div className='flex items-center gap-2 mb-4'>
                <Timer className='w-5 h-5 text-gray-600' />
                <h3 className='text-md font-medium text-gray-900'>Active Chat Trials</h3>
                <span className='text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full'>
                  {activeChatTrials.length}
                </span>
              </div>
              <div className='space-y-3 mb-6'>
                {activeChatTrials.map(renderUserCard)}
              </div>
            </div>

            {/* Ended Chat Trials */}
            <div>
              <div className='flex items-center gap-2 mb-4'>
                <Calendar className='w-5 h-5 text-gray-600' />
                <h3 className='text-md font-medium text-gray-900'>Ended Chat Trials</h3>
                <span className='text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full'>
                  {endedChatTrials.length}
                </span>
              </div>
              <div className='space-y-3'>
                {endedChatTrials.map(renderUserCard)}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className='flex gap-6'>
      {/* Sidebar */}
      <div className='w-64 flex-shrink-0'>
        <div className='bg-white rounded-2xl border border-gray-200 p-4'>
          <h2 className='text-lg font-semibold text-gray-900 mb-4'>Dashboard</h2>
          
          <nav className='space-y-2'>
            <button
              onClick={() => setActiveSection('online')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                activeSection === 'online'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Globe className='w-4 h-4' />
              <span className='font-medium'>Online Now</span>
              <span className='ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full'>
                {getOnlineUsers().length}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('connections')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                activeSection === 'connections'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <MessageCircle className='w-4 h-4' />
              <span className='font-medium'>Connections</span>
              <span className='ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full'>
                {getConnectionUsers().length}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('chat-trial')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                activeSection === 'chat-trial'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Timer className='w-4 h-4' />
              <span className='font-medium'>Chat Trials</span>
              <span className='ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full'>
                {getActiveChatTrialUsers().length + getEndedChatTrialUsers().length}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className='flex-1'>
        {getSectionContent()}
      </div>
    </div>
  );
}
