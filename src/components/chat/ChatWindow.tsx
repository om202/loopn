'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useState, useEffect, useCallback } from 'react';

import type { Schema } from '../../../amplify/data/resource';
import { messageService } from '../../services/message.service';
import { chatPresenceService } from '../../services/chat-presence.service';
import { useRealtimeMessages } from '../../hooks/realtime';
import LoadingContainer from '../LoadingContainer';

import MessageInput from './MessageInput';
import MessageList from './MessageList';

type Message = Schema['Message']['type'];
type Conversation = Schema['Conversation']['type'];

interface ChatWindowProps {
  conversation: Conversation;
  isLoading?: boolean;
  error?: string | null;
}

export default function ChatWindow({
  conversation,
  isLoading: externalLoading = false,
  error: externalError = null,
}: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);

  // Pagination state
  const [nextToken, setNextToken] = useState<string | undefined>(undefined);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastLoadWasOlderMessages, setLastLoadWasOlderMessages] =
    useState(false);
  const [chatEnteredAt] = useState<Date>(new Date());

  const { user } = useAuthenticator();

  // Initialize chat presence tracking
  useEffect(() => {
    if (user?.userId) {
      chatPresenceService.initialize(user.userId);
    }
  }, [user?.userId]);

  // Track when user enters/exits this chat
  useEffect(() => {
    if (conversation.id && user?.userId) {
      // Enter chat presence
      chatPresenceService.enterChat(conversation.id);

      // Exit chat presence on cleanup
      return () => {
        chatPresenceService.exitChat();
      };
    }
  }, [conversation.id, user?.userId]);

  // Use our new realtime messages hook
  const {
    messages,
    isInitializing,
    hasActiveSession,
    shouldAutoScroll,
    unreadMessagesSnapshot,
    error: messageError,
    setShouldAutoScroll,
  } = useRealtimeMessages({
    conversationId: conversation.id,
    userId: user?.userId || '',
    enabled: !!conversation.id && !!user?.userId,
  });

  const error = externalError || messageError || localError;

  // Check if there are unread messages from other users (for reply-based marking)

  // Get the other participant's ID
  const otherParticipantId =
    conversation.participant1Id === user?.userId
      ? conversation.participant2Id
      : conversation.participant1Id;

  // Note: Online users data available via useOnlineUsers hook if needed

  // Use the message error as the main error (presence is now centralized)
  const finalError = error;

  // Note: Message subscription logic moved to useRealtimeMessages hook
  // Note: Presence subscription logic moved to useRealtimePresence hook

  // Note: isInitializing is controlled by the loadInitialMessages function
  // which properly sets it to false only after messages are actually loaded

  const handleSendMessage = async () => {
    // Programmatically check conditions instead of disabling button
    if (!newMessage.trim() || !user || conversation.chatStatus === 'ENDED') {
      return;
    }

    const messageContent = newMessage.trim();

    // Create optimistic message

    // Clear input immediately
    setNewMessage('');
    setReplyToMessage(null); // Clear reply state
    setLastLoadWasOlderMessages(false); // Ensure scroll logic treats this as new message
    setShouldAutoScroll(true); // Trigger auto-scroll for sent message

    // Send to server - let real-time subscription handle UI updates
    try {
      const result = await messageService.sendMessage(
        conversation.id,
        user.userId,
        messageContent,
        replyToMessage?.id
      );

      if (result.error) {
        setLocalError(result.error);
        setNewMessage(messageContent); // Restore message text on error
        setReplyToMessage(replyToMessage); // Restore reply state
      } else if (result.data) {
        // Mark unread messages from other users as read when user replies
        markUnreadMessagesAsRead();
      }
    } catch {
      setLocalError('Failed to send message. Please try again.');
      setNewMessage(messageContent); // Restore message text on error
      setReplyToMessage(replyToMessage); // Restore reply state
    }
  };

  const markUnreadMessagesAsRead = useCallback(async () => {
    if (!user) return;

    // Find unread messages from other users
    const unreadMessages = messages.filter(
      msg =>
        !msg.isRead && msg.senderId !== user.userId && msg.senderId !== 'SYSTEM'
    );

    if (unreadMessages.length === 0) return;

    // Mark them as read - let real-time subscription handle UI updates
    const markPromises = unreadMessages.map(msg =>
      messageService.markMessageAsRead(msg.id)
    );

    try {
      await Promise.all(markPromises);
      // Real-time subscription will handle state updates
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [messages, user]);

  // Auto-mark messages as read after 5 seconds when chat first loads
  useEffect(() => {
    if (!hasActiveSession || unreadMessagesSnapshot.size === 0) {
      return;
    }

    const timer = setTimeout(() => {
      // Only auto-mark if there are still unread messages from the snapshot
      const currentUnreadFromSnapshot = messages.filter(
        msg =>
          unreadMessagesSnapshot.has(msg.id) &&
          !msg.isRead &&
          msg.senderId !== user?.userId &&
          msg.senderId !== 'SYSTEM'
      );

      if (currentUnreadFromSnapshot.length > 0) {
        markUnreadMessagesAsRead();
      }
    }, 5000); // 5 seconds

    return () => clearTimeout(timer);
  }, [
    hasActiveSession,
    unreadMessagesSnapshot,
    messages,
    user?.userId,
    markUnreadMessagesAsRead,
  ]);

  const handleReplyToMessage = (message: Message) => {
    setReplyToMessage(message);
  };

  const handleCancelReply = () => {
    setReplyToMessage(null);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!user) {
      return;
    }

    try {
      const result = await messageService.deleteMessage(messageId);
      if (result.error) {
        setLocalError(result.error);
      }
      // Real-time subscription will handle UI updates
    } catch {
      setLocalError('Failed to delete message. Please try again.');
    }
  };

  // Load more messages handler - TODO: Implement pagination with real-time hook
  const handleLoadMoreMessages = useCallback(async () => {
    if (!nextToken || isLoadingMore || !conversation.id) {
      return;
    }

    setIsLoadingMore(true);
    const result = await messageService.getConversationMessages(
      conversation.id,
      50,
      nextToken
    );

    if (result.error) {
      setLocalError(result.error);
    } else {
      // TODO: For now, pagination is disabled since our real-time hook manages all messages
      // We'll implement this properly in a future iteration
      setNextToken(result.nextToken);
      setHasMoreMessages(!!result.nextToken);
      setLastLoadWasOlderMessages(true);
    }
    setIsLoadingMore(false);
  }, [nextToken, isLoadingMore, conversation.id]);

  // Show loading state while initializing, external loading, or no conversation data
  if (isInitializing || externalLoading || !conversation.id) {
    return <LoadingContainer />;
  }

  return (
    <div className='flex flex-col h-full bg-white'>
      <MessageList
        messages={messages}
        currentUserId={user?.userId || ''}
        otherParticipantId={otherParticipantId}
        isInitializing={isInitializing}
        onReplyToMessage={handleReplyToMessage}
        onDeleteMessage={handleDeleteMessage}
        onLoadMoreMessages={handleLoadMoreMessages}
        hasMoreMessages={hasMoreMessages}
        isLoadingMore={isLoadingMore}
        lastLoadWasOlderMessages={lastLoadWasOlderMessages}
        shouldAutoScroll={shouldAutoScroll}
        chatEnteredAt={chatEnteredAt}
        unreadMessagesSnapshot={unreadMessagesSnapshot}
      />

      <MessageInput
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        onSendMessage={handleSendMessage}
        disabled={conversation.chatStatus === 'ENDED'}
        autoFocus={
          !isInitializing &&
          !externalLoading &&
          conversation.chatStatus !== 'ENDED'
        }
        replyToMessage={replyToMessage}
        onCancelReply={handleCancelReply}
      />

      {finalError || externalError ? (
        <div className='flex-shrink-0 mx-4 mb-4'>
          <div className='bg-b_red-100 border border-b_red-200 rounded-lg p-4 shadow-lg'>
            <div className='flex items-start'>
              <svg
                className='h-5 w-5 text-b_red-500 mt-0.5 mr-3 flex-shrink-0'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                  clipRule='evenodd'
                />
              </svg>
              <p className='text-sm text-b_red-800 font-medium'>
                {finalError || externalError}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
