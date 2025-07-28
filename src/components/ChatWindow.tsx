'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useState, useEffect, useRef } from 'react';
import { MessageBox } from 'react-chat-elements';
import 'react-chat-elements/dist/main.css';

import type { Schema } from '../../amplify/data/resource';
import { chatService } from '../services/chat.service';
import { messageService } from '../services/message.service';
import { userService } from '../services/user.service';

type Message = Schema['Message']['type'];
type Conversation = Schema['Conversation']['type'];
type UserPresence = Schema['UserPresence']['type'];

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
  const [otherUserPresence, setOtherUserPresence] =
    useState<UserPresence | null>(null);
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
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        // Show shorter format based on time remaining
        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m`);
        } else if (minutes > 5) {
          setTimeLeft(`${minutes}m`);
        } else {
          // Show seconds when less than 5 minutes
          setTimeLeft(`${minutes}m ${seconds}s`);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [conversation.probationEndsAt, conversation.isConnected]);

  // Get the other participant's ID
  const otherParticipantId =
    conversation.participant1Id === user?.userId
      ? conversation.participant2Id
      : conversation.participant1Id;

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

  // Update sidebar content
  useEffect(() => {
    const sidebarContent = document.getElementById('chat-sidebar-content');
    if (!sidebarContent) return;

    const presenceDisplay = getPresenceDisplay();

    sidebarContent.innerHTML = `
      <div class="space-y-6">
        <div class="text-center">
          <div class="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <span class="text-white text-xl font-semibold">
              ${(otherUserPresence?.email || `User ${otherParticipantId.slice(-4)}`).charAt(0).toUpperCase()}
            </span>
          </div>
          <h3 class="font-semibold text-gray-900 text-lg">
            ${otherUserPresence?.email || `User ${otherParticipantId.slice(-4)}`}
          </h3>
          <div class="flex items-center justify-center gap-2 mt-2">
            <div class="w-2.5 h-2.5 rounded-full ${presenceDisplay.dot}"></div>
            <span class="text-sm ${presenceDisplay.color}">
              ${presenceDisplay.text}
            </span>
          </div>
        </div>

        ${!conversation.isConnected ? `
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div class="text-sm text-gray-800 font-medium mb-1">Probation Period</div>
            <div class="text-sm text-gray-600">${timeLeft} remaining</div>
          </div>
        ` : ''}

        ${!conversation.isConnected ? `
          <button 
            id="end-chat-btn"
            class="w-full px-4 py-3 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors font-medium"
          >
            End chat now
          </button>
        ` : ''}
      </div>
    `;

    // Add event listener for end chat button
    const endChatBtn = document.getElementById('end-chat-btn');
    if (endChatBtn) {
      endChatBtn.onclick = handleEndChat;
    }
  }, [otherUserPresence, timeLeft, conversation.isConnected, otherParticipantId]);

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

  const formatMessageTime = (timestamp: string | null | undefined) => {
    if (!timestamp) {
      return 'Unknown time';
    }
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPresenceDisplay = () => {
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
  };

  return (
    <div className='flex flex-col h-full bg-white'>
      {/* Messages Container */}
      <div className='flex-1 overflow-y-auto bg-gray-50'>
        <div className='max-w-4xl mx-auto p-4 space-y-2'>
          {messages.length === 0 ? (
            <div className='text-center text-gray-500 py-12'>
              <div className='text-lg mb-2'>No messages yet</div>
              <div className='text-sm'>Start the conversation!</div>
            </div>
          ) : (
            messages.map(message => {
              const isOwnMessage = message.senderId === user?.userId;
              return (
                <MessageBox
                  key={message.id}
                  id={message.id}
                  position={isOwnMessage ? 'right' : 'left'}
                  type={'text'}
                  title={''}
                  titleColor={'transparent'}
                  text={message.content}
                  date={new Date(message.timestamp || Date.now())}
                  focus={false}
                  forwarded={false}
                  replyButton={false}
                  removeButton={false}
                  status={isOwnMessage ? 'sent' : 'received'}
                  notch={true}
                  retracted={false}
                />
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className='flex-shrink-0 bg-white border-t border-gray-200'>
        <div className='max-w-4xl mx-auto p-4'>
          <form onSubmit={handleSendMessage} className='flex gap-3'>
            <input
              type='text'
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder='Type your message...'
              className='flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-gray-50'
            />
            <button
              type='submit'
              className='px-6 py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors text-sm font-medium'
            >
              Send
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className='flex-shrink-0 p-4 bg-red-50 border-t border-red-200 text-red-600 text-sm'>
          <div className='max-w-4xl mx-auto'>
            {error}
          </div>
        </div>
      )}
    </div>
  );
}
