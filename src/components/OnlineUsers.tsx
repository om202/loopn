'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import type { Schema } from '../../amplify/data/resource';
import { chatService } from '../services/chat.service';
import { userService } from '../services/user.service';

import UserAvatar from './UserAvatar';
import CircularIcon from './CircularIcon';

type UserPresence = Schema['UserPresence']['type'];

interface OnlineUsersProps {
  onChatRequestSent: () => void;
}

export default function OnlineUsers({ onChatRequestSent }: OnlineUsersProps) {
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());
  const [existingConversations, setExistingConversations] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthenticator();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      return;
    }

    // Reset loading state for new user
    setInitialLoading(true);

    // Subscribe to sent chat requests for real-time updates
    const sentRequestsSubscription = chatService.observeSentChatRequests(
      user.userId,
      requests => {
        const receiverIds = requests.map(req => req.receiverId);
        setPendingRequests(new Set(receiverIds));
      },
      error => {
        console.error('Error observing sent chat requests:', error);
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
        setInitialLoading(false); // Mark as loaded after first response
        
        // Check for existing conversations with these users
        checkExistingConversations(otherUsers);
      },
      error => {
        console.error('Error observing online users:', error);
        setError('Failed to load online users');
        setInitialLoading(false); // Also mark as loaded on error
      }
    );

    return () => {
      sentRequestsSubscription.unsubscribe();
      onlineUsersSubscription.unsubscribe();
    };
  }, [user]);

  const checkExistingConversations = async (users: UserPresence[]) => {
    if (!user) return;

    const conversationMap = new Map<string, string>();
    
    for (const userPresence of users) {
      if (userPresence.userId) {
        try {
          const result = await chatService.getConversationBetweenUsers(user.userId, userPresence.userId);
          if (result.data?.id) {
            conversationMap.set(userPresence.userId, result.data.id);
          }
        } catch (error) {
          console.error('Error checking conversation:', error);
        }
      }
    }
    
    setExistingConversations(conversationMap);
  };

  const handleChatAction = async (receiverId: string) => {
    // Check if there's an existing conversation
    const conversationId = existingConversations.get(receiverId);
    
    if (conversationId) {
      // Open existing chat
      router.push(`/chat/${conversationId}`);
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
        const existingRequest = await chatService.hasPendingChatRequest(user.userId, receiverId);
        
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
          setError('You already have a pending chat request with this user');
          return;
        }

        const result = await chatService.sendChatRequest(receiverId, user.userId);

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
      } catch (error) {
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
    return (
      <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-8'>
        <div className='text-center text-gray-500'>
          <div className='w-6 h-6 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3' />
          <p>Finding professionals...</p>
        </div>
      </div>
    );
  }

  if (onlineUsers.length === 0) {
    return (
      <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-8'>
        <div className='text-center text-gray-500'>
          <div className='w-12 h-12 border-2 border-gray-300 rounded-full mx-auto mb-3 flex items-center justify-center'>
            <div className='w-6 h-6 border border-gray-300 rounded-full' />
          </div>
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
          <div
            key={userPresence.userId}
            className='flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all'
          >
            <div className='flex items-center gap-3'>
              <UserAvatar 
                email={userPresence.email}
                userId={userPresence.userId}
                size="md"
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
                        minute: '2-digit' 
                      })
                    : 'Online now'}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleChatAction(userPresence.userId)}
              disabled={pendingRequests.has(userPresence.userId)}
              className='transition-colors'
              title={
                pendingRequests.has(userPresence.userId) 
                  ? 'Chat request pending' 
                  : existingConversations.has(userPresence.userId)
                  ? 'Open chat'
                  : 'Send chat request'
              }
            >
              <CircularIcon
                size="lg"
                bgColor={
                  pendingRequests.has(userPresence.userId) 
                    ? 'bg-gray-200' 
                    : existingConversations.has(userPresence.userId)
                    ? 'bg-green-600'
                    : 'bg-indigo-600'
                }
                icon={
                  pendingRequests.has(userPresence.userId) ? (
                    <svg className='text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                  ) : existingConversations.has(userPresence.userId) ? (
                    <svg className='text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 4v-4z' />
                    </svg>
                  ) : (
                    <svg className='text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' />
                    </svg>
                  )
                }
                className={
                  pendingRequests.has(userPresence.userId) 
                    ? 'cursor-not-allowed' 
                    : existingConversations.has(userPresence.userId)
                    ? 'hover:bg-green-700 cursor-pointer'
                    : 'hover:bg-indigo-700 cursor-pointer'
                }
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
