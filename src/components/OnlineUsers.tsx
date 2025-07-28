'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useState, useEffect } from 'react';

import type { Schema } from '../../amplify/data/resource';
import { chatService } from '../services/chat.service';
import { userService } from '../services/user.service';

import UserAvatar from './UserAvatar';

type UserPresence = Schema['UserPresence']['type'];

interface OnlineUsersProps {
  onChatRequestSent: () => void;
}

export default function OnlineUsers({ onChatRequestSent }: OnlineUsersProps) {
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthenticator();

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
                <div className='font-medium text-gray-900 text-sm'>
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
              onClick={() => handleSendChatRequest(userPresence.userId)}
              disabled={pendingRequests.has(userPresence.userId)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                pendingRequests.has(userPresence.userId)
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
              title={pendingRequests.has(userPresence.userId) ? 'Chat request pending' : 'Start chat'}
            >
              {pendingRequests.has(userPresence.userId) ? 'Pending' : 'Chat'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
