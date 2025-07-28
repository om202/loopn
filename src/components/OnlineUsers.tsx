'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
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

  const checkExistingConversations = useCallback(
    async (users: UserPresence[]) => {
      if (!user) {
        setConversationsLoaded(true);
        return;
      }

      const conversationMap = new Map<string, string>();

      // Use Promise.all instead of await in loop
      const conversationPromises = users.map(async userPresence => {
        if (userPresence.userId) {
          try {
            const result = await chatService.getConversationBetweenUsers(
              user.userId,
              userPresence.userId
            );
            if (result.data?.id) {
              return {
                userId: userPresence.userId,
                conversationId: result.data.id,
              };
            }
          } catch {
            console.error(
              'Error checking conversation for user:',
              userPresence.userId
            );
          }
        }
        return null;
      });

      const results = await Promise.all(conversationPromises);
      results.forEach(result => {
        if (result) {
          conversationMap.set(result.userId, result.conversationId);
        }
      });

      setExistingConversations(conversationMap);
      setConversationsLoaded(true);
    },
    [user]
  );

  useEffect(() => {
    if (!user) {
      return;
    }

    // Reset loading state for new user
    setInitialLoading(true);
    setPendingRequestsLoaded(false);
    setConversationsLoaded(false);

    // Subscribe to sent chat requests for real-time updates
    const sentRequestsSubscription = chatService.observeSentChatRequests(
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
    const onlineUsersSubscription = userService.observeOnlineUsers(
      users => {
        // Filter out current user and remove duplicates
        const otherUsers = users
          .filter(u => u?.userId && u.userId !== user.userId)
          .filter(
            (user, index, self) =>
              index === self.findIndex(u => u.userId === user.userId)
          );

        setOnlineUsers(otherUsers);

        // Check for existing conversations with these users
        checkExistingConversations(otherUsers);
      },
      () => {
        console.error('Error observing online users');
        setError('Failed to load online users');
        setInitialLoading(false); // Also mark as loaded on error
      }
    );

    return () => {
      sentRequestsSubscription.unsubscribe();
      onlineUsersSubscription.unsubscribe();
    };
  }, [user, checkExistingConversations]);

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

  if (onlineUsers.length === 0) {
    return (
      <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-8'>
        <div className='text-center text-gray-500'>
          <p>No one online right now</p>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-xl shadow-sm border border-gray-100'>
      <div className='p-4 border-b border-gray-100'>
        <div className='flex items-center gap-2 text-gray-900'>
          <span className='font-medium'>Online ({onlineUsers.length})</span>
        </div>
      </div>

      <div className='p-4 space-y-3'>
        {onlineUsers.map(userPresence => (
          <button
            key={userPresence.userId}
            onClick={() => handleChatAction(userPresence.userId)}
            className='flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer w-full text-left'
          >
            <div className='flex items-center gap-3'>
              <UserAvatar
                email={userPresence.email}
                userId={userPresence.userId}
                size='md'
                showStatus
                status={userPresence.status}
              />
              <div>
                <div className='font-medium text-gray-900 text-base'>
                  {getDisplayName(userPresence)}
                </div>
                <div className='text-sm text-gray-500'>
                  {userPresence.lastSeen
                    ? new Date(userPresence.lastSeen).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Online now'}
                </div>
              </div>
            </div>

            <div className='text-sm text-gray-500 font-medium'>
              {pendingRequests.has(userPresence.userId)
                ? 'Pending Chat Request'
                : existingConversations.has(userPresence.userId)
                  ? 'Chat Now'
                  : 'Send Chat Request'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
