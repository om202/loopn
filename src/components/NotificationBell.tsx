'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useState, useEffect, useRef } from 'react';

import type { Schema } from '../../amplify/data/resource';
import { chatService } from '../services/chat.service';
import { userService } from '../services/user.service';

import ChatRequestDialog from './ChatRequestDialog';
import UserAvatar from './UserAvatar';

type ChatRequest = Schema['ChatRequest']['type'];

interface ChatRequestWithUser extends ChatRequest {
  requesterEmail?: string;
}

interface Notification {
  id: string;
  type: 'chat_request' | 'message' | 'connection' | 'system';
  title: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  data?: ChatRequestWithUser; // Additional data specific to notification type
}

type NotificationFilter =
  | 'all'
  | 'chat_request'
  | 'message'
  | 'connection'
  | 'system';

export default function NotificationBell() {
  const [chatRequests, setChatRequests] = useState<ChatRequestWithUser[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');
  const [isOpen, setIsOpen] = useState(false);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogRequest, setDialogRequest] =
    useState<ChatRequestWithUser | null>(null);
  const [showDialogConnected, setShowDialogConnected] = useState(false);
  const [dialogConversationId, setDialogConversationId] = useState<
    string | null
  >(null);
  const { user } = useAuthenticator();

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    // Subscribe to incoming chat requests
    const subscription = chatService.observeChatRequests(
      user.userId,
      async requests => {
        // Fetch user details for each request
        const requestsWithUsers = await Promise.all(
          requests.map(async request => {
            const userResult = await userService.getUserPresence(
              request.requesterId
            );
            return {
              ...request,
              requesterEmail: userResult.data?.email || undefined,
            };
          })
        );
        // Check for new requests to show dialog
        const previousRequestIds = chatRequests.map(req => req.id);
        const newRequests = requestsWithUsers.filter(
          req => !previousRequestIds.includes(req.id)
        );

        // Show dialog for the first new request
        if (newRequests.length > 0 && !showDialog) {
          setDialogRequest(newRequests[0]);
          setShowDialog(true);
        }

        setChatRequests(requestsWithUsers);

        // Convert chat requests to notifications
        const chatNotifications: Notification[] = requestsWithUsers.map(
          request => ({
            id: request.id,
            type: 'chat_request' as const,
            title:
              request.requesterEmail || `User ${request.requesterId.slice(-4)}`,
            content: 'wants to chat with you',
            timestamp: request.createdAt,
            isRead: false,
            data: request,
          })
        );

        setNotifications(chatNotifications);
      },
      () => {
        setError('Failed to load notifications');
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user, chatRequests, showDialog]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRespondToRequest = async (
    chatRequestId: string,
    status: 'ACCEPTED' | 'REJECTED',
    chatRequest: ChatRequestWithUser
  ) => {
    // If accepting, show the dialog confirmation instead of immediate processing
    if (status === 'ACCEPTED') {
      setDialogRequest(chatRequest);
      setShowDialog(true);
      setShowDialogConnected(true);
      setIsOpen(false); // Close the notification dropdown

      // Immediately call the accept handler and perform API call
      setChatRequests(prev => prev.filter(req => req.id !== chatRequestId));
      setNotifications(prev =>
        prev.filter(notif => notif.id !== chatRequestId)
      );

      // Perform the API call in the background
      try {
        const result = await chatService.respondToChatRequest(
          chatRequestId,
          status
        );

        if (result.data?.conversation?.id) {
          // Store the conversation ID for the connected dialog
          setDialogConversationId(result.data.conversation.id);
        }
      } catch (error) {
        console.error('Error responding to chat request:', error);
      }

      return;
    }

    // For rejection, proceed with normal flow
    // Optimistic update - immediately remove from both states
    setChatRequests(prev => prev.filter(req => req.id !== chatRequestId));
    setNotifications(prev => prev.filter(notif => notif.id !== chatRequestId));

    setDecliningId(chatRequestId);

    try {
      const result = await chatService.respondToChatRequest(
        chatRequestId,
        status
      );

      if (result.error) {
        // Revert optimistic update - add back to both states
        setChatRequests(prev => [...prev, chatRequest]);
        const chatNotification: Notification = {
          id: chatRequest.id,
          type: 'chat_request',
          title:
            chatRequest.requesterEmail ||
            `User ${chatRequest.requesterId.slice(-4)}`,
          content: 'wants to chat with you',
          timestamp: chatRequest.createdAt,
          isRead: false,
          data: chatRequest,
        };
        setNotifications(prev => [...prev, chatNotification]);
        setError(result.error);
      }
      // On success, keep the optimistic update
    } catch {
      // Revert optimistic update on any error
      setChatRequests(prev => [...prev, chatRequest]);
      const chatNotification: Notification = {
        id: chatRequest.id,
        type: 'chat_request',
        title:
          chatRequest.requesterEmail ||
          `User ${chatRequest.requesterId.slice(-4)}`,
        content: 'wants to chat with you',
        timestamp: chatRequest.createdAt,
        isRead: false,
        data: chatRequest,
      };
      setNotifications(prev => [...prev, chatNotification]);
      setError('Failed to respond to chat request');
    }

    setDecliningId(null);
  };

  const getFilteredNotifications = () => {
    if (activeFilter === 'all') {
      return notifications;
    }
    return notifications.filter(notif => notif.type === activeFilter);
  };

  const getFilterCounts = () => {
    const counts = {
      all: notifications.length,
      chat_request: notifications.filter(n => n.type === 'chat_request').length,
      message: notifications.filter(n => n.type === 'message').length,
      connection: notifications.filter(n => n.type === 'connection').length,
      system: notifications.filter(n => n.type === 'system').length,
    };
    return counts;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'chat_request':
        return (
          <svg
            className='w-4 h-4 text-blue-500'
            fill='currentColor'
            viewBox='0 0 20 20'
          >
            <path
              fillRule='evenodd'
              d='M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z'
              clipRule='evenodd'
            />
          </svg>
        );
      case 'message':
        return (
          <svg
            className='w-4 h-4 text-green-500'
            fill='currentColor'
            viewBox='0 0 20 20'
          >
            <path d='M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z' />
            <path d='M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z' />
          </svg>
        );
      case 'connection':
        return (
          <svg
            className='w-4 h-4 text-purple-500'
            fill='currentColor'
            viewBox='0 0 20 20'
          >
            <path d='M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z' />
          </svg>
        );
      case 'system':
        return (
          <svg
            className='w-4 h-4 text-gray-500'
            fill='currentColor'
            viewBox='0 0 20 20'
          >
            <path
              fillRule='evenodd'
              d='M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z'
              clipRule='evenodd'
            />
          </svg>
        );
      default:
        return (
          <svg
            className='w-4 h-4 text-gray-500'
            fill='currentColor'
            viewBox='0 0 20 20'
          >
            <path d='M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z' />
          </svg>
        );
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - time.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) {
      return 'Just now';
    }
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    }
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleDialogAccept = () => {
    // Dialog handles the API call, we just clean up
    if (dialogRequest) {
      setChatRequests(prev => prev.filter(req => req.id !== dialogRequest.id));
      setNotifications(prev =>
        prev.filter(notif => notif.id !== dialogRequest.id)
      );
    }
  };

  const handleDialogReject = () => {
    // Dialog handles the API call, we just clean up
    if (dialogRequest) {
      setChatRequests(prev => prev.filter(req => req.id !== dialogRequest.id));
      setNotifications(prev =>
        prev.filter(notif => notif.id !== dialogRequest.id)
      );
    }
  };

  const handleDialogClose = () => {
    setShowDialog(false);
    setDialogRequest(null);
    setShowDialogConnected(false);
    setDialogConversationId(null);
  };

  return (
    <>
      <ChatRequestDialog
        isOpen={showDialog}
        chatRequest={dialogRequest}
        onClose={handleDialogClose}
        onAccept={handleDialogAccept}
        onReject={handleDialogReject}
        showConnectedState={showDialogConnected}
        conversationId={dialogConversationId}
      />
      <div className='relative' ref={dropdownRef}>
        {/* Notification Bell Button */}
        <button onClick={() => setIsOpen(!isOpen)} className='relative'>
          {/* Round Background with Bell Icon */}
          <div className='w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors'>
            <svg
              className='w-6 h-6 text-gray-700'
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path d='M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z' />
            </svg>
          </div>

          {/* Notification Badge */}
          {notifications.length > 0 && (
            <div className='absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center'>
              <span className='text-xs text-white font-medium'>
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            </div>
          )}
        </button>

        {/* Dropdown Panel */}
        {isOpen ? (
          <div className='absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-lg z-20'>
            {/* Header */}
            <div className='p-4 border-b border-gray-100'>
              <div className='flex items-center justify-between'>
                <h3 className='font-semibold text-gray-900'>Notifications</h3>

                {/* Subtle Filter Dropdown - Only show if there are multiple types */}
                {(() => {
                  const counts = getFilterCounts();
                  const activeTypes = Object.entries(counts).filter(
                    ([key, count]) => key !== 'all' && count > 0
                  ).length;

                  return activeTypes > 1 ? (
                    <div className='relative'>
                      <select
                        value={activeFilter}
                        onChange={e =>
                          setActiveFilter(e.target.value as NotificationFilter)
                        }
                        className='text-sm text-gray-600 bg-transparent border-none outline-none cursor-pointer hover:text-gray-900 focus:text-gray-900'
                      >
                        <option value='all'>
                          {counts.all > 0 ? `All (${counts.all})` : 'All'}
                        </option>
                        {counts.chat_request > 0 && (
                          <option value='chat_request'>
                            Chats ({counts.chat_request})
                          </option>
                        )}
                        {counts.message > 0 && (
                          <option value='message'>
                            Messages ({counts.message})
                          </option>
                        )}
                        {counts.connection > 0 && (
                          <option value='connection'>
                            Connections ({counts.connection})
                          </option>
                        )}
                      </select>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>

            {/* Content */}
            <div className='max-h-96 overflow-y-auto'>
              {error ? (
                <div className='p-4 text-red-600 bg-red-50 text-sm'>
                  {error}
                </div>
              ) : null}

              {getFilteredNotifications().length === 0 ? (
                <div className='p-8 text-center text-gray-500'>
                  <div className='w-12 h-12 mx-auto mb-3 flex items-center justify-center'>
                    <svg
                      className='w-8 h-8 text-gray-400'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={1.5}
                        d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
                      />
                    </svg>
                  </div>
                  <p className='text-sm'>
                    {activeFilter === 'all'
                      ? 'No notifications'
                      : `No ${activeFilter.replace('_', ' ')} notifications`}
                  </p>
                </div>
              ) : (
                <div className='py-2'>
                  {getFilteredNotifications().map(notification => (
                    <div
                      key={notification.id}
                      className='px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-b-0'
                    >
                      <div className='flex items-start gap-3'>
                        {notification.type === 'chat_request' ? (
                          <UserAvatar
                            email={notification.data?.requesterEmail}
                            userId={notification.data?.requesterId}
                            size='sm'
                          />
                        ) : (
                          <div className='w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm'>
                            {getNotificationIcon(notification.type)}
                          </div>
                        )}
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center justify-between'>
                            <p className='text-sm font-medium text-gray-900 truncate'>
                              {notification.title}
                            </p>
                            <span className='text-xs text-gray-500 ml-2 flex-shrink-0'>
                              {formatTimeAgo(notification.timestamp)}
                            </span>
                          </div>
                          <p className='text-sm text-gray-600 mb-2'>
                            {notification.content}
                          </p>

                          {/* Action buttons only for chat requests */}
                          {notification.type === 'chat_request' &&
                          notification.data
                            ? (() => {
                                const chatRequestData = notification.data;
                                return (
                                  <div className='flex gap-2 mt-1'>
                                    <button
                                      onClick={() =>
                                        handleRespondToRequest(
                                          notification.id,
                                          'REJECTED',
                                          chatRequestData
                                        )
                                      }
                                      disabled={decliningId === notification.id}
                                      className='px-4 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-200 disabled:opacity-50 transition-colors'
                                    >
                                      {decliningId === notification.id
                                        ? 'Declining...'
                                        : 'Delete'}
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleRespondToRequest(
                                          notification.id,
                                          'ACCEPTED',
                                          chatRequestData
                                        )
                                      }
                                      disabled={decliningId === notification.id}
                                      className='px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors'
                                    >
                                      Confirm
                                    </button>
                                  </div>
                                );
                              })()
                            : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
