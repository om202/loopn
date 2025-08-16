'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import type { Schema } from '../../../../amplify/data/resource';
import ChatWindow from '../../../components/chat/ChatWindow';
import ProtectedRoute from '../../../components/protected-route';
import TrialEndedByOtherDialog from '../../../components/TrialEndedByOtherDialog';
import { getConversationIdFromParam } from '../../../lib/url-utils';
import { chatService } from '../../../services/chat.service';
import { useConversations } from '../../../hooks/useConversations';

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
  const [showTrialEndedDialog, setShowTrialEndedDialog] = useState(false);
  const { user } = useAuthenticator();
  const router = useRouter();

  // Use centralized conversations
  const { getConversationById } = useConversations({
    userId: user?.userId || '',
    enabled: !!user?.userId,
  });

  const loadConversation = useCallback(async () => {
    try {
      setLoading(true);
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

  // Monitor conversation updates from centralized store
  useEffect(() => {
    if (!user?.userId || !conversation?.id) {
      return;
    }

    // Check for updates to the current conversation
    const updatedConversation = getConversationById(conversation.id);
    if (updatedConversation && updatedConversation !== conversation) {
      // Check if the chat trial was just ended by another user
      const wasActive = conversation.chatStatus !== 'ENDED';
      const isNowEnded = updatedConversation.chatStatus === 'ENDED';
      const endedByOtherUser =
        updatedConversation.endedByUserId &&
        updatedConversation.endedByUserId !== user.userId;

      if (wasActive && isNowEnded && endedByOtherUser) {
        setShowTrialEndedDialog(true);
      }

      setConversation(updatedConversation);
    }
  }, [
    user?.userId,
    conversation?.id,
    conversation?.chatStatus,
    conversation,
    getConversationById,
  ]);

  const handleChatEnded = () => {
    router.push('/dashboard');
  };

  const handleTrialEndedDialogClose = () => {
    setShowTrialEndedDialog(false);
    // Optionally redirect to dashboard after closing the dialog
    router.push('/dashboard');
  };

  if (error) {
    return (
      <ProtectedRoute requireOnboarding={true}>
        <div
          className='min-h-screen bg-white flex items-center justify-center'
          style={{ minHeight: '100dvh' }}
        >
          <div className='text-center'>
            <h1 className='text-2xl font-bold text-zinc-900 mb-4'>
              Chat Not Found
            </h1>
            <p className='text-zinc-900 mb-4'>{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className='px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-500'
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireOnboarding={true}>
      <div className='h-screen bg-white' style={{ height: '100dvh' }}>
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

      {/* Trial ended by other user dialog */}
      <TrialEndedByOtherDialog
        isOpen={showTrialEndedDialog}
        onClose={handleTrialEndedDialogClose}
      />
    </ProtectedRoute>
  );
}
