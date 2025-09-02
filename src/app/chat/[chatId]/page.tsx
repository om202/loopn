'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import type { Schema } from '../../../../amplify/data/resource';
import ChatWindow from '../../../components/chat/ChatWindow';
import ChatHeader from '../../../components/chat/ChatHeader';
import ProfileSidebar from '../../../components/ProfileSidebar';
import ProtectedRoute from '../../../components/protected-route';

import { getConversationIdFromParam } from '../../../lib/url-utils';
import { chatService } from '../../../services/chat.service';
import { useConversations } from '../../../hooks/useConversations';
import { useOnlineUsers } from '../../../hooks/useOnlineUsers';
import { useConnectionActions } from '../../../hooks/useConnectionActions';

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
  const [otherUserPresence, setOtherUserPresence] = useState<
    Schema['UserPresence']['type'] | null
  >(null);
  const { user } = useAuthenticator();
  const router = useRouter();

  // Use centralized conversations
  const { getConversationById } = useConversations({
    userId: user?.userId || '',
    enabled: !!user?.userId,
  });

  // Get online users for presence status
  const { onlineUsers, getUserPresence } = useOnlineUsers({
    enabled: !!user?.userId,
  });

  // Get the other participant's ID
  const otherParticipantId = conversation
    ? conversation.participant1Id === user?.userId
      ? conversation.participant2Id
      : conversation.participant1Id
    : '';

  // Connection actions
  const {
    sendConnectionRequest,
    cancelConnectionRequest,
    removeConnection,
    isLoading: sendingConnectionRequest,
    error: connectionError,
  } = useConnectionActions({
    conversationId: conversation?.id || '',
    currentUserId: user?.userId || '',
    otherUserId: otherParticipantId,
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

      // Get other participant's presence from real-time data
      const otherUserId =
        conv.participant1Id === user?.userId
          ? conv.participant2Id
          : conv.participant1Id;

      if (otherUserId) {
        // Use real-time presence data instead of making an API call
        const presence = getUserPresence(otherUserId);
        setOtherUserPresence(presence);
      }
    } catch {
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  }, [params.chatId, user?.userId, getUserPresence]);

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
      setConversation(updatedConversation);
    }
  }, [user?.userId, conversation?.id, conversation, getConversationById]);

  // Update other user presence when online users data changes
  useEffect(() => {
    if (otherParticipantId) {
      const presence = getUserPresence(otherParticipantId);
      setOtherUserPresence(presence);
    }
  }, [otherParticipantId, getUserPresence]);

  const handleSendConnectionRequest = useCallback(async () => {
    if (!user || !conversation || sendingConnectionRequest) {
      return;
    }

    await sendConnectionRequest();

    if (connectionError) {
      setError(connectionError);
    }
  }, [
    user,
    conversation,
    sendingConnectionRequest,
    sendConnectionRequest,
    connectionError,
  ]);

  const handleCancelConnectionRequest = useCallback(
    async (connectionId: string) => {
      if (!user || !conversation || sendingConnectionRequest) {
        return;
      }

      await cancelConnectionRequest(connectionId);

      if (connectionError) {
        setError(connectionError);
      }
    },
    [
      user,
      conversation,
      sendingConnectionRequest,
      cancelConnectionRequest,
      connectionError,
    ]
  );

  const handleRemoveConnection = useCallback(async () => {
    if (!user || !conversation || sendingConnectionRequest) {
      return;
    }

    await removeConnection();

    if (connectionError) {
      setError(connectionError);
    } else {
      // After removing connection, navigate back to dashboard
      router.push('/dashboard');
    }
  }, [
    user,
    conversation,
    sendingConnectionRequest,
    removeConnection,
    connectionError,
    router,
  ]);

  if (error) {
    return (
      <ProtectedRoute requireOnboarding={true}>
        <div
          className='min-h-screen bg-white flex items-center justify-center'
          style={{ minHeight: '100dvh' }}
        >
          <div className='text-center'>
            <h1 className='text-2xl font-bold text-neutral-900 mb-4'>
              Chat Not Found
            </h1>
            <p className='text-neutral-900 mb-4'>{error}</p>
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
      <div
        className='h-screen bg-white lg:bg-neutral-100 flex flex-col overflow-hidden'
        style={{ height: '100dvh' }}
      >
        <div className='flex-1 w-full flex justify-center px-1 sm:px-3 lg:px-3 py-1 sm:py-3 lg:py-3 min-h-0'>
          <div className='w-full mx-auto flex lg:gap-3 h-full'>
            {/* Left Sidebar - Desktop Only */}
            <div className='hidden lg:block flex-shrink-0'>
              <ProfileSidebar
                userId={otherParticipantId}
                userPresence={otherUserPresence}
                onlineUsers={onlineUsers}
                conversation={conversation || undefined}
                sendingConnectionRequest={sendingConnectionRequest}
                onBack={() => router.push('/dashboard')}
                onSendConnectionRequest={handleSendConnectionRequest}
                onCancelConnectionRequest={handleCancelConnectionRequest}
                onRemoveConnection={handleRemoveConnection}
              />
            </div>

            {/* Main Chat Area */}
            <div className='flex-1 bg-white sm:rounded-2xl border border-neutral-200 p-2 sm:p-4 overflow-hidden flex flex-col min-h-0'>
              {/* Mobile ChatHeader - shown only on small screens */}
              {conversation && (
                <div className='lg:hidden flex-shrink-0 mb-2'>
                  <ChatHeader
                    conversation={conversation}
                    otherParticipantId={otherParticipantId}
                    otherUserPresence={otherUserPresence}
                    sendingConnectionRequest={sendingConnectionRequest}
                    onSendConnectionRequest={handleSendConnectionRequest}
                    onBack={() => router.push('/dashboard')}
                  />
                </div>
              )}

              <div className='flex-1 min-h-0'>
                <div className='h-full overflow-hidden'>
                  <ChatWindow
                    conversation={
                      conversation || {
                        id: params.chatId,
                        participant1Id: '',
                        participant2Id: '',
                        isConnected: false,
                        createdAt: '',
                        updatedAt: '',
                      }
                    }
                    isLoading={loading}
                    error={error}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
