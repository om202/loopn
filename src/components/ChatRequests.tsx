'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useState } from 'react';

import type { Schema } from '../../amplify/data/resource';
import { chatService } from '../services/chat.service';
import { useChatRequests } from '../hooks/useChatRequests';

import UserAvatar from './UserAvatar';

// Custom Connect Icon using circles from logo
const ConnectIcon = ({ className }: { className?: string }) => (
  <svg
    width='20'
    height='20'
    viewBox='30 30 160 160'
    className={className}
    fill='none'
    stroke='currentColor'
    strokeWidth='13'
  >
    <circle cx='75' cy='110' r='35' />
    <circle cx='145' cy='110' r='35' />
  </svg>
);

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
      setLocalError('Failed to respond to connection request');
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
    return (
      <div className='p-4 text-b_red-500 bg-b_red-100 rounded-lg'>{error}</div>
    );
  }

  return (
    <div className='bg-white rounded-xl shadow-lg border border-neutral-200'>
      <div className='p-4 border-b border-neutral-200'>
        <div className='flex items-center gap-2 text-neutral-900'>
          <span className='font-medium'>
            Connection Requests ({chatRequests.length})
          </span>
        </div>
      </div>

      {chatRequests.length === 0 ? (
        <div className='flex flex-col items-center justify-center text-center p-8'>
          <div className='w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center'>
            <ConnectIcon className='w-8 h-8 text-neutral-500' />
          </div>
          <h3 className='text-lg font-medium text-neutral-900 mb-1'>
            No connection requests
          </h3>
        </div>
      ) : (
        <div className='p-4 space-y-3'>
          {chatRequests.map(request => (
            <div
              key={request.id}
              className='flex items-center justify-between p-3 rounded-lg border border-neutral-200 hover:border-brand-200 hover:bg-brand-50/30 transition-all'
            >
              <div className='flex items-center gap-3'>
                <UserAvatar userId={request.requesterId} size='md' />
                <div>
                  <div className='font-medium text-neutral-900 text-sm no-email-detection'>
                    {`User ${request.requesterId.slice(-4)}`}
                  </div>
                  <div className='text-sm text-neutral-500'>
                    Wants to connect • {formatTimeAgo(request.createdAt)}
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
                  className='px-3 py-2 bg-neutral-100 text-neutral-900 text-sm font-medium rounded-lg hover:bg-neutral-100 disabled:opacity-50 transition-colors'
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
