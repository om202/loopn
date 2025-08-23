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
import { MessageCircle } from 'lucide-react';

type Message = Schema['Message']['type'];

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
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
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);

  // Get message IDs for reactions subscription
  const messageIds = useMemo(() => messages.map(msg => msg.id), [messages]);

  const {
    messageReactions,
    isLoading: reactionsLoading,
    getReactionsForMessage,
    loadReactionsForMessage,
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

  const handleEmojiPickerToggle = useCallback(
    (messageId: string) => {
      setOpenEmojiPickerMessageId(prev => {
        const newValue = prev === messageId ? null : messageId;

        if (newValue === messageId) {
          loadReactionsForMessage(messageId);
        }

        return newValue;
      });
    },
    [loadReactionsForMessage]
  );

  const handleMessageActionsChange = useCallback(
    (messageId: string | null, isActive: boolean) => {
      setActiveMessageId(isActive ? messageId : null);
    },
    []
  );

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
      <div className='flex-1 overflow-y-auto bg-white'>
        <div ref={messagesEndRef} />
      </div>
    );
  }

  if (messages.length === 0 && !isInitializing) {
    return (
      <div className='flex-1 overflow-y-auto bg-white'>
        <div className='w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8'>
          <div className='flex flex-col items-center justify-center text-center py-20'>
            <div className='w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4'>
              <MessageCircle className='w-8 h-8 text-neutral-500' />
            </div>
            <h3 className='text-lg font-medium text-black mb-2'>
              No messages yet
            </h3>
            <p className='text-neutral-500 max-w-sm'>Send your first message</p>
          </div>
          <div ref={messagesEndRef} />
        </div>
      </div>
    );
  }

  return (
    <div className='flex-1 overflow-y-auto bg-white'>
      <div
        ref={containerRef}
        className='w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 flex flex-col gap-1'
      >
        {/* Load More Messages Button/Indicator */}
        {hasMoreMessages ? (
          <div ref={loadMoreRef} className='flex justify-center py-4'>
            {isLoadingMore ? (
              <div className='flex items-center space-x-2 text-neutral-500'>
                <div className='animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full'></div>
                <span className='text-sm'>Loading older messages...</span>
              </div>
            ) : (
              <button
                onClick={onLoadMoreMessages}
                className='px-4 py-2 text-sm text-brand-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors duration-200'
              >
                Load older messages
              </button>
            )}
          </div>
        ) : (
          <div className='flex justify-center py-4'>
            <div className='text-neutral-500'>
              <span className='text-sm'>End of messages</span>
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

          // Check if we should show a date separator
          const currentMessageDate = new Date(message.timestamp || Date.now());
          const prevMessageDate = prevMessage
            ? new Date(prevMessage.timestamp || Date.now())
            : null;

          const shouldShowDateSeparator =
            !prevMessageDate ||
            currentMessageDate.toDateString() !==
              prevMessageDate.toDateString();

          const getDateSeparatorText = (date: Date) => {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const timeString = date.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            });

            if (date.toDateString() === today.toDateString()) {
              return `Today at ${timeString}`;
            } else if (date.toDateString() === yesterday.toDateString()) {
              return `Yesterday at ${timeString}`;
            } else {
              const dateString = date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });
              return `${dateString} at ${timeString}`;
            }
          };

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

          let marginTop = 'mt-0';
          let marginBottom = 'mb-0';

          if (isGroupedWithPrev) {
            // Within same group - no spacing to touch
            marginTop = 'mt-0';
          } else {
            // Between different groups - much more spacing
            if (prevTimeDiff > 60) {
              marginTop = 'mt-8';
            } else if (prevTimeDiff > 30) {
              marginTop = 'mt-7';
            } else if (prevTimeDiff > 10) {
              marginTop = 'mt-6';
            } else {
              marginTop = 'mt-5';
            }
          }

          if (isGroupedWithNext) {
            // Within same group - no spacing to touch
            marginBottom = 'mb-0';
          } else {
            // Between different groups - much more spacing
            marginBottom = 'mb-4';
          }

          const showAvatar = !isOwnMessage && !isGroupedWithPrev;

          const showSenderName = !isGroupedWithPrev;

          return (
            <React.Fragment key={message.id}>
              {shouldShowDateSeparator && (
                <div className='flex items-center justify-center my-6 px-4'>
                  <div className='text-neutral-500 text-sm'>
                    {getDateSeparatorText(currentMessageDate)}
                  </div>
                </div>
              )}

              {shouldShowNewMessagesSeparator && (
                <div className='flex items-center justify-center my-4 px-4'>
                  <div className='text-neutral-500 text-sm font-medium'>
                    New messages
                  </div>
                </div>
              )}

              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={isOwnMessage}
                showAvatar={showAvatar}
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
                onMessageActionsChange={handleMessageActionsChange}
                isOtherMessageActive={
                  activeMessageId !== null && activeMessageId !== message.id
                }
              />
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} className='h-4' />
      </div>
    </div>
  );
}
