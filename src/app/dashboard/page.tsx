'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useState, useEffect } from 'react';

import type { Schema } from '../../../amplify/data/resource';
import ChatRequests from '../../components/ChatRequests';
import ChatWindow from '../../components/ChatWindow';
import OnlineUsers from '../../components/OnlineUsers';
import ProtectedRoute from '../../components/protected-route';
import { chatService } from '../../services/chat.service';

type ChatRequest = Schema['ChatRequest']['type'];
type Conversation = Schema['Conversation']['type'];

export default function DashboardPage() {
  const { signOut, user } = useAuthenticator(context => [
    context.signOut,
    context.user,
  ]);

  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  // const [refreshRequests, setRefreshRequests] = useState(0);

  // Subscribe to user's conversations
  useEffect(() => {
    if (!user) {
      return;
    }

    const subscription = chatService.observeConversations(
      user.userId,
      convs => {
        // Filter active conversations only
        const activeConvs = convs.filter(conv => conv.chatStatus === 'ACTIVE');
        setConversations(activeConvs);

        // If we have an active conversation and it's no longer in the list, clear it
        if (
          activeConversation &&
          !activeConvs.find(c => c.id === activeConversation.id)
        ) {
          setActiveConversation(null);
        }
      },
      error => {
        console.error('Error observing conversations:', error);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user, activeConversation]);

  const handleChatRequestSent = () => {
    // Refresh chat requests to show the sent request
    // setRefreshRequests(prev => prev + 1);
  };

  const handleRequestAccepted = async (chatRequest: ChatRequest) => {
    if (!user) {
      return;
    }

    // Create a new conversation when request is accepted
    const result = await chatService.createConversation(
      chatRequest.requesterId,
      chatRequest.receiverId
    );

    if (result.data) {
      setActiveConversation(result.data);
    }
  };

  const handleChatEnded = () => {
    setActiveConversation(null);
  };

  const handleOpenChat = (conversation: Conversation) => {
    setActiveConversation(conversation);
  };

  const getOtherParticipantId = (conversation: Conversation) => {
    return conversation.participant1Id === user?.userId
      ? conversation.participant2Id
      : conversation.participant1Id;
  };

  const formatTimeLeft = (probationEndsAt: string) => {
    const now = new Date();
    const endTime = new Date(probationEndsAt);
    const diff = endTime.getTime() - now.getTime();

    if (diff <= 0) {
      return 'Expired';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    return `${hours}h`;
  };

  return (
    <ProtectedRoute>
      <div className='min-h-screen bg-gray-50 p-4'>
        <div className='max-w-7xl mx-auto'>
          {/* Header */}
          <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>
                  Welcome to Loopn
                </h1>
                <p className='text-gray-600 mt-1'>
                  Connect with professionals • {user?.signInDetails?.loginId}
                </p>
              </div>
              <button
                onClick={signOut}
                className='bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors'
              >
                Sign Out
              </button>
            </div>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Left Column - Chat Requests & Online Users */}
            <div className='lg:col-span-1 space-y-6'>
              <ChatRequests onRequestAccepted={handleRequestAccepted} />
              <OnlineUsers onChatRequestSent={handleChatRequestSent} />
            </div>

            {/* Middle Column - Active Conversations List */}
            <div className='lg:col-span-1'>
              <div className='bg-white rounded-lg shadow-md p-6'>
                <h2 className='text-xl font-semibold text-gray-900 mb-4'>
                  Your Conversations ({conversations.length})
                </h2>

                {conversations.length === 0 ? (
                  <div className='text-center text-gray-500 py-8'>
                    <div className='text-4xl mb-2'>💬</div>
                    <p>No active conversations</p>
                    <p className='text-sm'>
                      Send a chat request to get started!
                    </p>
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {conversations.map(conversation => {
                      const otherParticipantId =
                        getOtherParticipantId(conversation);
                      const isActive =
                        activeConversation?.id === conversation.id;

                      return (
                        <div
                          key={conversation.id}
                          onClick={() => handleOpenChat(conversation)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleOpenChat(conversation);
                            }
                          }}
                          role='button'
                          tabIndex={0}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            isActive
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center space-x-3'>
                              <div className='w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium'>
                                {otherParticipantId.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className='font-medium text-gray-900 text-sm'>
                                  Professional {otherParticipantId.slice(-4)}
                                </div>
                                {conversation.lastMessageContent ? (
                                  <div className='text-xs text-gray-500 truncate max-w-32'>
                                    {conversation.lastMessageContent}
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            <div className='text-right'>
                              {!conversation.isConnected &&
                              conversation.probationEndsAt ? (
                                <div className='text-xs text-amber-600'>
                                  {formatTimeLeft(conversation.probationEndsAt)}{' '}
                                  left
                                </div>
                              ) : null}
                              {conversation.isConnected ? (
                                <div className='text-xs text-green-600'>
                                  Connected
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Active Chat Window */}
            <div className='lg:col-span-1'>
              {activeConversation ? (
                <ChatWindow
                  conversation={activeConversation}
                  onChatEnded={handleChatEnded}
                />
              ) : (
                <div className='bg-white rounded-lg shadow-md p-6 h-96 flex items-center justify-center'>
                  <div className='text-center text-gray-500'>
                    <div className='text-4xl mb-2'>💭</div>
                    <p>Select a conversation to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
