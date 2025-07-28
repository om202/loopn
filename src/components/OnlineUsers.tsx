'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useState, useEffect } from 'react';

import type { Schema } from '../../amplify/data/resource';
import { chatService } from '../services/chat.service';
import { userService } from '../services/user.service';

type UserPresence = Schema['UserPresence']['type'];

interface OnlineUsersProps {
  onChatRequestSent: () => void;
}

export default function OnlineUsers({ onChatRequestSent }: OnlineUsersProps) {
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthenticator();

  useEffect(() => {
    if (!user) {
      return;
    }

    // Subscribe to online users updates
    const subscription = userService.observeOnlineUsers(
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
      error => {
        console.error('Error observing online users:', error);
        setError('Failed to load online users');
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const handleSendChatRequest = async (receiverId: string) => {
    if (!user) {
      return;
    }

    setLoading(true);
    const result = await chatService.sendChatRequest(receiverId, user.userId);

    if (result.error) {
      setError(result.error);
    } else {
      onChatRequestSent();
    }

    setLoading(false);
  };

  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case 'ONLINE':
        return 'bg-green-400';
      case 'BUSY':
        return 'bg-red-400';
      default:
        return 'bg-gray-400';
    }
  };

  if (error) {
    return <div className='p-4 text-red-600 bg-red-50 rounded-lg'>{error}</div>;
  }

  return (
    <div className='bg-white rounded-lg shadow-md p-6'>
      <h2 className='text-xl font-semibold text-gray-900 mb-4'>
        Online Professionals
      </h2>

      {/* Current user info */}
      <div className='mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200'>
        <div className='text-sm font-medium text-indigo-900'>
          You are online as:
        </div>
        <div className='text-sm text-indigo-700'>
          Email: {user?.signInDetails?.loginId || 'Unknown'}
        </div>
        <div className='text-sm text-indigo-700'>
          UserID: {user?.userId || 'Unknown'}
        </div>
      </div>

      {onlineUsers.length === 0 ? (
        <p className='text-gray-500 text-center py-8'>
          No professionals online at the moment
        </p>
      ) : (
        <div className='space-y-3'>
          {onlineUsers.map(userPresence => (
            <div
              key={userPresence.userId}
              className='flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors'
            >
              <div className='flex items-center space-x-3'>
                <div className='relative'>
                  <div className='w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-medium'>
                    {userPresence.userId.charAt(0).toUpperCase()}
                  </div>
                  <div
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(userPresence.status)}`}
                  />
                </div>
                <div>
                  <div className='font-medium text-gray-900'>
                    {userPresence.email ||
                      `Professional ${userPresence.userId.slice(-4)}`}
                  </div>
                  <div className='text-sm text-gray-500'>
                    UserID: {userPresence.userId.slice(-8)}
                  </div>
                  <div className='text-xs text-gray-400'>
                    Last seen:{' '}
                    {userPresence.lastSeen
                      ? new Date(userPresence.lastSeen).toLocaleTimeString()
                      : 'Unknown'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSendChatRequest(userPresence.userId)}
                disabled={loading}
                className='px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                {loading ? 'Sending...' : 'Chat'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
