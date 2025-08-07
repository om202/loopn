'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useState } from 'react';

import type { Schema } from '../../amplify/data/resource';
import { chatService } from '../services/chat.service';
import { useChatRequests } from '../hooks/realtime';

import UserAvatar from './UserAvatar';

type ChatRequest = Schema['ChatRequest']['type'];

interface ChatRequestsProps {
  onRequestAccepted: (chatRequest: ChatRequest) => void;
}

export default function ChatRequests({ onRequestAccepted }: ChatRequestsProps) {
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const { user } = useAuthenticator();

  // Use the unified chat requests hook
  const { incomingRequests: chatRequests, error: chatRequestsError } =
    useChatRequests({
      userId: user?.userId || '',
      enabled: !!user?.userId,
    });

  const error = chatRequestsError || localError;

  // Note: Using unified useChatRequests hook - real-time updates handled automatically

  const handleRespondToRequest = async (
    chatRequestId: string,
    status: 'ACCEPTED' | 'REJECTED',
    chatRequest: ChatRequest
  ) => {
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
        setLocalError(result.error);
        // Note: we don't revert onRequestAccepted since it might have triggered navigation
      }
      // On success, the real-time subscription will automatically update the UI
    } catch {
      setLocalError('Failed to respond to chat request');
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
    return <div className='p-4 text-red-500 bg-red-100 rounded-lg'>{error}</div>;
  }

  return (
    <div className='bg-white rounded-xl shadow-sm border border-slate-200'>
      <div className='p-4 border-b border-slate-200'>
        <div className='flex items-center gap-2 text-slate-900'>
          <span className='font-medium'>
            Chat Requests ({chatRequests.length})
          </span>
        </div>
      </div>

      {chatRequests.length === 0 ? (
        <div className='p-8 text-center text-slate-500'>
          <div className='w-12 h-12 mx-auto mb-3 flex items-center justify-center'>
            <svg
              className='w-8 h-8 text-slate-500'
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
              className='flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-brand-200 hover:bg-brand-100/30 transition-all'
            >
              <div className='flex items-center gap-3'>
                <UserAvatar
                  email={request.requesterEmail}
                  userId={request.requesterId}
                  size='md'
                />
                <div>
                  <div className='font-medium text-slate-900 text-sm no-email-detection'>
                    {request.requesterEmail ||
                      `User ${request.requesterId.slice(-4)}`}
                  </div>
                  <div className='text-sm text-slate-500'>
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
                  className='px-3 py-2 bg-slate-100 text-slate-900 text-sm font-medium rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors'
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
                  className='px-3 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-500 disabled:opacity-50 transition-colors'
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
