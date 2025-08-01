'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useState, useEffect, useCallback } from 'react';

import type { Schema } from '../../../amplify/data/resource';
import { chatService } from '../../services/chat.service';
import { messageService } from '../../services/message.service';
import { userService } from '../../services/user.service';
import LoadingContainer from '../LoadingContainer';

import ChatHeader from './ChatHeader';
import MessageInput from './MessageInput';
import MessageList from './MessageList';

type Message = Schema['Message']['type'];
type Conversation = Schema['Conversation']['type'];
type UserPresence = Schema['UserPresence']['type'];

interface ChatWindowProps {
  conversation: Conversation;
  onChatEnded: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export default function ChatWindow({
  conversation,
  onChatEnded,
  isLoading: externalLoading = false,
  error: externalError = null,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [otherUserPresence, setOtherUserPresence] =
    useState<UserPresence | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [sendingConnectionRequest, setSendingConnectionRequest] =
    useState(false);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);

  const { user } = useAuthenticator();

  // Get the other participant's ID
  const otherParticipantId =
    conversation.participant1Id === user?.userId
      ? conversation.participant2Id
      : conversation.participant1Id;

  // Calculate initial time remaining immediately
  const calculateTimeLeft = useCallback(() => {
    if (!conversation.probationEndsAt || conversation.isConnected) {
      return '';
    }

    const now = new Date();
    const endTime = new Date(conversation.probationEndsAt);
    const diff = endTime.getTime() - now.getTime();

    if (diff <= 0) {
      return 'Expired';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    // Show shorter format based on time remaining
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 5) {
      return `${minutes}m`;
    }
    // Show seconds when less than 5 minutes
    return `${minutes}m ${seconds}s`;
  }, [conversation.probationEndsAt, conversation.isConnected]);

  // Initialize time left immediately
  useEffect(() => {
    setTimeLeft(calculateTimeLeft());
  }, [calculateTimeLeft]);

  const handleEndChat = useCallback(async () => {
    if (!user) {
      return;
    }

    const result = await chatService.endChat(conversation.id, user.userId);
    if (result.error) {
      setError(result.error);
    } else {
      onChatEnded();
    }
  }, [conversation.id, user, onChatEnded]);

  const handleSendConnectionRequest = useCallback(async () => {
    if (!user || sendingConnectionRequest) {
      return;
    }

    setSendingConnectionRequest(true);
    const result = await chatService.sendConnectionRequest(
      user.userId,
      otherParticipantId,
      conversation.id
    );

    if (result.error) {
      setError(result.error);
    }
    setSendingConnectionRequest(false);
  }, [user, otherParticipantId, conversation.id, sendingConnectionRequest]);

  // Calculate time remaining in probation - now just updates the existing state
  useEffect(() => {
    if (!conversation.probationEndsAt || conversation.isConnected) {
      return;
    }

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft === 'Expired') {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [
    conversation.probationEndsAt,
    conversation.isConnected,
    calculateTimeLeft,
  ]);

  // Subscribe to messages
  useEffect(() => {
    if (!conversation.id) {
      return;
    }

    const subscription = messageService.observeMessages(
      conversation.id,
      msgs => {
        setMessages(msgs);
      },
      error => {
        console.error('Error observing messages:', error);
        setError('Failed to load messages');
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [conversation.id]);

  // Subscribe to other user's presence using existing real-time subscription
  useEffect(() => {
    if (!otherParticipantId) {
      return;
    }

    const subscription = userService.observeUserPresence(
      otherParticipantId,
      presence => {
        setOtherUserPresence(presence);
      },
      error => {
        console.error('Error observing user presence:', error);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [otherParticipantId]);

  // Initialize all data before showing UI
  useEffect(() => {
    // If there's external loading or no conversation data, keep initializing
    if (externalLoading || !conversation.id) {
      return;
    }

    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [externalLoading, conversation.id]);

  const handleSendMessage = () => {
    // Programmatically check conditions instead of disabling button
    if (!newMessage.trim() || !user) {
      return;
    }

    const messageContent = newMessage.trim();
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const now = new Date().toISOString();

    // Create optimistic message
    const optimisticMessage: Message = {
      id: tempId,
      conversationId: conversation.id,
      senderId: user.userId,
      receiverId: otherParticipantId,
      content: messageContent,
      sortKey: `${now}-${tempId}`,
      messageType: 'TEXT',
      timestamp: now,
      isRead: false,
      isEdited: false,
      isDeleted: false,
      replyToMessageId: replyToMessage?.id,
      participants: [user.userId, otherParticipantId],
      createdAt: now,
      updatedAt: now,
    };

    // Immediately add to UI (optimistic update)
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    setReplyToMessage(null); // Clear reply state

    // Send to server
    messageService
      .sendMessage(conversation.id, user.userId, messageContent, replyToMessage?.id)
      .then(result => {
        if (result.error) {
          // Rollback optimistic update on error
          setMessages(prev => prev.filter(msg => msg.id !== tempId));
          setNewMessage(messageContent); // Restore message text
          setReplyToMessage(replyToMessage); // Restore reply state
          setError(result.error);
        }
      })
      .catch(() => {
        // Rollback on network error
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        setNewMessage(messageContent); // Restore message text
        setReplyToMessage(replyToMessage); // Restore reply state
        setError('Failed to send message. Please try again.');
      });
  };

  const handleReplyToMessage = (message: Message) => {
    setReplyToMessage(message);
  };

  const handleCancelReply = () => {
    setReplyToMessage(null);
  };

  // Show loading state while initializing or external loading
  if (isInitializing || externalLoading) {
    return <LoadingContainer size='lg' />;
  }

  return (
    <div className='flex flex-col h-full bg-gray-100'>
      <ChatHeader
        conversation={conversation}
        otherParticipantId={otherParticipantId}
        otherUserPresence={otherUserPresence}
        timeLeft={timeLeft}
        sendingConnectionRequest={sendingConnectionRequest}
        onEndChat={handleEndChat}
        onSendConnectionRequest={handleSendConnectionRequest}
        onBack={() => window.history.back()}
      />

      <MessageList
        messages={messages}
        currentUserId={user?.userId || ''}
        otherUserPresence={otherUserPresence}
        otherParticipantId={otherParticipantId}
        isInitializing={isInitializing}
        onReplyToMessage={handleReplyToMessage}
      />

      <MessageInput
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        onSendMessage={handleSendMessage}
        disabled={false}
        autoFocus={!isInitializing && !externalLoading}
        replyToMessage={replyToMessage}
        onCancelReply={handleCancelReply}
      />

      {error || externalError ? (
        <div className='flex-shrink-0 mx-4 mb-4'>
          <div className='bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm'>
            <div className='flex items-start'>
              <svg 
                className='h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0' 
                fill='currentColor' 
                viewBox='0 0 20 20'
              >
                <path 
                  fillRule='evenodd' 
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z' 
                  clipRule='evenodd' 
                />
              </svg>
              <p className='text-sm text-red-800 font-medium'>{error || externalError}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
