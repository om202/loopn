'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Schema } from '../../../amplify/data/resource';
import UserAvatar from '../UserAvatar';
import EmojiPicker from '../EmojiPicker';
import MessageReactions from '../MessageReactions';
import DeleteConfirmationDialog from '../DeleteConfirmationDialog';
import { soundService } from '../../services/sound.service';

type Message = Schema['Message']['type'];
type UserPresence = Schema['UserPresence']['type'];
type MessageReaction = Schema['MessageReaction']['type'];

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar: boolean;
  otherUserPresence: UserPresence | null;
  otherParticipantId: string;
  marginTop: string;
  marginBottom: string;
  showSenderName: boolean;
  onReplyToMessage?: (message: Message) => void;
  onDeleteMessage?: (messageId: string) => void;
  allMessages?: Message[]; // For finding replied-to messages
  reactions?: MessageReaction[]; // Reactions for this message
  currentUserId: string; // Current user ID for reaction handling
  onAddReaction?: (messageId: string, emoji: string) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
  showEmojiPicker: boolean; // Controlled by parent
  onEmojiPickerToggle: () => void; // Handled by parent
}

// Tick indicator component
const MessageTicks = ({ isOptimistic }: { isOptimistic: boolean }) => {
  return (
    <div className='flex items-center'>
      {isOptimistic ? (
        // Single tick for optimistic (sending) messages
        <Image
          src='/tick.svg'
          alt='sent'
          width={20}
          height={20}
          className='opacity-30 filter brightness-0 invert'
        />
      ) : (
        // Double tick for successfully sent messages
        <Image
          src='/double_tick.svg'
          alt='delivered'
          width={20}
          height={20}
          className='opacity-50 filter brightness-0 invert'
        />
      )}
    </div>
  );
};

