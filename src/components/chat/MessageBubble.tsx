'use client';

import type { Schema } from '../../../amplify/data/resource';
import UserAvatar from '../UserAvatar';

type Message = Schema['Message']['type'];
type UserPresence = Schema['UserPresence']['type'];

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar: boolean;
  otherUserPresence: UserPresence | null;
  otherParticipantId: string;
  marginTop: string;
  marginBottom: string;
}

export default function MessageBubble({
  message,
  isOwnMessage,
  showAvatar,
  otherUserPresence,
  otherParticipantId,
  marginTop,
  marginBottom,
}: MessageBubbleProps) {
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

  return (
    <div
      className={`flex ${marginTop} ${marginBottom} ${
        isOwnMessage ? 'justify-end' : 'justify-start'
      }`}
    >
      {showAvatar && !messageIsEmojiOnly ? (
        <UserAvatar
          email={otherUserPresence?.email}
          userId={otherParticipantId}
          size='sm'
          className='mr-3 flex-shrink-0'
        />
      ) : !isOwnMessage && !messageIsEmojiOnly ? (
        <div className='w-8 h-8 mr-3 flex-shrink-0' />
      ) : null}
      <div className='group relative'>
        {messageIsEmojiOnly ? (
          // Emoji-only messages without container
          <div className='text-4xl'>{message.content}</div>
        ) : (
          // Regular text messages with container
          <div
            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg border ${
              isOwnMessage
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-900 border-gray-200'
            }`}
          >
            <p className='text-sm leading-relaxed'>
              {renderMessageContent(message.content)}
            </p>
          </div>
        )}
        {/* Timestamp tooltip - shows on hover */}
        <div
          className={`absolute z-10 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap ${
            isOwnMessage
              ? 'right-full mr-2 top-1/2 -translate-y-1/2'
              : 'left-full ml-2 top-1/2 -translate-y-1/2'
          }`}
        >
          {formatMessageTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}
