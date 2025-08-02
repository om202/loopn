'use client';

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';

import type { Schema } from '../../../amplify/data/resource';

import MessageBubble from './MessageBubble';
import { reactionService } from '../../services/reaction.service';

type Message = Schema['Message']['type'];
type UserPresence = Schema['UserPresence']['type'];
type MessageReaction = Schema['MessageReaction']['type'];

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  otherUserPresence: UserPresence | null;
  otherParticipantId: string;
  isInitializing: boolean;
  onReplyToMessage?: (message: Message) => void;
  onDeleteMessage?: (messageId: string) => void;
  onLoadMoreMessages?: () => void;
  hasMoreMessages?: boolean;
  isLoadingMore?: boolean;
  lastLoadWasOlderMessages?: boolean;
  shouldAutoScroll?: boolean;
  chatEnteredAt?: Date;
  unreadMessagesSnapshot?: Set<string>;
}

export default function MessageList({
  messages,
  currentUserId,
  otherUserPresence,
  otherParticipantId,
  isInitializing,
  onReplyToMessage,
  onDeleteMessage,
  onLoadMoreMessages,
  hasMoreMessages = false,
  isLoadingMore = false,
  lastLoadWasOlderMessages = false,
  shouldAutoScroll = false,
  chatEnteredAt,
  unreadMessagesSnapshot,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);
  const scrollPositionRef = useRef(0);
  const [messageReactions, setMessageReactions] = useState<
    Record<string, MessageReaction[]>
  >({});
  const [openEmojiPickerMessageId, setOpenEmojiPickerMessageId] = useState<
    string | null
  >(null);
  const [reactionsLoaded, setReactionsLoaded] = useState(false);

  // Handle adding reactions from emoji picker (always add, never toggle)
  const handleAddReaction = useCallback(
    async (messageId: string, emoji: string) => {
      // Find the message to get participants
      const message = messages.find(msg => msg.id === messageId);
      if (!message) return;

      const participants = [message.senderId, message.receiverId];
      const currentReactions = messageReactions[messageId] || [];
      
      // OPTIMISTIC UPDATE: Always add new reaction (no toggle behavior for picker)
      const optimisticReaction = {
        id: `temp-${Date.now()}-${Math.random()}`, // Temporary ID
        messageId,
        userId: currentUserId,
        emoji,
        timestamp: new Date().toISOString(),
        participants,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setMessageReactions(prev => ({
        ...prev,
        [messageId]: [...currentReactions, optimisticReaction],
      }));

      // Close emoji picker immediately for better UX
      setOpenEmojiPickerMessageId(null);

      // Make actual server request in background
      try {
        const result = await reactionService.addReaction(
          messageId,
          currentUserId,
          emoji,
          participants,
          true // allowMultiple = true for picker (always add new instances)
        );

        if (result.error) {
          // Rollback on error: restore original state
          setMessageReactions(prev => ({
            ...prev,
            [messageId]: currentReactions,
          }));
          console.error('Failed to add reaction:', result.error);
        } else {
          // Success: refresh with actual server data to ensure consistency
          const updatedReactions = await reactionService.getMessageReactions(messageId);
          if (!updatedReactions.error) {
            setMessageReactions(prev => ({
              ...prev,
              [messageId]: updatedReactions.data,
            }));
          }
        }
      } catch (error) {
        // Rollback on network error
        setMessageReactions(prev => ({
          ...prev,
          [messageId]: currentReactions,
        }));
        console.error('Network error while adding reaction:', error);
      }
    },
    [messages, currentUserId, messageReactions]
  );

  // Handle toggling reactions from applied reaction buttons (toggle behavior)
  const handleToggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      // Find the message to get participants
      const message = messages.find(msg => msg.id === messageId);
      if (!message) return;

      const participants = [message.senderId, message.receiverId];
      const currentReactions = messageReactions[messageId] || [];
      
      // Check if user already has this reaction
      const existingReaction = currentReactions.find(
        reaction => reaction.userId === currentUserId && reaction.emoji === emoji
      );

      // OPTIMISTIC UPDATE: Toggle behavior for applied reaction buttons
      if (existingReaction) {
        // Remove existing reaction optimistically
        const optimisticReactions = currentReactions.filter(
          reaction => reaction.id !== existingReaction.id
        );
        setMessageReactions(prev => ({
          ...prev,
          [messageId]: optimisticReactions,
        }));
      } else {
        // Add new reaction optimistically
        const optimisticReaction = {
          id: `temp-${Date.now()}-${Math.random()}`, // Temporary ID
          messageId,
          userId: currentUserId,
          emoji,
          timestamp: new Date().toISOString(),
          participants,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        setMessageReactions(prev => ({
          ...prev,
          [messageId]: [...currentReactions, optimisticReaction],
        }));
      }

      // Make actual server request in background
      try {
        const result = await reactionService.addReaction(
          messageId,
          currentUserId,
          emoji,
          participants,
          false // allowMultiple = false for toggle behavior (remove if exists)
        );

        if (result.error) {
          // Rollback on error: restore original state
          setMessageReactions(prev => ({
            ...prev,
            [messageId]: currentReactions,
          }));
          console.error('Failed to toggle reaction:', result.error);
        } else {
          // Success: refresh with actual server data to ensure consistency
          const updatedReactions = await reactionService.getMessageReactions(messageId);
          if (!updatedReactions.error) {
            setMessageReactions(prev => ({
              ...prev,
              [messageId]: updatedReactions.data,
            }));
          }
        }
      } catch (error) {
        // Rollback on network error
        setMessageReactions(prev => ({
          ...prev,
          [messageId]: currentReactions,
        }));
        console.error('Network error while toggling reaction:', error);
      }
    },
    [messages, currentUserId, messageReactions]
  );

  // Handle emoji picker toggle
  const handleEmojiPickerToggle = useCallback((messageId: string) => {
    setOpenEmojiPickerMessageId(prev =>
      prev === messageId ? null : messageId
    );
  }, []);

  // Handle click away to close emoji picker
  useEffect(() => {
    const handleClickAway = (event: MouseEvent) => {
      if (!openEmojiPickerMessageId) return;

      const target = event.target as Element;

      // Check if click is inside an emoji picker or emoji button
      const isInsideEmojiPicker = target.closest('[data-emoji-picker]');
      const isInsideEmojiButton = target.closest('[data-emoji-button]');

      if (!isInsideEmojiPicker && !isInsideEmojiButton) {
        setOpenEmojiPickerMessageId(null);
      }
    };

    if (openEmojiPickerMessageId) {
      document.addEventListener('mousedown', handleClickAway);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickAway);
    };
  }, [openEmojiPickerMessageId]);

  // Fetch reactions for new messages only - use ref to avoid infinite loops
  const loadedMessageIds = useRef<Set<string>>(new Set());

  // Memoize message IDs to prevent unnecessary effect re-runs
  const messageIds = useMemo(() => messages.map(msg => msg.id), [messages]);

  useEffect(() => {
    const loadReactionsForNewMessages = async () => {
      if (messageIds.length === 0) {
        setReactionsLoaded(true);
        return;
      }

      // Only fetch reactions for message IDs we haven't loaded reactions for yet
      const messageIdsToLoad = messageIds.filter(
        msgId => !loadedMessageIds.current.has(msgId)
      );

      if (messageIdsToLoad.length === 0) {
        setReactionsLoaded(true);
        return;
      }

      setReactionsLoaded(false);

      // Load reactions for all new message IDs in a single batch call
      const result =
        await reactionService.getBatchMessageReactions(messageIdsToLoad);

      if (result.error) {
        console.error('Error loading batch reactions:', result.error);
        setReactionsLoaded(true);
        return;
      }

      // Mark all message IDs as loaded
      messageIdsToLoad.forEach(messageId => {
        loadedMessageIds.current.add(messageId);
      });

      const newReactionsMap = result.data;

      setMessageReactions(prev => ({ ...prev, ...newReactionsMap }));
      setReactionsLoaded(true);
    };

    loadReactionsForNewMessages();
  }, [messageIds]); // Only depend on messageIds

  // Subscribe to real-time reaction changes (only for other users to avoid conflicts with optimistic UI)
  useEffect(() => {
    if (messageIds.length === 0) return;

    const subscription = reactionService.subscribeToReactionChanges(
      messageIds,
      (reaction, action) => {
        // Skip processing reactions from the current user to avoid conflicts with optimistic UI
        // The optimistic UI already handles the current user's reactions immediately
        if (reaction.userId === currentUserId) {
          return;
        }

        setMessageReactions(prev => {
          const updated = { ...prev };
          const currentReactions = updated[reaction.messageId] || [];

          if (action === 'create') {
            // Add new reaction from other users
            updated[reaction.messageId] = [...currentReactions, reaction];
          } else if (action === 'delete') {
            // Remove deleted reaction from other users
            updated[reaction.messageId] = currentReactions.filter(
              r => r.id !== reaction.id
            );
          }

          return updated;
        });
      },
      error => {
        console.error('Error subscribing to reaction changes:', error);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [messageIds, currentUserId]);

  // Handle scroll position preservation when loading older messages
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const previousMessageCount = lastMessageCountRef.current;
    const currentMessageCount = messages.length;

    // If messages were added and we have a previous count
    if (
      currentMessageCount > previousMessageCount &&
      previousMessageCount > 0
    ) {
      if (lastLoadWasOlderMessages) {
        // Older messages were loaded - preserve scroll position
        const newMessagesAdded = currentMessageCount - previousMessageCount;

        // Use requestAnimationFrame to ensure DOM is updated
        requestAnimationFrame(() => {
          if (containerRef.current) {
            // Calculate approximate height per message to restore scroll position
            const averageMessageHeight =
              containerRef.current.scrollHeight / currentMessageCount;
            const scrollOffset = newMessagesAdded * averageMessageHeight;

            // Restore scroll position by scrolling down by the amount of new content added
            containerRef.current.scrollTop =
              scrollPositionRef.current + scrollOffset;
          }
        });
      } else {
        // New messages at the end - check if any are from current user (own messages)
        const newMessages = messages.slice(previousMessageCount);
        const hasOwnMessage = newMessages.some(
          msg => msg.senderId === currentUserId
        );

        // Always scroll for own messages, or if user was near bottom for others
        const isNearBottom =
          container.scrollHeight -
            container.scrollTop -
            container.clientHeight <
          150;

        if (hasOwnMessage || isNearBottom || shouldAutoScroll) {
          // Use requestAnimationFrame to ensure DOM updates are complete
          requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          });
        }
      }
    } else if (currentMessageCount > 0 && previousMessageCount === 0) {
      // Initial load - scroll to bottom
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }

    lastMessageCountRef.current = currentMessageCount;
  }, [
    messages,
    reactionsLoaded,
    lastLoadWasOlderMessages,
    currentUserId,
    shouldAutoScroll,
  ]);

  // Force auto-scroll when explicitly requested (for sent messages and initial load)
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      // Simple scroll with final delay to ensure completion
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });

      // Final scroll after delay to handle any late-loading content
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [shouldAutoScroll]);

  // Store scroll position continuously for pagination restoration
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const handleScroll = () => {
      scrollPositionRef.current = container.scrollTop;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for auto-loading more messages when scrolled to top
  useEffect(() => {
    if (!hasMoreMessages || isLoadingMore || !onLoadMoreMessages) return;

    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        if (entry.isIntersecting && containerRef.current) {
          // Store current scroll position before loading
          scrollPositionRef.current = containerRef.current.scrollTop;
          onLoadMoreMessages();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '20px',
      }
    );

    const loadMoreElement = loadMoreRef.current;
    if (loadMoreElement) {
      observer.observe(loadMoreElement);
    }

    return () => {
      if (loadMoreElement) {
        observer.unobserve(loadMoreElement);
      }
    };
  }, [hasMoreMessages, isLoadingMore, onLoadMoreMessages]);

  // If no messages and still initializing, show empty container (parent will show loading)
  if (messages.length === 0 && isInitializing) {
    return (
      <div className='flex-1 overflow-y-auto bg-gray-50'>
        <div ref={messagesEndRef} />
      </div>
    );
  }

  // If no messages and not initializing, show empty state
  if (messages.length === 0 && !isInitializing) {
    return (
      <div
        className='flex-1 overflow-y-auto bg-gray-50'
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d1d5db' fill-opacity='0.08' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        <div className='max-w-5xl mx-auto px-4 py-8'>
          <div className='flex flex-col items-center justify-center text-center py-20'>
            <div className='w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4'>
              <svg
                className='w-8 h-8 text-gray-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                />
              </svg>
            </div>
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              No messages yet
            </h3>
            <p className='text-sm text-gray-500 max-w-sm'>
              Start the conversation! Send your first message to begin chatting.
            </p>
          </div>
          <div ref={messagesEndRef} />
        </div>
      </div>
    );
  }

  return (
    <div
      className='flex-1 overflow-y-auto bg-gray-50'
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d1d5db' fill-opacity='0.08' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      <div ref={containerRef} className='max-w-5xl mx-auto px-4 py-6'>
        {/* Load More Messages Button/Indicator */}
        {hasMoreMessages ? (
          <div ref={loadMoreRef} className='flex justify-center py-4'>
            {isLoadingMore ? (
              <div className='flex items-center space-x-2 text-gray-500'>
                <div className='animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full'></div>
                <span className='text-sm'>Loading older messages...</span>
              </div>
            ) : (
              <button
                onClick={onLoadMoreMessages}
                className='px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200'
              >
                Load older messages
              </button>
            )}
          </div>
        ) : (
          /* End of messages indicator */
          <div className='flex justify-center py-4'>
            <div className='flex items-center space-x-2 text-gray-400'>
              <div className='h-px bg-gray-300 w-8'></div>
              <span className='text-sm'>End of messages</span>
              <div className='h-px bg-gray-300 w-8'></div>
            </div>
          </div>
        )}

        {messages.map((message, index) => {
          const isOwnMessage = message.senderId === currentUserId;
          const prevMessage = index > 0 ? messages[index - 1] : null;
          const nextMessage =
            index < messages.length - 1 ? messages[index + 1] : null;

          // Check if we should show "new messages" separator before this message
          // Only show once at the beginning of the unread messages group using snapshot
          const isFirstUnreadMessage =
            unreadMessagesSnapshot &&
            !isOwnMessage &&
            unreadMessagesSnapshot.has(message.id) &&
            message.senderId !== 'SYSTEM' &&
            // Check if previous message was NOT in unread snapshot (indicating start of unread group)
            (prevMessage
              ? !unreadMessagesSnapshot.has(prevMessage.id) ||
                prevMessage.senderId === currentUserId ||
                prevMessage.senderId === 'SYSTEM'
              : true);

          const shouldShowNewMessagesSeparator =
            chatEnteredAt && isFirstUnreadMessage;

          // Check if messages are from same sender and within time threshold
          const isPrevFromSameSender =
            prevMessage?.senderId === message.senderId;
          const isNextFromSameSender =
            nextMessage?.senderId === message.senderId;

          // Calculate time difference with previous message (in minutes)
          const prevTimeDiff = prevMessage
            ? (new Date(message.timestamp || Date.now()).getTime() -
                new Date(prevMessage.timestamp || Date.now()).getTime()) /
              (1000 * 60)
            : 999;

          const nextTimeDiff = nextMessage
            ? (new Date(nextMessage.timestamp || Date.now()).getTime() -
                new Date(message.timestamp || Date.now()).getTime()) /
              (1000 * 60)
            : 999;

          // Group messages if same sender and within 2 minutes - Material Design spacing
          const isGroupedWithPrev = isPrevFromSameSender && prevTimeDiff <= 2;
          const isGroupedWithNext = isNextFromSameSender && nextTimeDiff <= 2;

          // Determine margins based on time difference - progressive spacing
          let marginTop = 'mt-4'; // default spacing
          let marginBottom = 'mb-4';

          if (isGroupedWithPrev) {
            // Very close messages (within 1 minute)
            if (prevTimeDiff <= 1) {
              marginTop = 'mt-0.5';
            } else {
              marginTop = 'mt-1';
            }
          } else {
            // Far apart messages get more spacing
            if (prevTimeDiff > 60) {
              // More than 1 hour
              marginTop = 'mt-12';
            } else if (prevTimeDiff > 30) {
              // More than 30 minutes
              marginTop = 'mt-10';
            } else if (prevTimeDiff > 10) {
              // More than 10 minutes
              marginTop = 'mt-8';
            } else {
              marginTop = 'mt-6';
            }
          }

          if (isGroupedWithNext) {
            if (nextTimeDiff <= 1) {
              marginBottom = 'mb-0.5';
            } else {
              marginBottom = 'mb-1';
            }
          } else {
            marginBottom = 'mb-4';
          }

          // Show avatar only for first message in group or standalone messages
          const showAvatar = !isOwnMessage && !isGroupedWithPrev;

          // Show sender name only for first message in group (not grouped with previous)
          const showSenderName = !isGroupedWithPrev;

          return (
            <React.Fragment key={message.id}>
              {/* New Messages Separator */}
              {shouldShowNewMessagesSeparator && (
                <div className='flex items-center justify-center my-4 px-4'>
                  <div className='flex items-center w-full max-w-xs'>
                    <div className='flex-1 h-px bg-gray-300'></div>
                    <div className='px-3 text-gray-500 text-xs font-medium'>
                      New messages
                    </div>
                    <div className='flex-1 h-px bg-gray-300'></div>
                  </div>
                </div>
              )}

              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={isOwnMessage}
                showAvatar={showAvatar}
                otherUserPresence={otherUserPresence}
                otherParticipantId={otherParticipantId}
                marginTop={marginTop}
                marginBottom={marginBottom}
                showSenderName={showSenderName}
                onReplyToMessage={onReplyToMessage}
                onDeleteMessage={onDeleteMessage}
                allMessages={messages}
                reactions={messageReactions[message.id] || []}
                currentUserId={currentUserId}
                onAddReaction={handleAddReaction}
                onToggleReaction={handleToggleReaction}
                showEmojiPicker={openEmojiPickerMessageId === message.id}
                onEmojiPickerToggle={() => handleEmojiPickerToggle(message.id)}
              />
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} className='h-4' />
      </div>
    </div>
  );
}
