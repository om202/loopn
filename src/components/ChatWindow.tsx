'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import EmojiPicker from 'emoji-picker-react';
import { Send, Smile } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useRef, useCallback } from 'react';

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
  const [sendingConnectionRequest, setSendingConnectionRequest] =
    useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
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

  const handleSendConnectionRequest = useCallback(async () => {
    if (!user || sendingConnectionRequest) {
      return;
    }

    setSendingConnectionRequest(true);
    const result = await chatService.sendConnectionRequest(
      user.userId,
      otherParticipantId,
      conversation.id
    );

    if (result.error) {
      setError(result.error);
    }
    setSendingConnectionRequest(false);
  }, [user, otherParticipantId, conversation.id, sendingConnectionRequest]);

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
  }, [
    conversation.probationEndsAt,
    conversation.isConnected,
    calculateTimeLeft,
  ]);

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

  // Auto-scroll to bottom when component finishes initializing
  useEffect(() => {
    if (!isInitializing && messages.length > 0) {
      // Use immediate scroll for initial load, then smooth for subsequent updates
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [isInitializing, messages.length]);

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
    // Programmatically check conditions instead of disabling button
    if (!newMessage.trim() || !user || loading) {
      return;
    }

    const messageContent = newMessage.trim();
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const now = new Date().toISOString();
    
    // Create optimistic message
    const optimisticMessage: Message = {
      id: tempId,
      conversationId: conversation.id,
      senderId: user.userId,
      receiverId: otherParticipantId,
      content: messageContent,
      sortKey: `${now}-${tempId}`,
      messageType: 'TEXT',
      timestamp: now,
      isRead: false,
      isEdited: false,
      isDeleted: false,
      participants: [user.userId, otherParticipantId],
      createdAt: now,
      updatedAt: now,
    };

    // Immediately add to UI (optimistic update)
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    setLoading(true);

    // Send to server
    messageService
      .sendMessage(conversation.id, user.userId, messageContent)
      .then(result => {
        if (result.error) {
          // Rollback optimistic update on error
          setMessages(prev => prev.filter(msg => msg.id !== tempId));
          setNewMessage(messageContent); // Restore message text
          setError(result.error);
        }
        // Note: We don't need to add the message again on success because
        // the real-time subscription will handle adding the actual message
        setLoading(false);
      })
      .catch(() => {
        // Rollback on network error
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        setNewMessage(messageContent); // Restore message text
        setError('Failed to send message. Please try again.');
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

  // Check if message contains only emojis
  const isEmojiOnly = (text: string) => {
    if (!text.trim()) {
      return false;
    }
    // Remove all emojis and check if anything remains
    const withoutEmojis = text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
    return withoutEmojis === '';
  };

  // Render message content with larger emojis
  const renderMessageContent = (content: string) => {
    // Split content into parts (emojis and text)
    const parts = content.split(/([\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/gu);
    
    return parts.map((part, index) => {
      // Check if this part is an emoji
      const isEmoji = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu.test(part);
      
             if (isEmoji) {
         return (
           <span key={index} className="text-lg mx-0.5 inline-block">
             {part}
           </span>
         );
       }
       return part;
    });
  };

  // Auto-focus input when component is ready
  useEffect(() => {
    if (!isInitializing && !externalLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isInitializing, externalLoading]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showEmojiPicker]);

  const handleEmojiClick = (emojiData: { emoji: string }) => {
    setNewMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
    // Re-focus input after emoji selection
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Show loading state while initializing or external loading
  if (isInitializing || externalLoading) {
    return <LoadingContainer size='lg' />;
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
              {!conversation.isConnected &&
              timeLeft &&
              timeLeft !== 'Expired' ? (
                <span className='text-sm text-gray-600'>
                  Building connection · {timeLeft} remaining ·{' '}
                  <button
                    onClick={handleEndChat}
                    className='text-gray-500 hover:text-gray-700 underline transition-colors cursor-pointer'
                  >
                    End Now
                  </button>
                </span>
              ) : conversation.isConnected ? (
                <span className='text-sm text-green-600'>
                  Connected - Chat forever!
                </span>
              ) : (
                <span className={`text-sm ${getPresenceDisplay().color}`}>
                  {getPresenceDisplay().text}
                </span>
              )}
            </div>
          </div>

          {/* Connect Button - Right Side */}
          {!conversation.isConnected &&
            !!timeLeft &&
            timeLeft !== 'Expired' && (
              <button
                onClick={handleSendConnectionRequest}
                disabled={sendingConnectionRequest}
                className='flex items-center gap-3 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <Image
                  src='/connect-icon.svg'
                  alt='Connect'
                  width={20}
                  height={20}
                  className='flex-shrink-0'
                />
                <span className='text-base font-medium text-white'>
                  {sendingConnectionRequest ? 'Connecting...' : 'Connect'}
                </span>
              </button>
            )}
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
              {messages.map((message, index) => {
                const isOwnMessage = message.senderId === user?.userId;
                const prevMessage = index > 0 ? messages[index - 1] : null;
                const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
                
                // Check if messages are from same sender and within time threshold
                const isPrevFromSameSender = prevMessage?.senderId === message.senderId;
                const isNextFromSameSender = nextMessage?.senderId === message.senderId;
                
                // Calculate time difference with previous message (in minutes)
                const prevTimeDiff = prevMessage ? 
                  (new Date(message.timestamp || Date.now()).getTime() - new Date(prevMessage.timestamp || Date.now()).getTime()) / (1000 * 60) : 
                  999;
                
                const nextTimeDiff = nextMessage ? 
                  (new Date(nextMessage.timestamp || Date.now()).getTime() - new Date(message.timestamp || Date.now()).getTime()) / (1000 * 60) : 
                  999;
                
                // Group messages if same sender and within 2 minutes
                const isGroupedWithPrev = isPrevFromSameSender && prevTimeDiff <= 2;
                const isGroupedWithNext = isNextFromSameSender && nextTimeDiff <= 2;
                
                // Determine margins based on grouping
                const marginTop = isGroupedWithPrev ? 'mt-0.5' : 'mt-6';
                const marginBottom = isGroupedWithNext ? 'mb-0.5' : 'mb-6';
                
                // Show avatar only for first message in group or standalone messages
                const showAvatar = !isOwnMessage && !isGroupedWithPrev;
                const messageIsEmojiOnly = isEmojiOnly(message.content);
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${marginTop} ${marginBottom} ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
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
                    <div className="group relative">
                      {messageIsEmojiOnly ? (
                        // Emoji-only messages without container
                        <div className='text-4xl'>
                          {message.content}
                        </div>
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
                      <div className={`absolute z-10 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap ${
                        isOwnMessage 
                          ? 'right-full mr-2 top-1/2 -translate-y-1/2' 
                          : 'left-full ml-2 top-1/2 -translate-y-1/2'
                      }`}>
                        {formatMessageTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Emoji Picker - Separate container */}
      {showEmojiPicker === true && (
        <div className='flex-shrink-0 bg-white border-t border-gray-200 p-4'>
          <div className='max-w-4xl mx-auto flex justify-end'>
            <div ref={emojiPickerRef}>
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                autoFocusSearch={false}
                width={350}
                height={400}
                previewConfig={{
                  showPreview: false
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Message Input - Clean implementation with send button */}
      <div className='flex-shrink-0 bg-white border-t border-gray-200 p-4'>
        <div className='max-w-4xl mx-auto'>
          <div className='flex gap-3 items-end'>
            <div className='flex-1 relative'>
              <input
                ref={inputRef}
                type='text'
                placeholder='Type your message...'
                value={newMessage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewMessage(e.target.value)
                }
                onKeyPress={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className='w-full px-4 py-3 pr-14 border border-gray-200 rounded-full focus:outline-none text-sm bg-gray-100'
              />
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className='absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-full hover:bg-gray-200'
              >
                <Smile className='w-7 h-7' />
              </button>
            </div>
            <button
              onClick={handleSendMessage}
              className='flex items-center justify-center w-12 h-12 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors'
            >
              <Send className='w-5 h-5 rotate-45 -translate-x-0.5' />
            </button>
          </div>
        </div>
      </div>

      {error || externalError ? (
        <div className='flex-shrink-0 p-4 bg-red-50 border-t border-red-200 text-red-600 text-sm'>
          <div className='max-w-4xl mx-auto'>{error || externalError}</div>
        </div>
      ) : null}
    </div>
  );
}
