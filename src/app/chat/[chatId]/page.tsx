'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import type { Schema } from '../../../../amplify/data/resource';
import ChatWindow from '../../../components/chat/ChatWindow';
import ProtectedRoute from '../../../components/protected-route';
import { getConversationIdFromParam } from '../../../lib/url-utils';
import { chatService } from '../../../services/chat.service';
import { useRealtime } from '../../../contexts/RealtimeContext';

type Conversation = Schema['Conversation']['type'];

interface ChatPageProps {
  params: {
    chatId: string;
  };
}

export default function ChatPage({ params }: ChatPageProps) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthenticator();
  const router = useRouter();
  const { subscribeToConversations } = useRealtime();

  const loadConversation = useCallback(async () => {
    try {
      setLoading(true);

      // Handle both short IDs and full UUIDs
      const conversationId = getConversationIdFromParam(params.chatId);

      if (!conversationId) {
        setError('Invalid chat ID format');
        return;
      }

      const result = await chatService.getConversation(conversationId);

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
  }, [params.chatId, user?.userId]);

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }

    loadConversation();
  }, [user, loadConversation, router]);

  // Subscribe to real-time conversation updates
  useEffect(() => {
    if (!user?.userId || !conversation?.id) {
      return;
    }

    const subscription = subscribeToConversations(user.userId, data => {
      const conversations = data.items || [];
      // Find the current conversation in the updated list
      const updatedConversation = conversations.find(
        (conv: any) => conv.id === conversation.id
      );
      if (updatedConversation) {
        setConversation(updatedConversation);
      }
    });

    return () => {
      subscription();
    };
  }, [user?.userId, conversation?.id, subscribeToConversations]);

  const handleChatEnded = () => {
    // Redirect back to dashboard when chat is ended
    router.push('/dashboard');
  };

  if (error) {
    return (
      <ProtectedRoute>
        <div className='min-h-screen bg-white flex items-center justify-center'>
          <div className='text-center'>
            <h1 className='text-2xl font-bold text-gray-900 mb-4'>
              Chat Not Found
            </h1>
            <p className='text-gray-600 mb-4'>{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className='h-screen bg-white'>
        {/* Main Chat Area - Full Width */}
        <div className='h-full flex flex-col'>
          <ChatWindow
            conversation={
              conversation || {
                id: params.chatId,
                participant1Id: '',
                participant2Id: '',
                isConnected: false,
                probationEndsAt: null,
                createdAt: '',
                updatedAt: '',
              }
            }
            onChatEnded={handleChatEnded}
            isLoading={loading}
            error={error}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
