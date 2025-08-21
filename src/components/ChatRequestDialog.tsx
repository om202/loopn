'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

import type { Schema } from '../../amplify/data/resource';
import { createShortChatUrl } from '../lib/url-utils';
import { chatService } from '../services/chat.service';

import UserAvatar from './UserAvatar';
import DialogContainer from './DialogContainer';

type ChatRequest = Schema['ChatRequest']['type'];

interface ChatRequestWithUser extends ChatRequest {
  requesterEmail?: string;
}

interface ChatRequestDialogProps {
  isOpen: boolean;
  chatRequest: ChatRequestWithUser | null;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
  showConnectedState?: boolean;
  conversationId?: string | null;
  requestCancelled?: boolean;
}

interface ConnectedDialogProps {
  isOpen: boolean;
  chatRequest: ChatRequestWithUser | null;
  conversationId?: string;
  onClose: () => void;
}

interface NewRequestDialogProps {
  isOpen: boolean;
  chatRequest: ChatRequestWithUser | null;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
  requestCancelled?: boolean;
}

// Connected state dialog component
function ConnectedDialog({
  isOpen,
  chatRequest,
  conversationId,
  onClose,
}: ConnectedDialogProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const router = useRouter();

  if (!isOpen || !chatRequest) {
    return null;
  }

  const handleOk = () => {
    // TODO: Handle "don't show again" preference if checked
    if (dontShowAgain) {
      // Could save preference to localStorage or user settings
      console.warn('User chose not to show this confirmation again');
    }
    onClose();
  };

  const handleChatNow = () => {
    if (conversationId) {
      router.push(createShortChatUrl(conversationId));
      onClose();
    }
  };

  return (
    <DialogContainer isOpen={isOpen} onClose={onClose} maxWidth='md'>
      <div className='p-6'>
        <div className='text-center py-6'>
          <div className='mb-6'>
            <div className='flex justify-center mb-3'>
              <div className='w-12 h-12 bg-b_green-100 rounded-full flex items-center justify-center'>
                <CheckCircle2 className='w-6 h-6 text-b_green-500' />
              </div>
            </div>
            <h3 className='text-xl font-medium text-b_green-500 mb-4'>
              Connected!
            </h3>

            <div className='text-lg font-medium text-neutral-950 mb-3 no-email-detection'>
              {chatRequest.requesterEmail ||
                `User ${chatRequest.requesterId.slice(-4)}`}
            </div>

            <p className='text-base text-neutral-950'>
              You are now connected to chat for 7 days.
            </p>
          </div>
        </div>

        {/* Don't show again checkbox */}
        <div className='flex items-center gap-2 mb-4'>
          <input
            type='checkbox'
            id='dontShowAgain'
            checked={dontShowAgain}
            onChange={e => setDontShowAgain(e.target.checked)}
            className='w-4 h-4 text-brand-500 border-gray-200 rounded focus:ring-brand-500'
          />
          <label htmlFor='dontShowAgain' className='text-sm text-neutral-950'>
            Don&apos;t show this confirmation again
          </label>
        </div>

        {/* Action Buttons */}
        <div className='flex gap-3'>
          {/* Chat Now Button */}
          <button
            onClick={handleChatNow}
            disabled={!conversationId}
            className='flex-1 px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-2xl hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            Chat Now
          </button>

          {/* OK Button */}
          <button
            onClick={handleOk}
            className='flex-1 px-4 py-2 bg-white text-neutral-950 text-sm font-medium rounded-2xl border border-gray-200 hover:bg-gray-100 transition-colors'
          >
            Later
          </button>
        </div>
      </div>
    </DialogContainer>
  );
}

