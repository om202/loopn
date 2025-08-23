'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import type { Schema } from '../../../amplify/data/resource';
import UserAvatar from '../UserAvatar';
import EmojiPicker from '../EmojiPicker';
import MessageReactions from '../MessageReactions';
import DeleteConfirmationDialog from '../DeleteConfirmationDialog';
import { soundService } from '../../services/sound.service';
import { useUserProfile } from '../../hooks/useUserProfile';
import {
  isEmojiOnly,
  isEmoji,
  splitTextWithEmojis,
  convertEmoticonsToEmojis,
} from '../../lib/emoji-utils';

type Message = Schema['Message']['type'];
type MessageReaction = Schema['MessageReaction']['type'];

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar: boolean;
  otherParticipantId: string;
  marginTop: string;
  marginBottom: string;
  showSenderName: boolean;
  onReplyToMessage?: (message: Message) => void;
  onDeleteMessage?: (messageId: string) => void;
  allMessages?: Message[];
  reactions?: MessageReaction[];
  currentUserId: string;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
  showEmojiPicker: boolean;
  onEmojiPickerToggle: () => void;
  animationTrigger?: string;
  onMessageActionsChange?: (
    messageId: string | null,
    isActive: boolean
  ) => void;
  isOtherMessageActive?: boolean;
}

const MessageTicks = ({ isOptimistic }: { isOptimistic: boolean }) => {
  return (
    <div className='flex items-center select-none'>
      {isOptimistic ? (
        <Image
          src='/tick.svg'
          alt='sent'
          width={22}
          height={22}
          className='opacity-30 filter brightness-0 invert select-none'
        />
      ) : (
        <Image
          src='/double_tick.svg'
          alt='delivered'
          width={22}
          height={22}
          className='opacity-50 filter brightness-0 invert select-none'
        />
      )}
    </div>
  );
};

