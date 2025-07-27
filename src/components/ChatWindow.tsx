'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useState, useEffect, useRef } from 'react';

import type { Schema } from '../../amplify/data/resource';
import { chatService } from '../services/chat.service';
import { messageService } from '../services/message.service';

type Message = Schema['Message']['type'];
type Conversation = Schema['Conversation']['type'];

interface ChatWindowProps {
  conversation: Conversation;
  onChatEnded: () => void;
}

export default function ChatWindow({
  conversation,
  onChatEnded,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthenticator();

  // Calculate time remaining in probation
  useEffect(() => {
    if (!conversation.probationEndsAt || conversation.isConnected) {
      return;
    }

    const timer = setInterval(() => {
      if (!conversation.probationEndsAt) {
        return;
      }

      const now = new Date();
      const endTime = new Date(conversation.probationEndsAt);
      const diff = endTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Expired');
        clearInterval(timer);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m`);
        } else {
          setTimeLeft(`${minutes}m`);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [conversation.probationEndsAt, conversation.isConnected]);

  // Subscribe to messages
  useEffect(() => {
    if (!conversation.id) {
      return;
    }

    const subscription = messageService.observeMessages(
      conversation.id,
      msgs => {
        setMessages(msgs);
      },
      error => {
        console.error('Error observing messages:', error);
        setError('Failed to load messages');
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [conversation.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) {
      return;
    }

    setLoading(true);
    const result = await messageService.sendMessage(
      conversation.id,
      user.userId,
      newMessage.trim()
    );

    if (result.error) {
      setError(result.error);
    } else {
      setNewMessage('');
    }

    setLoading(false);
  };

  const handleEndChat = async () => {
    if (!user) {
      return;
    }

    const result = await chatService.endChat(conversation.id, user.userId);
    if (result.error) {
      setError(result.error);
    } else {
      onChatEnded();
    }
  };

  const handleContinueProbation = async () => {
    const result = await chatService.continueProbation(conversation.id);
    if (result.error) {
      setError(result.error);
    }
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

  const otherParticipantId =
    conversation.participant1Id === user?.userId
      ? conversation.participant2Id
      : conversation.participant1Id;

  return (
    <div className='bg-white rounded-lg shadow-md flex flex-col h-96'>
      {/* Chat Header */}
      <div className='p-4 border-b border-gray-200'>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='font-semibold text-gray-900'>
              Chat with Professional {otherParticipantId.slice(-4)}
            </h3>
            {!conversation.isConnected && (
              <div className='text-sm text-amber-600'>
                Probation period: {timeLeft} remaining
              </div>
            )}
          </div>

          {!conversation.isConnected && (
            <div className='flex space-x-2'>
              <button
                onClick={handleContinueProbation}
                className='px-3 py-1 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700'
              >
                Continue 7 days
              </button>
              <button
                onClick={handleEndChat}
                className='px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700'
              >
                End chat now
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className='flex-1 overflow-y-auto p-4 space-y-3'>
        {messages.length === 0 ? (
          <div className='text-center text-gray-500 py-8'>
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map(message => {
            const isOwnMessage = message.senderId === user?.userId;
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                    isOwnMessage
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  <div className='text-sm'>{message.content}</div>
                  <div
                    className={`text-xs mt-1 ${
                      isOwnMessage ? 'text-indigo-200' : 'text-gray-500'
                    }`}
                  >
                    {formatMessageTime(message.timestamp)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form
        onSubmit={handleSendMessage}
        className='p-4 border-t border-gray-200'
      >
        <div className='flex space-x-2'>
          <input
            type='text'
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder='Type your message...'
            className='flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
            disabled={loading}
          />
          <button
            type='submit'
            disabled={loading || !newMessage.trim()}
            className='px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Send
          </button>
        </div>
      </form>

      {error ? (
        <div className='p-3 bg-red-50 border-t border-red-200 text-red-600 text-sm'>
          {error}
        </div>
      ) : null}
    </div>
  );
}
