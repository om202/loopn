'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';

import type { Schema } from '../../amplify/data/resource';
import {
  createShortChatUrl,
  getConversationIdFromParam,
} from '../lib/url-utils';
import { chatService } from '../services/chat.service';
import { messageService } from '../services/message.service';
import { notificationService } from '../services/notification.service';
import { userService } from '../services/user.service';

import ChatRequestDialog from './ChatRequestDialog';
import UserAvatar from './UserAvatar';

type ChatRequest = Schema['ChatRequest']['type'];
type Message = Schema['Message']['type'];

interface ChatRequestWithUser extends ChatRequest {
  requesterEmail?: string;
}

interface MessageNotificationData {
  conversationId: string;
  message: Message;
  senderEmail?: string;
  messageCount: number; // Add this field to track total unread messages
}

interface Notification {
  id: string;
  type: 'chat_request' | 'message' | 'connection' | 'system' | null;
  title: string;
  content: string;
  timestamp: string;
  isRead: boolean | null;
  data?: ChatRequestWithUser | MessageNotificationData; // Additional data specific to notification type
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
  const isInitialLoad = useRef(true);
  const { user } = useAuthenticator();
  const router = useRouter();
  const pathname = usePathname();

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get current conversation ID if user is in a chat page
  const getCurrentConversationId = useCallback(() => {
    if (pathname?.startsWith('/chat/')) {
      const chatId = pathname.split('/chat/')[1];
      return getConversationIdFromParam(chatId);
    }
    return null;
  }, [pathname]);

  // Load existing notifications from database on mount
  useEffect(() => {
    if (!user) {
      return;
    }

    const loadNotifications = async () => {
      const result = await notificationService.getUserNotifications(
        user.userId
      );
      if (result.data) {
        // Remove duplicates - keep only the latest notification per conversation for messages
        const deduplicatedNotifications: Notification[] = [];
        const seenConversations = new Set<string>();

        for (const notif of result.data) {
          if (
            notif.type === 'message' &&
            notif.data &&
            'conversationId' in notif.data
          ) {
            const { conversationId } = notif.data;
            if (!seenConversations.has(conversationId)) {
              seenConversations.add(conversationId);
              deduplicatedNotifications.push(notif);
            }
          } else {
            // For non-message notifications, keep all
            deduplicatedNotifications.push(notif);
          }
        }

        setNotifications(deduplicatedNotifications);
      } else if (result.error) {
        setError(result.error);
      }
    };

    loadNotifications();
  }, [user]);

  // Subscribe to chat requests (separate from message subscription)
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

        // Check for new requests to show dialog (only after initial load)
        if (!isInitialLoad.current) {
          const previousRequestIds = chatRequests.map(req => req.id);
          const newRequests = requestsWithUsers.filter(
            req => !previousRequestIds.includes(req.id)
          );

          // Filter requests that were sent within the last minute
          const now = new Date();
          const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
          const recentRequest = newRequests.find(req => {
            const requestTime = new Date(req.createdAt);
            return requestTime >= oneMinuteAgo;
          });

          // Show dialog for the most recent request if there's one and no dialog is open
          if (recentRequest && !showDialog) {
            setDialogRequest(recentRequest);
            setShowDialog(true);
          }
        } else {
          // Mark initial load as complete
          isInitialLoad.current = false;
        }

        setChatRequests(requestsWithUsers);

