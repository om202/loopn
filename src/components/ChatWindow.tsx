'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageBox } from 'react-chat-elements';
import 'react-chat-elements/dist/main.css';

import type { Schema } from '../../amplify/data/resource';
import { chatService } from '../services/chat.service';
import { messageService } from '../services/message.service';
import { userService } from '../services/user.service';

import LoadingContainer from './LoadingContainer';
import UserAvatar from './UserAvatar';

type Message = Schema['Message']['type'];
type Conversation = Schema['Conversation']['type'];
type UserPresence = Schema['UserPresence']['type'];

interface ChatWindowProps {
  conversation: Conversation;
  onChatEnded: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export default function ChatWindow({
  conversation,
  onChatEnded,
  isLoading: externalLoading = false,
  error: externalError = null,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [otherUserPresence, setOtherUserPresence] =
    useState<UserPresence | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthenticator();

  // Get the other participant's ID
  const otherParticipantId =
    conversation.participant1Id === user?.userId
      ? conversation.participant2Id
      : conversation.participant1Id;

  // Calculate initial time remaining immediately
  const calculateTimeLeft = useCallback(() => {
    if (!conversation.probationEndsAt || conversation.isConnected) {
      return '';
    }

    const now = new Date();
    const endTime = new Date(conversation.probationEndsAt);
    const diff = endTime.getTime() - now.getTime();

    if (diff <= 0) {
      return 'Expired';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    // Show shorter format based on time remaining
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 5) {
      return `${minutes}m`;
    }
    // Show seconds when less than 5 minutes
    return `${minutes}m ${seconds}s`;
  }, [conversation.probationEndsAt, conversation.isConnected]);

  // Initialize time left immediately
  useEffect(() => {
    setTimeLeft(calculateTimeLeft());
  }, [calculateTimeLeft]);

  const getPresenceDisplay = useCallback(() => {
    if (!otherUserPresence) {
      return { text: 'Unknown', color: 'text-gray-500', dot: 'bg-gray-400' };
    }

    const now = new Date();
    const lastSeen = otherUserPresence.lastSeen
      ? new Date(otherUserPresence.lastSeen)
      : null;
    const isRecent =
      lastSeen && now.getTime() - lastSeen.getTime() < 5 * 60 * 1000; // 5 minutes

    switch (otherUserPresence.status) {
      case 'ONLINE':
        return { text: 'Online', color: 'text-green-600', dot: 'bg-green-500' };
      case 'BUSY':
        return { text: 'Busy', color: 'text-red-600', dot: 'bg-red-500' };
      case 'OFFLINE':
      default:
        if (isRecent) {
          return {
            text: 'Recently active',
            color: 'text-yellow-600',
            dot: 'bg-yellow-500',
          };
        }
        return { text: 'Offline', color: 'text-gray-500', dot: 'bg-gray-400' };
    }
  }, [otherUserPresence]);

  const handleEndChat = useCallback(async () => {
    if (!user) {
      return;
    }

    const result = await chatService.endChat(conversation.id, user.userId);
    if (result.error) {
      setError(result.error);
    } else {
      onChatEnded();
    }
  }, [conversation.id, user, onChatEnded]);

  // Calculate time remaining in probation - now just updates the existing state
  useEffect(() => {
    if (!conversation.probationEndsAt || conversation.isConnected) {
      return;
    }

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      if (newTimeLeft === 'Expired') {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [conversation.probationEndsAt, conversation.isConnected, calculateTimeLeft]);

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

  // Subscribe to other user's presence using existing real-time subscription
  useEffect(() => {
    if (!otherParticipantId) {
      return;
    }

    const subscription = userService.observeUserPresence(
      otherParticipantId,
      presence => {
        setOtherUserPresence(presence);
      },
      error => {
        console.error('Error observing user presence:', error);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [otherParticipantId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize all data before showing UI
  useEffect(() => {
    // If there's external loading or no conversation data, keep initializing
    if (externalLoading || !conversation.id) {
      return;
    }

    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [externalLoading, conversation.id]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !user || loading) {
      return;
    }

    setLoading(true);
    messageService
      .sendMessage(conversation.id, user.userId, newMessage.trim())
      .then(result => {
        if (result.error) {
          setError(result.error);
        } else {
          setNewMessage('');
        }
        setLoading(false);
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

  const getUserDisplayName = () => {
    return otherUserPresence?.email || `User ${otherParticipantId.slice(-4)}`;
  };

  const getUserLetterItem = () => ({
    id: otherParticipantId,
    letter: getUserDisplayName().charAt(0).toUpperCase(),
  });

    // Show loading state while initializing or external loading
  if (isInitializing || externalLoading) {
    return (
      <LoadingContainer size='lg'/>
    );
  }

  return (
    <div className='flex flex-col h-full bg-white'>
      {/* Header with user info and avatar */}
      <div className='flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4'>
        <div className='flex items-center gap-3'>
          {/* Back Button */}
          <button
            onClick={() => window.history.back()}
            className='text-gray-500 hover:text-gray-700 mr-2'
          >
            <svg
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 19l-7-7 7-7'
              />
            </svg>
          </button>

          {/* Custom UserAvatar */}
          <UserAvatar
            email={otherUserPresence?.email}
            userId={otherParticipantId}
            size='md'
            showStatus
            status={otherUserPresence?.status}
          />

          <div className='flex-1'>
            <div className='font-semibold text-gray-900'>
              {getUserDisplayName()}
            </div>
            <div className='flex items-center gap-2'>
              {!conversation.isConnected && timeLeft && timeLeft !== 'Expired' ? (
                <span className='text-sm text-gray-600'>
                  Building connection · {timeLeft} remaining · <button
                    onClick={handleEndChat}
                    className='text-gray-500 hover:text-gray-700 underline transition-colors cursor-pointer'
                  >
                    End Now
                  </button>
                </span>
              ) : (
                <span className={`text-sm ${getPresenceDisplay().color}`}>
                  {getPresenceDisplay().text}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className='flex-1 overflow-y-auto bg-gray-50'>
        <div className='max-w-4xl mx-auto p-4 space-y-3'>
          {messages.length === 0 ? (
            <div className='text-center text-gray-500 py-12'>
              <div className='text-lg mb-2'>No messages yet</div>
              <div className='text-sm'>Start the conversation!</div>
            </div>
          ) : (
            <>
              {messages.map(message => {
                const isOwnMessage = message.senderId === user?.userId;
                return (
                  <MessageBox
                    key={message.id}
                    id={message.id}
                    position={isOwnMessage ? 'right' : 'left'}
                    type='text'
                    title=''
                    titleColor='transparent'
                    text={message.content}
                    date={new Date(message.timestamp || Date.now())}
                    dateString={formatMessageTime(message.timestamp)}
                    status={isOwnMessage ? 'sent' : 'received'}
                    avatar={!isOwnMessage ? '' : undefined}
                    letterItem={!isOwnMessage ? getUserLetterItem() : undefined}
                    notch
                    focus={false}
                    forwarded={false}
                    replyButton={false}
                    removeButton={false}
                    retracted={false}
                  />
                );
              })}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input - Custom implementation with send button */}
      <div className='flex-shrink-0 bg-white border-t border-gray-200 p-4'>
        <div className='max-w-4xl mx-auto'>
          <div className='flex gap-3 items-end'>
            <div className='flex-1'>
              <input
                type='text'
                placeholder='Type your message...'
                value={newMessage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewMessage(e.target.value)
                }
                disabled={loading}
                onKeyPress={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className='w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-gray-50 disabled:opacity-50'
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={loading || !newMessage.trim()}
              className='px-6 py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed'
              style={{
                minWidth: '80px',
              }}
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>

      {(error || externalError) ? (
        <div className='flex-shrink-0 p-4 bg-red-50 border-t border-red-200 text-red-600 text-sm'>
          <div className='max-w-4xl mx-auto'>{error || externalError}</div>
        </div>
      ) : null}
    </div>
  );
}
