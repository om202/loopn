'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';

import {
  createShortChatUrl,
  getConversationIdFromParam,
} from '../../lib/url-utils';
import { chatService } from '../../services/chat.service';
import { messageService } from '../../services/message.service';
import { notificationService } from '../../services/notification.service';
import { soundService } from '../../services/sound.service';
import { useChatRequests } from '../../hooks/realtime/useChatRequests';
import { userService } from '../../services/user.service';

import ChatRequestDialog from '../ChatRequestDialog';
import NotificationBadge from './NotificationBadge';
import NotificationDropdown from './NotificationDropdown';
import type {
  Notification,
  NotificationFilter,
  ChatRequestWithUser,
} from './types';

export default function NotificationBell() {
  // Use unified real-time chat requests
  const { user } = useAuthenticator();
  const {
    incomingRequests: realtimeChatRequests,
    isLoadingIncoming: chatRequestsLoading,
  } = useChatRequests({
    userId: user?.userId || '',
    enabled: !!user?.userId,
  });

  const [, setChatRequests] = useState<ChatRequestWithUser[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter] = useState<NotificationFilter>('all');
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
  const [dialogRequestCancelled, setDialogRequestCancelled] = useState(false);
  const [acceptingRequestId, setAcceptingRequestId] = useState<string | null>(
    null
  );
  const isInitialLoad = useRef(true);
  const previousRequestIdsRef = useRef<string[]>([]);
  const shownDialogRequestIds = useRef<Set<string>>(new Set());
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

  // Process real-time chat requests from centralized system
  useEffect(() => {
    if (!realtimeChatRequests || chatRequestsLoading) {
      return;
    }

    // Fetch user details for each request
    const processRequests = async () => {
      const requestsWithUsers = await Promise.all(
        realtimeChatRequests.map(async request => {
          const userResult = await userService.getUserPresence(
            request.requesterId
          );
          return {
            ...request,
            requesterEmail: userResult.data?.email || undefined,
          };
        })
      );

      console.log('[NotificationBell] Processing chat requests:', {
        total: requestsWithUsers.length,
        previousIds: previousRequestIdsRef.current,
        currentIds: requestsWithUsers.map(r => r.id),
        isInitialLoad: isInitialLoad.current,
      });

      // Check for new requests to show dialog (only after initial load)
      if (!isInitialLoad.current) {
        const previousRequestIds = new Set(previousRequestIdsRef.current);

        // Find truly new requests (not just reloaded ones)
        const newRequests = requestsWithUsers.filter(
          req => !previousRequestIds.has(req.id)
        );

        console.log('[NotificationBell] New requests detected:', {
          newRequests: newRequests.map(r => ({
            id: r.id,
            createdAt: r.createdAt,
          })),
          shownDialogIds: Array.from(shownDialogRequestIds.current),
        });

        // Show dialog for the first new request that hasn't been shown yet
        const requestToShow = newRequests.find(
          req => !shownDialogRequestIds.current.has(req.id)
        );

        // Show dialog for the request if there's one and no dialog is open
        if (requestToShow && !showDialog) {
          console.log(
            '[NotificationBell] Showing dialog for request:',
            requestToShow.id
          );
          // Immediately mark this request as shown to prevent duplicates
          shownDialogRequestIds.current.add(requestToShow.id);
          setDialogRequest(requestToShow);
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
          // If this is the currently shown dialog request, mark it as cancelled
          // BUT only if it's not in a connected state AND we're not currently accepting it
          // (which means it was actually cancelled/rejected, not accepted)
          if (
            dialogRequest &&
            dialogRequest.id === requestId &&
            showDialog &&
            !showDialogConnected &&
            acceptingRequestId !== requestId // Don't mark as cancelled if we're accepting it
          ) {
            setDialogRequestCancelled(true);
          }
        }
      });

      // Synchronize notifications with current chat requests
      setNotifications(prevNotifications => {
        // Get all current chat request IDs
        const currentRequestIds = new Set(requestsWithUsers.map(req => req.id));

        // Remove notifications for chat requests that are no longer PENDING
        const filteredNotifications = prevNotifications.filter(notif => {
          if (notif.type === 'chat_request') {
            const requestId =
              notif.id || (notif.data && 'id' in notif.data && notif.data.id);
            return currentRequestIds.has(requestId as string);
          }
          // Keep all non-chat-request notifications
          return true;
        });

        // Add new notifications for requests that don't have notifications yet
        const chatNotifications: Notification[] = [];
        for (const request of requestsWithUsers) {
          // Check if notification for this chat request already exists in the filtered list
          const existingNotification = filteredNotifications.find(
            notif => notif.type === 'chat_request' && notif.id === request.id
          );

          if (!existingNotification) {
            const title =
              request.requesterEmail || `User ${request.requesterId.slice(-4)}`;
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

        const newNotifications = [
          ...filteredNotifications,
          ...chatNotifications,
        ];
        console.log('[NotificationBell] Updated notifications:', {
          filtered: filteredNotifications.length,
          newChat: chatNotifications.length,
          total: newNotifications.length,
        });

        // Return synchronized notifications: existing non-chat-request + remaining chat-request + new chat-request
        return newNotifications;
      });
    };

    processRequests();
  }, [
    realtimeChatRequests,
    chatRequestsLoading,
    showDialog,
    dialogRequest,
    showDialogConnected,
    acceptingRequestId,
  ]);

  // Subscribe to messages (separate from chat requests)
  useEffect(() => {
    if (!user) {
      return;
    }

    const messageSubscription = messageService.subscribeToNewMessages(
      user.userId,
      async (message: {
        conversationId: string;
        senderId: string;
        content: string;
      }) => {
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
      (notification.type === 'message' || notification.type === 'connection') &&
      notification.data &&
      'conversationId' in notification.data
    ) {
      // Navigate to the conversation
      router.push(createShortChatUrl(notification.data.conversationId));

      // Delete notification from database
      if (user) {
        if (notification.type === 'message') {
          await notificationService.deleteNotificationsForConversation(
            user.userId,
            notification.data.conversationId
          );
        } else {
          // For connection notifications, mark as read
          await notificationService.markNotificationAsRead(notification.id);
        }
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
      setAcceptingRequestId(chatRequestId); // Track that we're accepting this request
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
      } finally {
        setAcceptingRequestId(null); // Clear accepting state
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
    setDialogRequestCancelled(false);
    setAcceptingRequestId(null); // Clear accepting state when dialog closes
  };

  const handleMarkAllAsRead = () => {
    setNotifications([]);
    setIsOpen(false);
  };

  const handleRemoveNotification = (notificationId: string) => {
    setNotifications(prevNotifications =>
      prevNotifications.filter(notif => notif.id !== notificationId)
    );
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
        requestCancelled={dialogRequestCancelled}
      />
      <div className='relative' ref={dropdownRef}>
        {/* Combined Notification Badge + Bell Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className='flex items-center hover:opacity-80 focus:outline-none transition-opacity'
        >
          <span className='sr-only'>View notifications</span>

          {/* Notification Badges */}
          <NotificationBadge notifications={notifications} />

          {/* Notification Bell */}
          <div className='p-1.5 w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center'>
            <svg
              className='h-7 w-7 text-gray-600'
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
        <NotificationDropdown
          isOpen={isOpen}
          notifications={notifications}
          activeFilter={activeFilter}
          error={error}
          decliningId={decliningId}
          onNotificationClick={handleNotificationClick}
          onRespondToRequest={handleRespondToRequest}
          onMarkAllAsRead={handleMarkAllAsRead}
          onError={setError}
          onRemoveNotification={handleRemoveNotification}
        />
      </div>
    </>
  );
}
