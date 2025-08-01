'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

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



  // Handle adding/removing reactions
  const handleAddReaction = useCallback(
    async (messageId: string, emoji: string) => {
      // Find the message to get participants
      const message = messages.find(msg => msg.id === messageId);
      if (!message) return;

      const participants = [message.senderId, message.receiverId];

      const result = await reactionService.addReaction(
        messageId,
        currentUserId,
        emoji,
        participants
      );

      if (!result.error) {
        // Refresh reactions for this message
        const updatedReactions =
          await reactionService.getMessageReactions(messageId);
        if (!updatedReactions.error) {
          setMessageReactions(prev => ({
            ...prev,
            [messageId]: updatedReactions.data,
          }));
        }
      }

      // Close emoji picker after adding reaction
      setOpenEmojiPickerMessageId(null);
    },
    [messages, currentUserId]
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

  // Fetch reactions when messages change - before any scrolling
  useEffect(() => {
    const loadReactionsImmediately = async () => {
      if (messages.length === 0) {
        setReactionsLoaded(true);
        return;
      }

      setReactionsLoaded(false);

      // Load reactions synchronously to prevent layout shift
      const reactionPromises = messages.map(async message => {
        const result = await reactionService.getMessageReactions(message.id);
        return { messageId: message.id, reactions: result.data || [] };
      });

      const results = await Promise.all(reactionPromises);
      const reactionsMap = results.reduce(
        (acc, { messageId, reactions }) => {
          acc[messageId] = reactions;
          return acc;
        },
        {} as Record<string, MessageReaction[]>
      );

      setMessageReactions(reactionsMap);
      setReactionsLoaded(true);
    };

    loadReactionsImmediately();
  }, [messages]); // Direct dependency on messages, not fetchReactions

  // Subscribe to real-time reaction changes
  useEffect(() => {
    if (messages.length === 0) return;

    const messageIds = messages.map(msg => msg.id);

    const subscription = reactionService.subscribeToReactionChanges(
      messageIds,
      (reaction, action) => {
        setMessageReactions(prev => {
          const updated = { ...prev };
          const currentReactions = updated[reaction.messageId] || [];

          if (action === 'create') {
            // Add new reaction
            updated[reaction.messageId] = [...currentReactions, reaction];
          } else if (action === 'delete') {
            // Remove deleted reaction
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
  }, [messages]);

  // Handle scroll position preservation when loading older messages
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const previousMessageCount = lastMessageCountRef.current;
    const currentMessageCount = messages.length;

    // If messages were added and we have a previous count
    if (currentMessageCount > previousMessageCount && previousMessageCount > 0) {
      
      if (lastLoadWasOlderMessages) {
        // Older messages were loaded - preserve scroll position
        const newMessagesAdded = currentMessageCount - previousMessageCount;
        
        // Use requestAnimationFrame to ensure DOM is updated
        requestAnimationFrame(() => {
          if (containerRef.current) {
            // Calculate approximate height per message to restore scroll position
            const averageMessageHeight = containerRef.current.scrollHeight / currentMessageCount;
            const scrollOffset = newMessagesAdded * averageMessageHeight;
            
            // Restore scroll position by scrolling down by the amount of new content added
            containerRef.current.scrollTop = scrollPositionRef.current + scrollOffset;
          }
        });
      } else {
        // New messages at the end - check if any are from current user (own messages)
        const newMessages = messages.slice(previousMessageCount);
        const hasOwnMessage = newMessages.some(msg => msg.senderId === currentUserId);
        
        // Always scroll for own messages, or if user was near bottom for others
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
        
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
  }, [messages, reactionsLoaded, lastLoadWasOlderMessages, currentUserId, shouldAutoScroll]);

  // Force auto-scroll when explicitly requested (for sent messages)
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      // Double requestAnimationFrame to ensure all layout is complete
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        });
      });
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
      (entries) => {
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

  if (messages.length === 0) {
    return (
      <div className='flex-1 overflow-y-auto bg-gray-50' style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d1d5db' fill-opacity='0.08' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")` }}>
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
    <div className='flex-1 overflow-y-auto bg-gray-50' style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d1d5db' fill-opacity='0.08' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")` }}>
      <div ref={containerRef} className='max-w-5xl mx-auto px-4 py-6'>
        {/* Load More Messages Button/Indicator */}
        {hasMoreMessages && (
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
        )}
        
        {messages.map((message, index) => {
          const isOwnMessage = message.senderId === currentUserId;
          const prevMessage = index > 0 ? messages[index - 1] : null;
          const nextMessage =
            index < messages.length - 1 ? messages[index + 1] : null;

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
              showEmojiPicker={openEmojiPickerMessageId === message.id}
              onEmojiPickerToggle={() => handleEmojiPickerToggle(message.id)}
            />
          );
        })}
        <div ref={messagesEndRef} className='h-4' />
      </div>
    </div>
  );
}
