'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useState, useEffect } from 'react';

import type { Schema } from '../../amplify/data/resource';
import { chatService } from '../services/chat.service';

type ChatRequest = Schema['ChatRequest']['type'];

interface ChatRequestsProps {
  onRequestAccepted: (chatRequest: ChatRequest) => void;
}

export default function ChatRequests({ onRequestAccepted }: ChatRequestsProps) {
  const [chatRequests, setChatRequests] = useState<ChatRequest[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthenticator();

  useEffect(() => {
    if (!user) {
      return;
    }

    // Subscribe to incoming chat requests
    const subscription = chatService.observeChatRequests(
      user.userId,
      requests => {
        setChatRequests(requests);
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
    setLoading(chatRequestId);

    const result = await chatService.respondToChatRequest(
      chatRequestId,
      status
    );

    if (result.error) {
      setError(result.error);
    } else if (status === 'ACCEPTED') {
      onRequestAccepted(chatRequest);
    }

    setLoading(null);
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

  if (chatRequests.length === 0) {
    return null; // Don't show component if no requests
  }

  return (
    <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
      <h2 className='text-xl font-semibold text-gray-900 mb-4'>
        Chat Requests ({chatRequests.length})
      </h2>

      <div className='space-y-3'>
        {chatRequests.map(request => (
          <div
            key={request.id}
            className='flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200'
          >
            <div className='flex items-center space-x-3'>
              <div className='w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-medium'>
                {request.requesterId.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className='font-medium text-gray-900'>
                  Professional {request.requesterId.slice(-4)}
                </div>
                <div className='text-sm text-gray-500'>
                  Wants to chat • {formatTimeAgo(request.createdAt)}
                </div>
              </div>
            </div>

            <div className='flex space-x-2'>
              <button
                onClick={() =>
                  handleRespondToRequest(request.id, 'REJECTED', request)
                }
                disabled={loading === request.id}
                className='px-3 py-1 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 disabled:opacity-50 transition-colors'
              >
                Decline
              </button>
              <button
                onClick={() =>
                  handleRespondToRequest(request.id, 'ACCEPTED', request)
                }
                disabled={loading === request.id}
                className='px-3 py-1 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors'
              >
                {loading === request.id ? 'Accepting...' : 'Accept'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
