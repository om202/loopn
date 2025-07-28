'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, use, useCallback } from 'react';

import type { Schema } from '../../../../amplify/data/resource';
import ChatWindow from '../../../components/ChatWindow';
import ProtectedRoute from '../../../components/protected-route';
import { chatService } from '../../../services/chat.service';

type Conversation = Schema['Conversation']['type'];

interface ChatPageProps {
  params: Promise<{
    chatId: string;
  }>;
}

export default function ChatPage({ params }: ChatPageProps) {
  const resolvedParams = use(params);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthenticator();
  const router = useRouter();

  const loadConversation = useCallback(async () => {
    try {
      setLoading(true);
      const result = await chatService.getConversation(resolvedParams.chatId);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (!result.data) {
        setError('Conversation not found');
        return;
      }

      // Verify user is part of this conversation
      const conv = result.data;
      if (
        conv.participant1Id !== user?.userId &&
        conv.participant2Id !== user?.userId
      ) {
        setError('You are not authorized to view this conversation');
        return;
      }

      setConversation(conv);
    } catch {
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.chatId, user?.userId]);

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }

    loadConversation();
  }, [user, loadConversation, router]);

  const handleChatEnded = () => {
    // Redirect back to dashboard when chat is ended
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4' />
            <p className='text-gray-600'>Loading chat...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
          <div className='text-center'>
            <h1 className='text-2xl font-bold text-gray-900 mb-4'>
              Chat Not Found
            </h1>
            <p className='text-gray-600 mb-4'>{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className='px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700'
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!conversation) {
    return (
      <ProtectedRoute>
        <div></div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className='min-h-screen bg-gray-50'>
        {/* Header */}
        <div className='bg-white border-b border-gray-200'>
          <div className='max-w-4xl mx-auto px-4 py-4'>
            <div className='flex items-center gap-4'>
              <button
                onClick={() => router.push('/dashboard')}
                className='text-gray-500 hover:text-gray-700'
              >
                <svg
                  className='w-6 h-6'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 19l-7-7 7-7'
                  />
                </svg>
              </button>
              <h1 className='text-xl font-semibold text-gray-900'>Chat</h1>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className='max-w-4xl mx-auto'>
          <ChatWindow conversation={conversation} onChatEnded={handleChatEnded} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