export default function MessageBubble({
  message,
  isOwnMessage,
  otherUserPresence,
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
}: MessageBubbleProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Check if message contains only emojis
  const isEmojiOnly = (text: string) => {
    if (!text.trim()) {
      return false;
    }
    // Remove all emojis and check if anything remains
    const withoutEmojis = text
      .replace(
        /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
        ''
      )
      .trim();
    return withoutEmojis === '';
  };

  // Render message content with larger emojis
  const renderMessageContent = (content: string) => {
    // Split content into parts (emojis and text)
    const parts = content.split(
      /([\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/gu
    );

    return parts.map(part => {
      // Check if this part is an emoji
      const isEmoji =
        /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu.test(
          part
        );

      if (isEmoji) {
        return (
          <span
            key={`emoji-${part}-${Math.random()}`}
            className='text-lg mx-0.5 inline-block'
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const formatMessageTime = (timestamp: string | null | undefined) => {
    if (!timestamp) {
      return 'Unknown time';
    }
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const messageIsEmojiOnly = isEmojiOnly(message.content);

  // Get sender display name with time
  const getSenderNameWithTime = () => {
    const senderName = isOwnMessage
      ? 'You'
      : otherUserPresence?.email || `User ${message.senderId.slice(-4)}`;
    const time = formatMessageTime(message.timestamp);
    return `${senderName} · ${time}`;
  };

  // Find the message this is replying to
  const repliedToMessage = message.replyToMessageId
    ? allMessages.find(msg => msg.id === message.replyToMessageId)
    : null;

  // Get display content for replied message (truncated)
  const getRepliedToContent = (content: string) => {
    const maxLength = 50;
    return content.length > maxLength
      ? content.substring(0, maxLength) + '...'
      : content;
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
    // Play pop sound when someone else reacts
    if (reaction.userId !== currentUserId) {
      soundService.playPopSound();
    }
  };

  return (
    <div
      className={`flex flex-col ${marginTop} ${marginBottom} ${
        isOwnMessage ? 'items-end' : 'items-start'
      }`}
    >
      <div className='group relative flex items-center gap-2'>
        {/* Avatar container - always takes up space for other users to maintain consistent alignment */}
        {!isOwnMessage && (
          <div className='flex-shrink-0 w-8 h-8'>
            {showSenderName && (
              <UserAvatar
                email={otherUserPresence?.email}
                userId={otherParticipantId}
                size='sm'
                showStatus={false}
              />
            )}
          </div>
        )}

        {/* Message content and actions wrapper */}
        <div
          className={`flex items-start gap-2 ${!isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
        >
          {/* Action icons with conditional positioning - hide for deleted messages */}
          {onReplyToMessage && !message.isDeleted && (
            <div
              className={`${showEmojiPicker ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-all duration-150 ease-out flex items-center gap-2 self-start ${
                !isOwnMessage ? 'ml-3' : 'mr-3'
              }`}
            >
              {/* Reply button */}
              <button
                onClick={handleReplyClick}
                className='w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors duration-150 flex items-center justify-center'
                title='Reply'
              >
                <svg
                  className='w-4 h-4 text-gray-600'
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

              {/* Delete button - only for own messages that aren't deleted */}
              {isOwnMessage && onDeleteMessage && !message.isDeleted && (
                <button
                  onClick={handleDeleteClick}
                  className='w-8 h-8 bg-gray-200 hover:bg-red-100 rounded-full transition-colors duration-150 flex items-center justify-center'
                  title='Delete message'
                >
                  <svg
                    className='w-4 h-4 text-gray-600 hover:text-red-600'
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

              {/* Emoji reaction button */}
              <div className='relative'>
                  <button
                    onClick={onEmojiPickerToggle}
                    data-emoji-button
                    className={`w-8 h-8 rounded-full transition-all duration-150 flex items-center justify-center ${
                      showEmojiPicker
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                    title='Add reaction'
                  >
                    <svg
                      className='w-4 h-4'
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
          )}

          <div className='relative max-w-xs sm:max-w-sm lg:max-w-lg'>
            {message.isDeleted ? (
              // Deleted message placeholder
              <div
                className={`px-3 py-2 rounded-2xl border ${
                  isOwnMessage
                    ? 'bg-gray-100 text-gray-500 border-gray-200 rounded-br-md'
                    : 'bg-gray-50 text-gray-500 border-gray-200 rounded-bl-md'
                }`}
              >
                <p className='text-sm italic'>Message deleted</p>
              </div>
            ) : messageIsEmojiOnly ? (
              // Emoji-only messages without container
              <div className='text-4xl leading-none'>{message.content}</div>
            ) : (
              // Regular text messages with Material Design bubble styling
              <div
                className={`px-3 py-2 rounded-2xl border ${
                  isOwnMessage
                    ? 'bg-blue-600 text-white border-blue-600 rounded-br-md'
                    : 'bg-white text-gray-900 border-gray-200 rounded-bl-md'
                }`}
              >
                {/* Reply preview */}
                {repliedToMessage && (
                  <div
                    className={`mb-2 pt-2 pb-2 border-l-2 pl-3 pr-3 ${
                      isOwnMessage
                        ? 'border-blue-300 bg-blue-500 bg-opacity-20'
                        : 'border-gray-400 bg-gray-100'
                    } rounded-r-lg`}
                  >
                    <div
                      className={`text-xs ${
                        isOwnMessage ? 'text-blue-100' : 'text-gray-600'
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
                      className={`text-xs ${
                        isOwnMessage ? 'text-blue-100' : 'text-gray-600'
                      }`}
                    >
                      {getRepliedToContent(repliedToMessage.content)}
                    </div>
                  </div>
                )}

                <div className='relative'>
                  <p className='text-sm leading-relaxed break-words pr-10'>
                    {renderMessageContent(message.content)}
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

            {/* Message reactions - hide for deleted messages */}
            {!message.isDeleted && (
              <div
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <MessageReactions
                  reactions={reactions}
                  currentUserId={currentUserId}
                  onToggleReaction={handleToggleReaction}
                  onNewReaction={handleNewReaction}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
