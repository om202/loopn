'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useState, useEffect } from 'react';

import type { Schema } from '../../amplify/data/resource';
import { chatService } from '../services/chat.service';
import { userService } from '../services/user.service';

import UserAvatar from './UserAvatar';

type ChatRequest = Schema['ChatRequest']['type'];

interface ChatRequestsProps {
  onRequestAccepted: (chatRequest: ChatRequest) => void;
}

interface ChatRequestWithUser extends ChatRequest {
  requesterEmail?: string;
}

export default function ChatRequests({ onRequestAccepted }: ChatRequestsProps) {
  const [chatRequests, setChatRequests] = useState<ChatRequestWithUser[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthenticator();

  useEffect(() => {
    if (!user) {
      return;
    }

    // Subscribe to incoming chat requests
    const subscription = chatService.observeChatRequests(
      user.userId,
      async requests => {
        // Fetch user details for each request
        const requestsWithUsers = await Promise.all(
          requests.map(async request => {
            const userResult = await userService.getUserPresence(
              request.requesterId
            );
            return {
              ...request,
              requesterEmail: userResult.data?.email || undefined,
            };
          })
        );
        setChatRequests(requestsWithUsers);
      },
      error => {
        console.error('Error observing chat requests:', error);
        setError('Failed to load chat requests');
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const handleRespondToRequest = async (
    chatRequestId: string,
    status: 'ACCEPTED' | 'REJECTED',
    chatRequest: ChatRequest
  ) => {
    // Optimistic update - immediately remove the request from UI
    setChatRequests(prev => prev.filter(req => req.id !== chatRequestId));

    if (status === 'ACCEPTED') {
      setAcceptingId(chatRequestId);
      // Immediately call success callback for optimistic UI
      onRequestAccepted(chatRequest);
    } else {
      setDecliningId(chatRequestId);
    }

    try {
      const result = await chatService.respondToChatRequest(
        chatRequestId,
        status
      );

      if (result.error) {
        // Revert optimistic update - add request back
        setChatRequests(prev => [...prev, chatRequest]);
        setError(result.error);
        // Note: we don't revert onRequestAccepted since it might have triggered navigation
      }
      // On success, keep the optimistic update
    } catch {
      // Revert optimistic update on any error
      setChatRequests(prev => [...prev, chatRequest]);
      setError('Failed to respond to chat request');
    }

    setAcceptingId(null);
    setDecliningId(null);
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - time.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) {
      return 'Just now';
    }
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    }
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (error) {
    return <div className='p-4 text-red-600 bg-red-50 rounded-lg'>{error}</div>;
  }

  return (
    <div className='bg-white rounded-xl shadow-sm border border-gray-100'>
      <div className='p-4 border-b border-gray-100'>
        <div className='flex items-center gap-2 text-gray-900'>
          <span className='font-medium'>
            Chat Requests ({chatRequests.length})
          </span>
        </div>
      </div>

      {chatRequests.length === 0 ? (
        <div className='p-8 text-center text-gray-500'>
          <div className='w-12 h-12 mx-auto mb-3 flex items-center justify-center'>
            <svg
              className='w-8 h-8 text-gray-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1.5}
                d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
              />
            </svg>
          </div>
          <p>No chat requests</p>
        </div>
      ) : (
        <div className='p-4 space-y-3'>
          {chatRequests.map(request => (
            <div
              key={request.id}
              className='flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all'
            >
              <div className='flex items-center gap-3'>
                <UserAvatar
                  email={request.requesterEmail}
                  userId={request.requesterId}
                  size='md'
                />
                <div>
                  <div className='font-medium text-gray-900 text-sm no-email-detection'>
                    {request.requesterEmail ||
                      `User ${request.requesterId.slice(-4)}`}
                  </div>
                  <div className='text-sm text-gray-500'>
                    Wants to chat • {formatTimeAgo(request.createdAt)}
                  </div>
                </div>
              </div>

              <div className='flex gap-2'>
                <button
                  onClick={() =>
                    handleRespondToRequest(request.id, 'REJECTED', request)
                  }
                  disabled={
                    decliningId === request.id || acceptingId === request.id
                  }
                  className='px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors'
                >
                  {decliningId === request.id ? 'Declining...' : 'Decline'}
                </button>
                <button
                  onClick={() =>
                    handleRespondToRequest(request.id, 'ACCEPTED', request)
                  }
                  disabled={
                    acceptingId === request.id || decliningId === request.id
                  }
                  className='px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors'
                >
                  {acceptingId === request.id ? 'Accepting...' : 'Accept'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