// New request dialog component
function NewRequestDialog({
  isOpen,
  chatRequest,
  onClose,
  onAccept,
  onReject,
  requestCancelled = false,
}: NewRequestDialogProps) {
  const [justAccepted, setJustAccepted] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen || !chatRequest) {
    return null;
  }

  const handleResponse = async (status: 'ACCEPTED' | 'REJECTED') => {
    // Optimistic UI: immediately trigger callbacks
    if (status === 'ACCEPTED') {
      setJustAccepted(true);
      onAccept();
    } else {
      onReject();
      onClose();
    }

    // Then perform the actual API call in the background
    try {
      const result = await chatService.respondToChatRequest(
        chatRequest.id,
        status
      );

      if (result.error) {
        console.error('Failed to respond to chat request:', result.error);
        // Could show a toast notification here if needed
      }
      // No auto-redirect for NewRequestDialog - it transitions to connected state internally
    } catch (error) {
      console.error('Error responding to chat request:', error);
      // Could show a toast notification here if needed
    }
  };

  const handleMaybeLater = () => {
    // Just close the dialog, leaving the request in notifications
    onClose();
  };

  const handleOk = () => {
    // TODO: Handle "don't show again" preference if checked
    if (dontShowAgain) {
      // Could save preference to localStorage or user settings
      console.warn('User chose not to show this confirmation again');
    }
    onClose();
    setJustAccepted(false);
  };

  return (
    <DialogContainer isOpen={isOpen} onClose={onClose} maxWidth='md'>
      <div className='p-6'>
        {requestCancelled ? (
          /* Request Cancelled Message */
          <>
            <div className='text-center py-6'>
              <div className='mb-6'>
                <div className='flex justify-center mb-3'>
                  <div className='w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center'>
                    <svg
                      className='w-6 h-6 text-neutral-950'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.732 15.5c-.77.833.192 2.5 1.732 2.5z'
                      />
                    </svg>
                  </div>
                </div>
                <h3 className='text-xl font-medium text-neutral-950 mb-2'>
                  Request Removed
                </h3>
                <p className='text-base text-neutral-950'>
                  The chat request was removed by the other user
                </p>
              </div>
            </div>

            {/* OK Button */}
            <button
              onClick={onClose}
              className='w-full px-4 py-2 bg-white text-neutral-950 text-sm font-medium rounded-2xl border border-gray-200 hover:bg-gray-100 transition-colors'
            >
              OK
            </button>
          </>
        ) : justAccepted ? (
          /* Connected Message */
          <>
            <div className='text-center py-6'>
              <div className='mb-6'>
                <div className='flex justify-center mb-3'>
                  <div className='w-12 h-12 bg-b_green-100 rounded-full flex items-center justify-center'>
                    <CheckCircle2 className='w-6 h-6 text-b_green-500' />
                  </div>
                </div>
                <h3 className='text-xl font-medium text-b_green-500 mb-2'>
                  Connected!
                </h3>
                <p className='text-base text-neutral-950'>
                  You are connected to chat for 7 days
                </p>
              </div>
            </div>

            {/* Don't show again checkbox */}
            <div className='flex items-center gap-2 mb-4'>
              <input
                type='checkbox'
                id='dontShowAgain'
                checked={dontShowAgain}
                onChange={e => setDontShowAgain(e.target.checked)}
                className='w-4 h-4 text-brand-500 border-gray-200 rounded focus:ring-brand-500'
              />
              <label htmlFor='dontShowAgain' className='text-sm text-neutral-950'>
                Don&apos;t show this confirmation again
              </label>
            </div>

            {/* OK Button */}
            <button
              onClick={handleOk}
              className='w-full px-4 py-2 bg-white text-neutral-950 text-sm font-medium rounded-2xl border border-gray-200 hover:bg-gray-100 transition-colors'
            >
              OK
            </button>
          </>
        ) : (
          /* Normal Chat Request */
          <>
            <div className='text-center mb-6'>
              <h3 className='text-lg font-medium text-neutral-950 mb-2'>
                New Chat Request
              </h3>
            </div>

            <div className='flex items-center gap-4 mb-6'>
              <UserAvatar
                email={chatRequest.requesterEmail}
                userId={chatRequest.requesterId}
                size='md'
              />
              <div className='flex-1 min-w-0'>
                <div className='text-base font-medium text-neutral-950 truncate no-email-detection'>
                  {chatRequest.requesterEmail ||
                    `User ${chatRequest.requesterId.slice(-4)}`}
                </div>
                <div className='text-sm text-neutral-950 mt-1'>
                  wants to chat with you
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex gap-3 mb-4'>
              {/* Accept Button */}
              <button
                onClick={() => handleResponse('ACCEPTED')}
                className='flex-1 px-4 py-3 bg-brand-500 text-white text-base font-medium rounded-2xl hover:bg-brand-500 transition-colors'
              >
                Accept
              </button>

              {/* Reject Button */}
              <button
                onClick={() => handleResponse('REJECTED')}
                className='flex-1 px-4 py-3 bg-gray-100 text-neutral-950 text-base font-medium rounded-2xl hover:bg-gray-100 transition-colors'
              >
                Reject
              </button>
            </div>

            {/* Maybe Later Button */}
            <button
              onClick={handleMaybeLater}
              className='w-full px-4 py-3 text-sm text-neutral-500 hover:text-neutral-950 transition-colors'
            >
              Maybe Later
            </button>
          </>
        )}
      </div>
    </DialogContainer>
  );
}

export default function ChatRequestDialog({
  isOpen,
  chatRequest,
  onClose,
  onAccept,
  onReject,
  showConnectedState = false,
  conversationId,
  requestCancelled = false,
}: ChatRequestDialogProps) {
  // Route to the appropriate dialog based on state
  if (showConnectedState) {
    return (
      <ConnectedDialog
        isOpen={isOpen}
        chatRequest={chatRequest}
        conversationId={conversationId || undefined}
        onClose={onClose}
      />
    );
  }

  return (
    <NewRequestDialog
      isOpen={isOpen}
      chatRequest={chatRequest}
      onClose={onClose}
      onAccept={onAccept}
      onReject={onReject}
      requestCancelled={requestCancelled}
    />
  );
}
