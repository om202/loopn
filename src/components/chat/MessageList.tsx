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
import { soundService } from '../../services/sound.service';
import { useRealtimeReactions } from '../../hooks/realtime';

type Message = Schema['Message']['type'];
type UserPresence = Schema['UserPresence']['type'];

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
  const [openEmojiPickerMessageId, setOpenEmojiPickerMessageId] = useState<
    string | null
  >(null);
  const [animationTriggers, setAnimationTriggers] = useState<
    Record<string, string>
  >({});

  // Get message IDs for reactions subscription
  const messageIds = useMemo(() => messages.map(msg => msg.id), [messages]);

  // Use our new realtime reactions hook
  const {
    messageReactions,
    isLoading: reactionsLoading,

    getReactionsForMessage,
    addOptimisticReaction,
    removeOptimisticReaction,
    updateReactionsForMessage,
  } = useRealtimeReactions({
    messageIds,
    currentUserId,
    enabled: messageIds.length > 0,
  });

  const reactionsLoaded = !reactionsLoading;

  const handleAddReaction = useCallback(
    async (messageId: string, emoji: string) => {
      const message = messages.find(msg => msg.id === messageId);
      if (!message) return;

      const participants = [message.senderId, message.receiverId];

      const optimisticReaction = {
        id: `temp-${Date.now()}-${Math.random()}`,
        messageId,
        userId: currentUserId,
        emoji,
        timestamp: new Date().toISOString(),
        participants,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addOptimisticReaction(messageId, optimisticReaction);

      soundService.playPopSound();
      setAnimationTriggers(prev => ({ ...prev, [messageId]: emoji }));

      setTimeout(() => {
        setAnimationTriggers(prev => {
          const updated = { ...prev };
          delete updated[messageId];
          return updated;
        });
      }, 100);

      setOpenEmojiPickerMessageId(null);

      try {
        const result = await reactionService.addReaction(
          messageId,
          currentUserId,
          emoji,
          participants,
          true
        );

        if (result.error) {
          // Revert optimistic update
          removeOptimisticReaction(messageId, optimisticReaction.id);
          console.error('Failed to add reaction:', result.error);
        } else {
          // Fetch updated reactions and replace optimistic with real data
          const updatedReactions =
            await reactionService.getMessageReactions(messageId);
          if (!updatedReactions.error) {
            updateReactionsForMessage(messageId, updatedReactions.data);
          }
        }
      } catch (error) {
        // Revert optimistic update
        removeOptimisticReaction(messageId, optimisticReaction.id);
        console.error('Network error while adding reaction:', error);
      }
    },
    [
      messages,
      currentUserId,
      addOptimisticReaction,
      removeOptimisticReaction,
      updateReactionsForMessage,
    ]
  );

  const handleToggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      const message = messages.find(msg => msg.id === messageId);
      if (!message) return;

      const participants = [message.senderId, message.receiverId];
      const currentReactions = getReactionsForMessage(messageId);
      const existingReaction = currentReactions.find(
        reaction =>
          reaction.userId === currentUserId && reaction.emoji === emoji
      );
      let removedReactionId: string | null = null;
      let addedReaction: {
        id: string;
        messageId: string;
        userId: string;
        emoji: string;
        timestamp: string;
        participants: string[];
      } | null = null;

      if (existingReaction) {
        // Remove existing reaction optimistically
        removeOptimisticReaction(messageId, existingReaction.id);
        removedReactionId = existingReaction.id;
      } else {
        // Add new reaction optimistically
        const optimisticReaction = {
          id: `temp-${Date.now()}-${Math.random()}`,
          messageId,
          userId: currentUserId,
          emoji,
          timestamp: new Date().toISOString(),
          participants,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        addOptimisticReaction(messageId, optimisticReaction);
        addedReaction = optimisticReaction;
      }

      try {
        const result = await reactionService.addReaction(
          messageId,
          currentUserId,
          emoji,
          participants,
          false
        );

        if (result.error) {
          // Revert optimistic update
          if (removedReactionId && existingReaction) {
            addOptimisticReaction(messageId, existingReaction);
          } else if (addedReaction) {
            removeOptimisticReaction(messageId, addedReaction.id);
          }
          console.error('Failed to toggle reaction:', result.error);
        } else {
          // Fetch updated reactions and replace optimistic with real data
          const updatedReactions =
            await reactionService.getMessageReactions(messageId);
          if (!updatedReactions.error) {
            updateReactionsForMessage(messageId, updatedReactions.data);
          }
        }
      } catch (error) {
        // Revert optimistic update
        if (removedReactionId && existingReaction) {
          addOptimisticReaction(messageId, existingReaction);
        } else if (addedReaction) {
          removeOptimisticReaction(messageId, addedReaction.id);
        }
        console.error('Network error while toggling reaction:', error);
      }
    },
    [
      messages,
      currentUserId,
      getReactionsForMessage,
      addOptimisticReaction,
      removeOptimisticReaction,
      updateReactionsForMessage,
    ]
  );

  const handleEmojiPickerToggle = useCallback((messageId: string) => {
    setOpenEmojiPickerMessageId(prev =>
      prev === messageId ? null : messageId
    );
  }, []);

  useEffect(() => {
    const handleClickAway = (event: MouseEvent) => {
      if (!openEmojiPickerMessageId) return;

      const target = event.target as Element;

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

  // Note: Reaction loading logic moved to useRealtimeReactions hook

  // Note: Reaction subscription logic moved to useRealtimeReactions hook

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const previousMessageCount = lastMessageCountRef.current;
    const currentMessageCount = messages.length;

    if (
      currentMessageCount > previousMessageCount &&
      previousMessageCount > 0
    ) {
      if (lastLoadWasOlderMessages) {
        const newMessagesAdded = currentMessageCount - previousMessageCount;

        requestAnimationFrame(() => {
          if (containerRef.current) {
            const averageMessageHeight =
              containerRef.current.scrollHeight / currentMessageCount;
            const scrollOffset = newMessagesAdded * averageMessageHeight;

            containerRef.current.scrollTop =
              scrollPositionRef.current + scrollOffset;
          }
        });
      } else {
        const newMessages = messages.slice(previousMessageCount);
        const hasOwnMessage = newMessages.some(
          msg => msg.senderId === currentUserId
        );

        const isNearBottom =
          container.scrollHeight -
            container.scrollTop -
            container.clientHeight <
          150;

        if (hasOwnMessage || isNearBottom || shouldAutoScroll) {
          requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          });
        }
      }
    } else if (currentMessageCount > 0 && previousMessageCount === 0) {
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

  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [shouldAutoScroll]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const handleScroll = () => {
      scrollPositionRef.current = container.scrollTop;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!hasMoreMessages || isLoadingMore || !onLoadMoreMessages) return;

    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        if (entry.isIntersecting && containerRef.current) {
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

  if (messages.length === 0 && isInitializing) {
    return (
      <div className='flex-1 overflow-y-auto bg-gray-50'>
        <div ref={messagesEndRef} />
      </div>
    );
  }

  if (messages.length === 0 && !isInitializing) {
    return (
      <div
        className='flex-1 overflow-y-auto'
        style={{
          background:
            'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #f3f4f6 100%)',
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
      className='flex-1 overflow-y-auto'
      style={{
        background:
          'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #f3f4f6 100%)',
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

          const isFirstUnreadMessage =
            unreadMessagesSnapshot &&
            !isOwnMessage &&
            unreadMessagesSnapshot.has(message.id) &&
            message.senderId !== 'SYSTEM' &&
            (prevMessage
              ? !unreadMessagesSnapshot.has(prevMessage.id) ||
                prevMessage.senderId === currentUserId ||
                prevMessage.senderId === 'SYSTEM'
              : true);

          const shouldShowNewMessagesSeparator =
            chatEnteredAt && isFirstUnreadMessage;

          const isPrevFromSameSender =
            prevMessage?.senderId === message.senderId;
          const isNextFromSameSender =
            nextMessage?.senderId === message.senderId;

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

          const isGroupedWithPrev = isPrevFromSameSender && prevTimeDiff <= 2;
          const isGroupedWithNext = isNextFromSameSender && nextTimeDiff <= 2;

          let marginTop = 'mt-2';
          let marginBottom = 'mb-2';

          if (isGroupedWithPrev) {
            if (prevTimeDiff <= 1) {
              marginTop = 'mt-0.5';
            } else {
              marginTop = 'mt-1';
            }
          } else {
            if (prevTimeDiff > 60) {
              marginTop = 'mt-6';
            } else if (prevTimeDiff > 30) {
              marginTop = 'mt-5';
            } else if (prevTimeDiff > 10) {
              marginTop = 'mt-4';
            } else {
              marginTop = 'mt-3';
            }
          }

          if (isGroupedWithNext) {
            if (nextTimeDiff <= 1) {
              marginBottom = 'mb-0.5';
            } else {
              marginBottom = 'mb-1';
            }
          } else {
            marginBottom = 'mb-2';
          }

          const showAvatar = !isOwnMessage && !isGroupedWithPrev;

          const showSenderName = !isGroupedWithPrev;

          return (
            <React.Fragment key={message.id}>
              {shouldShowNewMessagesSeparator && (
                <div className='flex items-center justify-center my-4 px-4'>
                  <div className='flex items-center w-full max-w-xs'>
                    <div className='flex-1 h-px bg-gray-300'></div>
                    <div className='px-3 text-gray-500 text-sm font-medium'>
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
                animationTrigger={animationTriggers[message.id]}
              />
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} className='h-4' />
      </div>
    </div>
  );
}
