'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import type { Schema } from '../../amplify/data/resource';
import { createShortChatUrl } from '../lib/url-utils';
import { chatService } from '../services/chat.service';
import { userService } from '../services/user.service';

import LoadingContainer from './LoadingContainer';
import UserAvatar from './UserAvatar';

type UserPresence = Schema['UserPresence']['type'];

interface OnlineUsersProps {
  onChatRequestSent: () => void;
}

export default function OnlineUsers({ onChatRequestSent }: OnlineUsersProps) {
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [allUsers, setAllUsers] = useState<UserPresence[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(
    new Set()
  );
  const [existingConversations, setExistingConversations] = useState<
    Map<string, string>
  >(new Map());
  const [error, setError] = useState<string | null>(null);
  const [pendingRequestsLoaded, setPendingRequestsLoaded] = useState(false);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
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
      const conversationMap = new Map<string, string>();
      const userIds = new Set<string>();

      // Extract participant IDs and conversation mappings
      conversations.forEach(conv => {
        const otherUserId =
          conv.participant1Id === user.userId
            ? conv.participant2Id
            : conv.participant1Id;
        if (otherUserId) {
          conversationMap.set(otherUserId, conv.id);
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
  }, [user]);

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
    const conversationId = existingConversations.get(receiverId);

    if (conversationId) {
      // Open existing chat with short URL
      router.push(createShortChatUrl(conversationId));
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

  const getDisplayName = (userPresence: UserPresence) => {
    if (userPresence.email) {
      return userPresence.email;
    }
    return `User${userPresence.userId.slice(-4)}`;
  };

  if (error) {
    return (
      <div className='p-4 text-red-600 bg-red-50 rounded-xl border border-red-200 text-center'>
        <div className='text-sm font-medium mb-1'>Error</div>
        <div className='text-sm'>{error}</div>
      </div>
    );
  }

  if (initialLoading) {
    return <LoadingContainer />;
  }

  if (allUsers.length === 0) {
    return (
      <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-8'>
        <div className='text-center text-gray-500'>
          <p>No users or conversations</p>
        </div>
      </div>
    );
  }

  const getTitle = () => {
    return `Chats - ${allUsers.length}`;
  };

  return (
    <div>
      <div className='mb-6'>
        <h2 className='text-lg font-semibold text-gray-900'>{getTitle()}</h2>
      </div>

      <div className='space-y-4'>
        {allUsers.map(userPresence => (
          <div
            key={userPresence.userId}
            onClick={() => handleChatAction(userPresence.userId)}
            className='flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all cursor-pointer bg-white'
          >
            <div className='flex items-center gap-4'>
              <UserAvatar
                email={userPresence.email}
                userId={userPresence.userId}
                size='md'
                showStatus
                status={
                  onlineUsers.some(ou => ou.userId === userPresence.userId)
                    ? userPresence.status
                    : 'OFFLINE'
                }
              />
              <div>
                <div className='font-medium text-gray-900 text-base'>
                  {getDisplayName(userPresence)}
                </div>
                <div className='text-sm text-gray-600'>
                  {onlineUsers.some(ou => ou.userId === userPresence.userId)
                    ? 'Online now'
                    : 'Offline'}
                </div>
              </div>
            </div>

            <div className='text-sm text-gray-600 font-medium'>
              {pendingRequests.has(userPresence.userId)
                ? 'Pending'
                : existingConversations.has(userPresence.userId)
                  ? 'Open Chat'
                  : 'Connect'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