export default function MessageBubble({
  message,
  isOwnMessage,
  otherParticipantId,
  marginTop,
  marginBottom,
  showSenderName,
  onReplyToMessage,
  onDeleteMessage,
  allMessages = [],
  reactions = [],
  currentUserId,
  onAddReaction,
  onToggleReaction,
  showEmojiPicker,
  onEmojiPickerToggle,
  animationTrigger,
  onMessageActionsChange,
  isOtherMessageActive = false,
}: MessageBubbleProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showActionsOnMobile, setShowActionsOnMobile] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartTimeRef = useRef<number>(0);

  // Use optimized profile hook with caching instead of local state and API calls
  const { profile: userProfile } = useUserProfile(
    isOwnMessage ? '' : otherParticipantId
  );

  // Detect touch device
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Long press handlers
  const handleLongPressStart = useCallback(() => {
    if (isTouchDevice) {
      longPressTimerRef.current = setTimeout(() => {
        setShowActionsOnMobile(true);
        onMessageActionsChange?.(message.id, true);
        // Provide haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }, 500); // 500ms long press
    }
  }, [isTouchDevice, onMessageActionsChange, message.id]);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleTouchStart = useCallback(() => {
    touchStartTimeRef.current = Date.now();
    handleLongPressStart();
  }, [handleLongPressStart]);

  const handleTouchEnd = useCallback(() => {
    handleLongPressEnd();
    // Don't auto-hide on quick tap - let user click away to dismiss
  }, [handleLongPressEnd]);

  // Hide actions when clicking elsewhere
  useEffect(() => {
    const handleClickAway = (event: Event) => {
      if (showActionsOnMobile) {
        const target = event.target as Element;
        const messageContainer = target.closest(
          '[data-message-id="' + message.id + '"]'
        );
        // Only hide if clicking outside this specific message
        if (!messageContainer) {
          setShowActionsOnMobile(false);
          onMessageActionsChange?.(null, false);
        }
      }
    };

    if (showActionsOnMobile) {
      document.addEventListener('touchstart', handleClickAway);
      document.addEventListener('click', handleClickAway);
    }

    return () => {
      document.removeEventListener('touchstart', handleClickAway);
      document.removeEventListener('click', handleClickAway);
    };
  }, [showActionsOnMobile, message.id, onMessageActionsChange]);

  const renderMessageContent = (
    content: string,
    isEmojiOnlyMessage = false
  ) => {
    const parts = splitTextWithEmojis(content);

    return parts.map(part => {
      if (isEmoji(part)) {
        return (
          <span
            key={`emoji-${part}-${Math.random()}`}
            className={`mx-0.5 inline-block ${isEmojiOnlyMessage ? '' : 'text-2xl'}`}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const messageIsEmojiOnly = isEmojiOnly(message.content);

  const repliedToMessage = message.replyToMessageId
    ? allMessages.find(msg => msg.id === message.replyToMessageId)
    : null;

  const getRepliedToContent = (content: string) => {
    const convertedContent = convertEmoticonsToEmojis(content);
    const maxLength = 50;
    return convertedContent.length > maxLength
      ? convertedContent.substring(0, maxLength) + '...'
      : convertedContent;
  };

  const handleReplyClick = () => {
    if (onReplyToMessage) {
      onReplyToMessage(message);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (onDeleteMessage) {
      onDeleteMessage(message.id);
    }
    setShowDeleteDialog(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
  };

  const handleEmojiSelect = (emoji: string) => {
    if (onAddReaction) {
      onAddReaction(message.id, emoji);
    }
  };

  const handleToggleReaction = (emoji: string) => {
    if (onToggleReaction) {
      onToggleReaction(message.id, emoji);
    }
  };

  const handleNewReaction = (reaction: MessageReaction) => {
    if (reaction.userId !== currentUserId) {
      soundService.playPopSound();
    }
  };

  return (
    <div
      className={`group flex flex-col ${marginTop} ${marginBottom} ${
        isOwnMessage ? 'items-end' : 'items-start'
      } transition-opacity duration-200 ${
        isOtherMessageActive && !showActionsOnMobile
          ? 'opacity-30'
          : 'opacity-100'
      }`}
      data-message-id={message.id}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleLongPressEnd}
    >
      <div className='relative flex items-center gap-3 max-w-full'>
        {/* Avatar container - always takes up space for other users to maintain consistent alignment */}
        {!isOwnMessage && (
          <div className='flex-shrink-0 w-8 h-8'>
            {showSenderName && (
              <UserAvatar
                email={userProfile?.email}
                userId={otherParticipantId}
                profilePictureUrl={userProfile?.profilePictureUrl}
                hasProfilePicture={userProfile?.hasProfilePicture || false}
                size='sm'
                showStatus={false}
              />
            )}
          </div>
        )}

        {/* Message content wrapper with relative positioning for actions */}
        <div
          className={`relative flex gap-2 min-w-0 ${isTouchDevice && showActionsOnMobile ? 'bg-brand-50 rounded-lg px-2 py-1' : ''}`}
        >
          <div className='relative max-w-[85vw] sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl'>
            {message.isDeleted ? (
              <div
                className={`p-2.5 rounded-2xl border shadow-sm ${
                  isOwnMessage
                    ? 'bg-gray-100 text-gray-500 border-gray-200 rounded-br-md'
                    : 'bg-gray-100 text-gray-500 border-gray-200 rounded-bl-md'
                }`}
              >
                <p className='text-sm italic select-none'>Message deleted</p>
              </div>
            ) : messageIsEmojiOnly ? (
              <div className='text-5xl leading-none select-none'>
                {renderMessageContent(message.content, true)}
              </div>
            ) : (
              <div
                className={`p-2.5 rounded-2xl shadow-sm ${
                  isOwnMessage
                    ? 'bg-brand-500 text-white border border-brand-500 rounded-br-md'
                    : 'bg-gray-100 text-black border border-gray-200 rounded-bl-md'
                }`}
              >
                {repliedToMessage && (
                  <div
                    className={`mb-2 pt-2 pb-2 border-l-2 pl-3 pr-3 ${
                      isOwnMessage
                        ? 'border-brand-300 bg-brand-500 bg-opacity-15'
                        : 'border-gray-400 bg-gray-100'
                    } rounded-r-xl`}
                  >
                    <div
                      className={`text-sm ${
                        isOwnMessage ? 'text-brand-100' : 'text-black'
                      } mb-1`}
                    >
                      Replying to{' '}
                      {repliedToMessage.senderId === message.senderId
                        ? 'yourself'
                        : repliedToMessage.senderId === otherParticipantId
                          ? 'Them'
                          : 'You'}
                    </div>
                    <div
                      className={`text-base ${
                        isOwnMessage ? 'text-brand-100' : 'text-black'
                      }`}
                    >
                      {getRepliedToContent(repliedToMessage.content)}
                    </div>
                  </div>
                )}

                <div className='relative'>
                  <p
                    className={`text-base leading-normal break-words select-none m-0 ${isOwnMessage ? 'pr-10' : 'pr-2'}`}
                  >
                    {renderMessageContent(message.content, false)}
                  </p>
                  {isOwnMessage && (
                    <div className='absolute bottom-0 right-0'>
                      <MessageTicks
                        isOptimistic={message.id.startsWith('temp-')}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {!message.isDeleted && (
              <div
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${reactions && reactions.length > 0 ? '-mt-1.5' : ''}`}
              >
                <MessageReactions
                  reactions={reactions}
                  currentUserId={currentUserId}
                  onToggleReaction={handleToggleReaction}
                  onNewReaction={handleNewReaction}
                  triggerAnimation={animationTrigger}
                />
              </div>
            )}
          </div>

          {onReplyToMessage && !message.isDeleted && (
            <div
              className={`absolute ${
                isTouchDevice
                  ? `bottom-full mb-2 ${isOwnMessage ? 'right-0' : 'left-0'}`
                  : `top-1/2 -translate-y-1/2 ${isOwnMessage ? 'right-full mr-3' : 'left-full ml-3'}`
              } ${showEmojiPicker || (isTouchDevice && showActionsOnMobile) ? 'flex opacity-100' : isTouchDevice ? 'hidden' : 'hidden group-hover:flex group-hover:opacity-100'} transition-all duration-200 ease-out items-center ${
                isOwnMessage ? 'flex-row-reverse' : 'flex-row'
              } z-10`}
            >
              <div
                className={`bg-white/95 backdrop-blur-md border border-gray-200 rounded-full px-2 py-1.5 gap-3 flex items-center ${
                  isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <button
                  onClick={handleReplyClick}
                  className='p-1 hover:bg-brand-50 hover:rounded-full rounded transition-all duration-200 flex items-center justify-center group'
                  title='Reply'
                >
                  <svg
                    className='w-4 h-4 text-gray-500 group-hover:text-brand-600 group-hover:scale-110 transition-all duration-200'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6'
                    />
                  </svg>
                </button>

                {isOwnMessage && onDeleteMessage && !message.isDeleted && (
                  <button
                    onClick={handleDeleteClick}
                    className='p-1 hover:bg-b_red-100 hover:rounded-full rounded transition-all duration-200 flex items-center justify-center group'
                    title='Delete message'
                  >
                    <svg
                      className='w-4 h-4 text-gray-500 group-hover:text-b_red-500 group-hover:scale-110 transition-all duration-200'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                      />
                    </svg>
                  </button>
                )}

                <div className='relative'>
                  <button
                    onClick={onEmojiPickerToggle}
                    data-emoji-button
                    className={`p-1 rounded transition-all duration-200 flex items-center justify-center group ${
                      showEmojiPicker
                        ? 'bg-b_yellow-100 rounded-full'
                        : 'hover:bg-b_yellow-100 hover:rounded-full'
                    }`}
                    title='Add reaction'
                  >
                    <svg
                      className={`w-4 h-4 group-hover:scale-110 transition-all duration-200 ${
                        showEmojiPicker
                          ? 'text-b_yellow-500'
                          : 'text-gray-500 group-hover:text-b_yellow-500'
                      }`}
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                  </button>
                  {showEmojiPicker && (
                    <EmojiPicker
                      isOpen={showEmojiPicker}
                      onEmojiSelect={handleEmojiSelect}
                      onClose={() => {}}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
