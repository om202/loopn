'use client';

import type { Schema } from '../../../amplify/data/resource';

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
      <div className='group relative max-w-xs sm:max-w-sm lg:max-w-md'>
        {messageIsEmojiOnly ? (
          // Emoji-only messages without container
          <div className='text-4xl leading-none'>{message.content}</div>
        ) : (
          // Regular text messages with Material Design bubble styling
          <div
            className={`px-4 py-3 rounded-2xl border ${
              isOwnMessage
                ? 'bg-indigo-600 text-white border-indigo-600 rounded-br-md'
                : 'bg-white text-gray-900 border-gray-200 rounded-bl-md'
            }`}
          >
            <p className='text-sm leading-relaxed break-words'>
              {renderMessageContent(message.content)}
            </p>
          </div>
        )}
        {/* Timestamp tooltip - shows on hover with Material Design styling */}
        <div
          className={`absolute z-20 px-3 py-1.5 text-xs text-white bg-gray-900 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap ${
            isOwnMessage
              ? 'right-full mr-3 top-1/2 -translate-y-1/2'
              : 'left-full ml-3 top-1/2 -translate-y-1/2'
          }`}
        >
          {formatMessageTime(message.timestamp)}
          {/* Arrow pointing to message */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-0 h-0 ${
              isOwnMessage
                ? 'left-full border-l-4 border-l-gray-900 border-t-2 border-b-2 border-t-transparent border-b-transparent'
                : 'right-full border-r-4 border-r-gray-900 border-t-2 border-b-2 border-t-transparent border-b-transparent'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