        // Create notifications for local state - simple ID matching to prevent duplicates
        setNotifications(prevNotifications => {
          const chatNotifications: Notification[] = [];

          for (const request of requestsWithUsers) {
            // Check if notification for this chat request already exists
            const existingNotification = prevNotifications.find(
              notif =>
                notif.type === 'chat_request' &&
                (notif.id === request.id ||
                  (notif.data &&
                    'id' in notif.data &&
                    notif.data.id === request.id))
            );

            if (!existingNotification) {
              const title =
                request.requesterEmail ||
                `User ${request.requesterId.slice(-4)}`;
              const content = 'wants to chat with you';

              chatNotifications.push({
                id: request.id,
                type: 'chat_request' as const,
                title,
                content,
                timestamp: request.createdAt,
                isRead: false,
                data: request,
              });
            }
          }

          // Only add new notifications that don't already exist
          return [...prevNotifications, ...chatNotifications];
        });
      },
      () => {
        setError('Failed to load notifications');
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user, chatRequests, showDialog]);

  // Subscribe to messages (separate from chat requests)
  useEffect(() => {
    if (!user) {
      return;
    }

    const messageSubscription = messageService.subscribeToNewMessages(
      user.userId,
      async (message: Message) => {
        const currentConversationId = getCurrentConversationId();

        // Only show notification if user is not currently viewing this conversation
        if (currentConversationId !== message.conversationId) {
          // Get sender details
          const senderResult = await userService.getUserPresence(
            message.senderId
          );
          const senderEmail = senderResult.data?.email;

          // Handle database operations and state update
          setNotifications(prevNotifications => {
            // Find existing message notifications for this conversation
            const existingConversationNotifications = prevNotifications.filter(
              notif =>
                notif.type === 'message' &&
                notif.data &&
                'conversationId' in notif.data &&
                notif.data.conversationId === message.conversationId
            );

            // If we already have a notification for this conversation, don't create a duplicate
            if (existingConversationNotifications.length > 0) {
              return prevNotifications;
            }

            // Create notification data
            const title = senderEmail || `User ${message.senderId.slice(-4)}`;
            const content =
              message.content.length > 50
                ? `${message.content.substring(0, 50)}...`
                : message.content;

            const notificationData = {
              conversationId: message.conversationId,
              message,
              senderEmail: senderEmail || undefined,
              messageCount: 1,
            };

            // Create new notification for local state
            const messageNotification: Notification = {
              id: `message-${message.conversationId}`,
              type: 'message',
              title,
              content,
              timestamp: message.timestamp || message.createdAt,
              isRead: false,
              data: notificationData,
            };

            // Clean up any existing database notifications for this conversation, then create new one
            notificationService
              .deleteNotificationsForConversation(
                user.userId,
                message.conversationId
              )
              .then(() => {
                return notificationService.createNotification(
                  user.userId,
                  'message',
                  title,
                  content,
                  notificationData,
                  { conversationId: message.conversationId }
                );
              })
              .catch(error => {
                console.error('Error managing message notification:', error);
              });

            return [messageNotification, ...prevNotifications];
          });
        }
      },
      error => {
        console.error('Error subscribing to messages:', error);
      }
    );

    return () => {
      messageSubscription.unsubscribe();
    };
  }, [user, getCurrentConversationId]);

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

  const handleNotificationClick = async (notification: Notification) => {
    if (
      notification.type === 'message' &&
      notification.data &&
      'conversationId' in notification.data
    ) {
      // Navigate to the conversation
      router.push(createShortChatUrl(notification.data.conversationId));

      // Delete notification from database
      if (user) {
        await notificationService.deleteNotificationsForConversation(
          user.userId,
          notification.data.conversationId
        );
      }

      // Remove the notification since user is now viewing the conversation
      setNotifications(prevNotifications =>
        prevNotifications.filter(notif => notif.id !== notification.id)
      );

      setIsOpen(false);
    }
  };

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

      // Delete notification from database and update state
      if (user) {
        await notificationService.deleteNotificationsForChatRequest(
          user.userId,
          chatRequestId
        );
      }

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
    // Delete notification from database and update state
    if (user) {
      await notificationService.deleteNotificationsForChatRequest(
        user.userId,
        chatRequestId
      );
    }

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

  const getNotificationIcon = (type: string | null) => {
    if (!type) {
      return null;
    }
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
            className='w-4 h-4 text-gray-500'
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
          {(() => {
            const totalCount = notifications.reduce((sum, notif) => {
              if (
                notif.type === 'message' &&
                notif.data &&
                'messageCount' in notif.data
              ) {
                return (
                  sum + (notif.data as MessageNotificationData).messageCount
                );
              }
              return sum + 1; // For chat requests and other notifications
            }, 0);
            return totalCount > 0;
          })() && (
            <div className='absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center'>
              <span className='text-xs text-white font-medium'>
                {(() => {
                  const totalCount = notifications.reduce((sum, notif) => {
                    if (
                      notif.type === 'message' &&
                      notif.data &&
                      'messageCount' in notif.data
                    ) {
                      return (
                        sum +
                        (notif.data as MessageNotificationData).messageCount
                      );
                    }
                    return sum + 1; // For chat requests and other notifications
                  }, 0);
                  return totalCount > 9 ? '9+' : totalCount;
                })()}
              </span>
            </div>
          )}
        </button>

        {/* Dropdown Panel */}
        {isOpen ? (
          <div className='absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden'>
            {/* Header */}
            <div className='px-4 py-3 border-b border-gray-100 bg-gray-50'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-semibold text-gray-900'>
                  Notifications
                </h3>

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
                        className='text-sm text-gray-600 bg-white border border-gray-200 rounded-md px-2 py-1 cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                      >
                        <option value='all'>
                          {counts.all > 0 ? `All (${counts.all})` : 'All'}
                        </option>
                        {counts.chat_request > 0 && (
                          <option value='chat_request'>
                            Requests ({counts.chat_request})
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
                <div className='p-4 text-red-700 bg-red-50 border-l-4 border-red-400 mx-4 mt-3 rounded text-sm'>
                  <div className='flex items-center gap-2'>
                    <svg
                      className='w-4 h-4 text-red-500 flex-shrink-0'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path
                        fillRule='evenodd'
                        d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                        clipRule='evenodd'
                      />
                    </svg>
                    <span>{error}</span>
                  </div>
                </div>
              ) : null}

              {getFilteredNotifications().length === 0 ? (
                <div className='py-12 px-6 text-center text-gray-500'>
                  <div className='w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center'>
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
                  <h4 className='text-sm font-medium text-gray-900 mb-1'>
                    You&apos;re all caught up
                  </h4>
                  <p className='text-xs text-gray-500'>
                    {activeFilter === 'all'
                      ? 'No new notifications to show'
                      : `No ${activeFilter.replace('_', ' ')} notifications`}
                  </p>
                </div>
              ) : (
                <div className='py-2'>
                  {getFilteredNotifications().map((notification, index) => (
                    <button
                      key={notification.id}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-150 ${
                        index !== getFilteredNotifications().length - 1
                          ? 'border-b border-gray-50'
                          : ''
                      } ${notification.type === 'message' ? 'cursor-pointer' : 'cursor-default'}`}
                      onClick={() => {
                        if (notification.type === 'message') {
                          handleNotificationClick(notification);
                        }
                      }}
                      disabled={notification.type !== 'message'}
                    >
                      <div className='flex items-start gap-3'>
                        {notification.type === 'chat_request' ? (
                          <div className='relative flex-shrink-0'>
                            <UserAvatar
                              email={
                                (notification.data as ChatRequestWithUser)
                                  ?.requesterEmail
                              }
                              userId={
                                (notification.data as ChatRequestWithUser)
                                  ?.requesterId
                              }
                              size='sm'
                            />
                            <div className='absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border border-white flex items-center justify-center'>
                              <svg
                                className='w-2 h-2 text-white'
                                fill='currentColor'
                                viewBox='0 0 20 20'
                              >
                                <path
                                  fillRule='evenodd'
                                  d='M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z'
                                  clipRule='evenodd'
                                />
                              </svg>
                            </div>
                          </div>
                        ) : (
                          <div className='w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0'>
                            {getNotificationIcon(notification.type)}
                          </div>
                        )}

                        <div className='flex-1 min-w-0'>
                          <div className='flex items-start justify-between mb-1'>
                            <h4 className='text-sm font-semibold text-gray-900 truncate pr-2'>
                              {notification.title}
                            </h4>
                            <span className='text-xs text-gray-500 flex-shrink-0 font-medium'>
                              {formatTimeAgo(notification.timestamp)}
                            </span>
                          </div>
                          <p className='text-sm text-gray-600 mb-3 leading-normal'>
                            {notification.content}
                          </p>

                          {/* Action buttons for different notification types */}
                          {notification.type === 'chat_request' &&
                          notification.data &&
                          'requesterId' in notification.data ? (
                            (() => {
                              const chatRequestData =
                                notification.data as ChatRequestWithUser;
                              return (
                                <div className='flex items-center gap-3'>
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleRespondToRequest(
                                        notification.id,
                                        'REJECTED',
                                        chatRequestData
                                      );
                                    }}
                                    disabled={decliningId === notification.id}
                                    className='text-sm text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150'
                                  >
                                    {decliningId === notification.id
                                      ? 'Declining...'
                                      : 'Decline'}
                                  </button>
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleRespondToRequest(
                                        notification.id,
                                        'ACCEPTED',
                                        chatRequestData
                                      );
                                    }}
                                    disabled={decliningId === notification.id}
                                    className='px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150'
                                  >
                                    Confirm
                                  </button>
                                </div>
                              );
                            })()
                          ) : notification.type === 'message' ? (
                            <div className='text-sm'>
                              <span className='text-indigo-600 font-medium hover:text-indigo-800 cursor-pointer transition-colors duration-150'>
                                Reply
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer - only show if there are notifications */}
            {getFilteredNotifications().length > 0 && (
              <div className='px-4 py-2 border-t border-gray-100 bg-gray-50'>
                <button
                  onClick={async () => {
                    if (!user) {
                      return;
                    }

                    try {
                      // Mark all current notifications as read in database
                      const markPromises = notifications.map(notification =>
                        notificationService.markNotificationAsRead(
                          notification.id
                        )
                      );

                      await Promise.all(markPromises);

                      // Clear all notifications from local state
                      setNotifications([]);

                      // Close the dropdown
                      setIsOpen(false);
                    } catch (error) {
                      console.error(
                        'Error marking notifications as read:',
                        error
                      );
                      setError('Failed to mark notifications as read');
                    }
                  }}
                  className='w-full text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium py-1 transition-colors duration-150'
                >
                  Mark all as read
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </>
  );
}
