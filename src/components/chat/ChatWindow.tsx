'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useState, useEffect, useCallback } from 'react';

import type { Schema } from '../../../amplify/data/resource';
import { chatService } from '../../services/chat.service';
import { messageService } from '../../services/message.service';
import { userService } from '../../services/user.service';
import { soundService } from '../../services/sound.service';
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

  // Pagination state
  const [nextToken, setNextToken] = useState<string | undefined>(undefined);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [lastLoadWasOlderMessages, setLastLoadWasOlderMessages] =
    useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(false);
  const [chatEnteredAt, setChatEnteredAt] = useState<Date>(new Date());
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [unreadMessagesSnapshot, setUnreadMessagesSnapshot] = useState<
    Set<string>
  >(new Set());

  const { user } = useAuthenticator();

  // Check if there are unread messages from other users (for reply-based marking)
  const hasUnreadMessages = messages.some(
    msg =>
      !msg.isRead && msg.senderId !== user?.userId && msg.senderId !== 'SYSTEM'
  );

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

  // Initialize with real-time subscription - more reliable than initial API call
  useEffect(() => {
    if (!conversation.id || !user?.userId) {
      return;
    }

    setIsInitializing(true);
    
    // Set up real-time subscription immediately - this is more reliable than the API call
    let isFirstLoad = true;
    let previousMessageIds = new Set<string>();
    let canPlaySounds = false; // Flag to prevent sounds during initial loads
    
    const subscription = messageService.observeMessages(
      conversation.id,
      (newMessages) => {

        
        if (isFirstLoad) {
          // First load: set all messages and complete initialization
          setMessages(newMessages);
          setInitialLoadComplete(true);
          setHasActiveSession(true);
          
          // Take a snapshot of unread message IDs when first loading
          const unreadIds = new Set(
            newMessages
              .filter(
                msg =>
                  !msg.isRead &&
                  msg.senderId !== user?.userId &&
                  msg.senderId !== 'SYSTEM'
              )
              .map(msg => msg.id)
          );
          setUnreadMessagesSnapshot(unreadIds);
          
          // Initialize previous message IDs for next updates
          previousMessageIds = new Set(newMessages.map(msg => msg.id));
          
          setIsInitializing(false);
          
          // Trigger scroll to bottom after messages are loaded
          setShouldAutoScroll(true);
          
          isFirstLoad = false;
          
          // Enable sound playing after a short delay to avoid playing sounds for existing messages
          setTimeout(() => {
            canPlaySounds = true;
          }, 1000); // 1 second delay before enabling sounds
        } else {
          // Subsequent updates: check for new messages from other users
          const currentMessageIds = new Set(newMessages.map(msg => msg.id));
          const newMessageIds = newMessages.filter(msg => !previousMessageIds.has(msg.id));
          
          // Play received sound for new messages from other users (not system or self)
          // Only play if we're past the initial load period
          if (canPlaySounds) {
            const newMessagesFromOthers = newMessageIds.filter(
              msg => msg.senderId !== user?.userId && msg.senderId !== 'SYSTEM'
            );
            
            if (newMessagesFromOthers.length > 0) {
              soundService.playReceivedSound();
            }
          }
          
          // Update previous message IDs for next comparison
          previousMessageIds = currentMessageIds;
          
          // Update messages
          setMessages(newMessages);
        }
      },
      (error) => {
        setError('Failed to load real-time messages');
        setIsInitializing(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [conversation.id, user?.userId]);



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

  // Note: isInitializing is controlled by the loadInitialMessages function
  // which properly sets it to false only after messages are actually loaded

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
    setLastLoadWasOlderMessages(false); // Ensure scroll logic treats this as new message
    setShouldAutoScroll(true); // Trigger auto-scroll for sent message

    // Send to server
    messageService
      .sendMessage(
        conversation.id,
        user.userId,
        messageContent,
        replyToMessage?.id
      )
      .then(result => {
        if (result.error) {
          // Rollback optimistic update on error
          setMessages(prev => prev.filter(msg => msg.id !== tempId));
          setNewMessage(messageContent); // Restore message text
          setReplyToMessage(replyToMessage); // Restore reply state
          setError(result.error);
        } else if (result.data) {
          // Success: Replace optimistic message with real one
          // Note: The real-time subscription will also handle this, but this ensures immediate update
          setMessages(prev =>
            prev.map(msg => (msg.id === tempId ? result.data! : msg))
          );
          // Play sent sound effect
          soundService.playSentSound();

          // Mark unread messages from other users as read when user replies
          markUnreadMessagesAsRead();

          // Reset auto-scroll trigger after successful send
          setShouldAutoScroll(false);
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

  const markUnreadMessagesAsRead = useCallback(async () => {
    if (!user) return;

    // Find unread messages from other users
    const unreadMessages = messages.filter(
      msg =>
        !msg.isRead && msg.senderId !== user.userId && msg.senderId !== 'SYSTEM'
    );

    // Mark them as read
    const markPromises = unreadMessages.map(msg =>
      messageService.markMessageAsRead(msg.id)
    );

    try {
      await Promise.all(markPromises);

      // Update local state
      setMessages(prev =>
        prev.map(msg =>
          unreadMessages.some(unread => unread.id === msg.id)
            ? { ...msg, isRead: true, readAt: new Date().toISOString() }
            : msg
        )
      );

      // Remove marked messages from unread snapshot
      setUnreadMessagesSnapshot(prev => {
        const newSnapshot = new Set(prev);
        unreadMessages.forEach(msg => newSnapshot.delete(msg.id));
        return newSnapshot;
      });
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

    // Optimistically mark the message as deleted in UI
    const originalMessages = [...messages];
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? { ...msg, isDeleted: true, deletedAt: new Date().toISOString() }
          : msg
      )
    );

    try {
      const result = await messageService.deleteMessage(messageId);
      if (result.error) {
        // Rollback optimistic update on error
        setMessages(originalMessages);
        setError(result.error);
      }
    } catch (error) {
      // Rollback on network error
      setMessages(originalMessages);
      setError('Failed to delete message. Please try again.');
    }
  };

  // Load more messages handler
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
      setError(result.error);
    } else {
      // Sort older messages and prepend to existing messages
      const sortedOlderMessages = result.data.sort((a, b) => {
        const timestampA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timestampB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timestampA - timestampB;
      });

      setMessages(prev => [...sortedOlderMessages, ...prev]);
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
              <p className='text-sm text-red-800 font-medium'>
                {error || externalError}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
