'use client';

import { useRef, useEffect } from 'react';

import type { Schema } from '../../../amplify/data/resource';

import MessageBubble from './MessageBubble';

type Message = Schema['Message']['type'];
type UserPresence = Schema['UserPresence']['type'];

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  otherUserPresence: UserPresence | null;
  otherParticipantId: string;
  isInitializing: boolean;
}

export default function MessageList({
  messages,
  currentUserId,
  otherUserPresence,
  otherParticipantId,
  isInitializing,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-scroll to bottom when component finishes initializing
  useEffect(() => {
    if (!isInitializing && messages.length > 0) {
      // Use immediate scroll for initial load, then smooth for subsequent updates
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [isInitializing, messages.length]);

  if (messages.length === 0) {
    return (
      <div className='flex-1 overflow-y-auto bg-gray-50'>
        <div className='max-w-4xl mx-auto p-4 space-y-3'>
          <div className='text-center text-gray-500 py-12'>
            <div className='text-lg mb-2'>No messages yet</div>
            <div className='text-sm'>Start the conversation!</div>
          </div>
          <div ref={messagesEndRef} />
        </div>
      </div>
    );
  }

  return (
    <div className='flex-1 overflow-y-auto bg-gray-50'>
      <div className='max-w-4xl mx-auto p-4 space-y-3'>
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

          // Group messages if same sender and within 2 minutes
          const isGroupedWithPrev = isPrevFromSameSender && prevTimeDiff <= 2;
          const isGroupedWithNext = isNextFromSameSender && nextTimeDiff <= 2;

          // Determine margins based on grouping
          const marginTop = isGroupedWithPrev ? 'mt-0.5' : 'mt-6';
          const marginBottom = isGroupedWithNext ? 'mb-0.5' : 'mb-6';

          // Show avatar only for first message in group or standalone messages
          const showAvatar = !isOwnMessage && !isGroupedWithPrev;

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
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
