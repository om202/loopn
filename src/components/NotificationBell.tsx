'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { MessageCircle } from 'lucide-react';
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
import { soundService } from '../services/sound.service';
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
  const previousRequestIdsRef = useRef<string[]>([]);
  const shownDialogRequestIds = useRef<Set<string>>(new Set());
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
      const result = await notificationService.getUnreadNotifications(
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
          const newRequests = requestsWithUsers.filter(
            req => !previousRequestIdsRef.current.includes(req.id)
          );

          // Filter requests that were sent within the last minute and haven't been shown yet
          const now = new Date();
          const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
          const recentRequest = newRequests.find(req => {
            const requestTime = new Date(req.createdAt);
            return (
              requestTime >= oneMinuteAgo &&
              !shownDialogRequestIds.current.has(req.id)
            );
          });

          // Show dialog for the most recent request if there's one and no dialog is open
          if (recentRequest && !showDialog) {
            // Immediately mark this request as shown to prevent duplicates
            shownDialogRequestIds.current.add(recentRequest.id);
            setDialogRequest(recentRequest);
            setShowDialog(true);
            // Play happy sound for new chat request
            soundService.playHappySound();
          }
        } else {
          // Mark initial load as complete
          isInitialLoad.current = false;
        }

        setChatRequests(requestsWithUsers);

        // Update the ref with current request IDs for next comparison
        previousRequestIdsRef.current = requestsWithUsers.map(req => req.id);

        // Clean up shown dialog IDs for requests that no longer exist (rejected/accepted)
        const currentRequestIds = new Set(requestsWithUsers.map(req => req.id));
        shownDialogRequestIds.current.forEach(requestId => {
          if (!currentRequestIds.has(requestId)) {
            shownDialogRequestIds.current.delete(requestId);
          }
        });

        // Synchronize notifications with current chat requests
        setNotifications(prevNotifications => {
          // Get all current chat request IDs
          const currentRequestIds = new Set(requestsWithUsers.map(req => req.id));
          
          // Remove notifications for chat requests that are no longer PENDING
          const filteredNotifications = prevNotifications.filter(notif => {
            if (notif.type === 'chat_request') {
              const requestId = notif.id || (notif.data && 'id' in notif.data && notif.data.id);
              return currentRequestIds.has(requestId as string);
            }
            // Keep all non-chat-request notifications
            return true;
          });

          // Add new notifications for requests that don't have notifications yet
          const chatNotifications: Notification[] = [];
          for (const request of requestsWithUsers) {
            // Check if notification for this chat request already exists
            const existingNotification = filteredNotifications.find(
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

          // Return synchronized notifications: existing non-chat-request + remaining chat-request + new chat-request
          return [...filteredNotifications, ...chatNotifications];
        });
      },
      (error) => {
        setError('Failed to load notifications');
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user, showDialog]); // Remove chatRequests dependency to prevent infinite loops

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

            // Play bell sound for new message notification
            soundService.playBellSound();

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

      // Perform the API call in the background (notification cleanup is handled automatically by the service)
      try {
        const result = await chatService.respondToChatRequest(
          chatRequestId,
          status
        );

        if (result.data?.conversation?.id) {
          // Store the conversation ID for the connected dialog
          setDialogConversationId(result.data.conversation.id);
        }

        // Remove from local state after successful API call
        setChatRequests(prev => prev.filter(req => req.id !== chatRequestId));
        setNotifications(prev =>
          prev.filter(notif => notif.id !== chatRequestId)
        );
      } catch (error) {
        console.error('Error responding to chat request:', error);
      }

      return;
    }

    // For rejection, proceed with normal flow
    setDecliningId(chatRequestId);

    // Optimistic update - immediately remove from both states
    setChatRequests(prev => prev.filter(req => req.id !== chatRequestId));
    setNotifications(prev => prev.filter(notif => notif.id !== chatRequestId));

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
      // Ensure this request won't show dialog again
      shownDialogRequestIds.current.add(dialogRequest.id);
    }
  };

  const handleDialogReject = () => {
    // Dialog handles the API call, we just clean up
    if (dialogRequest) {
      setChatRequests(prev => prev.filter(req => req.id !== dialogRequest.id));
      setNotifications(prev =>
        prev.filter(notif => notif.id !== dialogRequest.id)
      );
      // Ensure this request won't show dialog again
      shownDialogRequestIds.current.add(dialogRequest.id);
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
        {/* Combined Notification Badge + Bell Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className='flex items-center hover:opacity-80 focus:outline-none transition-opacity'
        >
          <span className='sr-only'>View notifications</span>

          {/* Notification Badges */}
          {notifications.length > 0 && (
            <div className='flex flex-col items-start gap-1 mr-1'>
              {(() => {
                const messageCount = notifications.filter(
                  n => n.type === 'message'
                ).length;
                const otherCount = notifications.filter(
                  n => n.type !== 'message'
                ).length;
                const badges = [];

                // Message badge (top position)
                if (messageCount > 0) {
                  badges.push(
                    <div
                      key='message'
                      className='flex items-center gap-1.5 bg-white text-red-500 rounded-2xl rounded-br-sm px-3 py-1 border border-red-300 min-h-[24px]'
                    >
                      <MessageCircle className='w-4 h-4 flex-shrink-0' />
                      <span className='text-sm font-bold leading-none'>
                        {messageCount > 99 ? '99+' : messageCount}
                      </span>
                    </div>
                  );
                }

                // Other notifications badge (bottom position)
                if (otherCount > 0) {
                  badges.push(
                    <div
                      key='other'
                      className='flex items-center gap-1.5 bg-white text-red-500 rounded-2xl rounded-br-sm px-3 py-1 border border-red-300 min-h-[24px]'
                    >
                      <svg
                        className='w-4 h-4 flex-shrink-0'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
                        />
                      </svg>
                      <span className='text-sm font-bold leading-none'>
                        {otherCount > 99 ? '99+' : otherCount}
                      </span>
                    </div>
                  );
                }

                return badges;
              })()}
            </div>
          )}

          {/* Notification Bell */}
          <div className='p-1 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center'>
            <svg
              className='h-6 w-6 text-gray-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
              />
            </svg>
          </div>
        </button>

        {/* Dropdown Panel */}
        {isOpen && (
          <div
            className='origin-top-right absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] rounded-2xl shadow-lg bg-white border border-gray-200 focus:outline-none z-20'
            role='menu'
            aria-orientation='vertical'
            aria-labelledby='user-menu-button'
          >
            <div className='p-3 sm:p-4 border-b border-gray-200'>
              <h3 className='text-base sm:text-lg font-semibold text-gray-800'>
                Notifications
              </h3>
            </div>

            {/* Content */}
            <div className='max-h-[60vh] overflow-y-auto'>
              {error && (
                <div className='p-3 sm:p-4 text-red-700 bg-red-50 m-3 sm:m-4 rounded-2xl'>
                  {error}
                </div>
              )}

              {getFilteredNotifications().length === 0 ? (
                <div className='py-12 sm:py-16 text-center text-gray-500'>
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
                  <h4 className='text-base font-medium text-gray-800'>
                    You&apos;re all caught up
                  </h4>
                  <p className='text-sm text-gray-500 mt-1'>
                    No new notifications
                  </p>
                </div>
              ) : (
                <div className='divide-y divide-gray-100'>
                  {getFilteredNotifications().map(notification => {
                    const isClickable = notification.type === 'message';
                    const Component = isClickable ? 'button' : 'div';

                    return (
                      <Component
                        key={notification.id}
                        className='w-full text-left p-3 sm:p-4 hover:bg-gray-50 transition-colors'
                        {...(isClickable && {
                          onClick: () => handleNotificationClick(notification),
                        })}
                      >
                        <div className='flex items-start gap-4'>
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
                                size='md'
                              />
                            </div>
                          ) : notification.type === 'message' &&
                            notification.data &&
                            'senderEmail' in notification.data ? (
                            <div className='relative flex-shrink-0'>
                              <UserAvatar
                                email={
                                  (notification.data as MessageNotificationData)
                                    ?.senderEmail
                                }
                                userId={
                                  (notification.data as MessageNotificationData)
                                    ?.message?.senderId
                                }
                                size='sm'
                              />
                            </div>
                          ) : (
                            <div className='w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0'>
                              {getNotificationIcon(notification.type)}
                            </div>
                          )}

                          <div className='flex-1 min-w-0'>
                            <div className='flex items-start justify-between mb-1'>
                              <h4 className='text-sm font-semibold text-gray-800 truncate pr-2 no-email-detection'>
                                {notification.title}
                              </h4>
                              <span className='text-xs text-gray-500 flex-shrink-0 font-medium'>
                                {formatTimeAgo(notification.timestamp)}
                              </span>
                            </div>
                            <p className='text-sm text-gray-600 leading-normal'>
                              {notification.content}
                            </p>

                            {notification.type === 'chat_request' &&
                            notification.data &&
                            'requesterId' in notification.data ? (
                              (() => {
                                const chatRequestData =
                                  notification.data as ChatRequestWithUser;
                                return (
                                  <div className='flex items-center gap-2 mt-3'>
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
                                      className='px-3 py-1.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors'
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
                                      className='px-3 py-1.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors'
                                    >
                                      Confirm
                                    </button>
                                  </div>
                                );
                              })()
                            ) : notification.type === 'message' ? (
                              <div className='flex items-center gap-2 mt-3'>
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleNotificationClick(notification);
                                  }}
                                  className='px-3 py-1.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-colors'
                                >
                                  Reply
                                </button>
                                <button
                                  onClick={async e => {
                                    e.stopPropagation();
                                    if (!user) return;
                                    try {
                                      // For message notifications, delete from database and remove from state
                                      if (
                                        notification.data &&
                                        'conversationId' in notification.data
                                      ) {
                                        await notificationService.deleteNotificationsForConversation(
                                          user.userId,
                                          (
                                            notification.data as MessageNotificationData
                                          ).conversationId
                                        );
                                      }
                                      setNotifications(prevNotifications =>
                                        prevNotifications.filter(
                                          notif => notif.id !== notification.id
                                        )
                                      );
                                    } catch (error) {
                                      console.error(
                                        'Error marking message notification as read:',
                                        error
                                      );
                                      setError(
                                        'Failed to mark notification as read'
                                      );
                                    }
                                  }}
                                  className='px-3 py-1.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors'
                                >
                                  Mark as Read
                                </button>
                              </div>
                            ) : (
                              <div className='flex items-center gap-2 mt-3'>
                                <button
                                  onClick={async e => {
                                    e.stopPropagation();
                                    if (!user) return;
                                    try {
                                      await notificationService.markNotificationAsRead(
                                        notification.id
                                      );
                                      setNotifications(prevNotifications =>
                                        prevNotifications.filter(
                                          notif => notif.id !== notification.id
                                        )
                                      );
                                    } catch (error) {
                                      console.error(
                                        'Error marking notification as read:',
                                        error
                                      );
                                      setError(
                                        'Failed to mark notification as read'
                                      );
                                    }
                                  }}
                                  className='px-3 py-1.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors'
                                >
                                  Mark as Read
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </Component>
                    );
                  })}
                </div>
              )}
            </div>
            {getFilteredNotifications().length > 0 && (
              <div className='p-2 border-t border-gray-200 bg-gray-50'>
                <button
                  onClick={async () => {
                    if (!user) return;
                    try {
                      const markPromises = notifications.map(notification => {
                        // Handle message notifications differently - delete them instead of marking as read
                        if (
                          notification.type === 'message' &&
                          notification.data &&
                          'conversationId' in notification.data
                        ) {
                          return notificationService.deleteNotificationsForConversation(
                            user.userId,
                            (notification.data as MessageNotificationData)
                              .conversationId
                          );
                        } else {
                          // For other notification types, mark as read
                          return notificationService.markNotificationAsRead(
                            notification.id
                          );
                        }
                      });
                      const results = await Promise.all(markPromises);

                      // Check if any marking failed
                      const failedResults = results.filter(
                        result => result.error
                      );
                      if (failedResults.length > 0) {
                        console.error(
                          'Some notifications failed to be processed:',
                          failedResults
                        );
                        setError('Some notifications failed to be processed');
                        return;
                      }

                      setNotifications([]);
                      setIsOpen(false);
                    } catch (error) {
                      console.error('Error processing notifications:', error);
                      setError('Failed to process notifications');
                    }
                  }}
                  className='w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2 rounded-2xl hover:bg-gray-100 transition-colors'
                >
                  Mark all as read
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
