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

  const getCurrentConversationId = useCallback(() => {
    if (pathname?.startsWith('/chat/')) {
      const chatId = pathname.split('/chat/')[1];
      return getConversationIdFromParam(chatId);
    }
    return null;
  }, [pathname]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const loadNotifications = async () => {
      const result = await notificationService.getUnreadNotifications(
        user.userId
      );
      if (result.data) {
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

  useEffect(() => {
    if (!realtimeChatRequests || chatRequestsLoading) {
      return;
    }

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

      if (!isInitialLoad.current) {
        const previousRequestIds = new Set(previousRequestIdsRef.current);

        const newRequests = requestsWithUsers.filter(
          req => !previousRequestIds.has(req.id)
        );

        const requestToShow = newRequests.find(
          req => !shownDialogRequestIds.current.has(req.id)
        );

        if (requestToShow && !showDialog) {
          shownDialogRequestIds.current.add(requestToShow.id);
          setDialogRequest(requestToShow);
          setShowDialog(true);
          soundService.playHappySound();
        }
      } else {
        isInitialLoad.current = false;
      }

      setChatRequests(requestsWithUsers);

      previousRequestIdsRef.current = requestsWithUsers.map(req => req.id);

      const currentRequestIds = new Set(requestsWithUsers.map(req => req.id));
      shownDialogRequestIds.current.forEach(requestId => {
        if (!currentRequestIds.has(requestId)) {
          shownDialogRequestIds.current.delete(requestId);
          if (
            dialogRequest &&
            dialogRequest.id === requestId &&
            showDialog &&
            !showDialogConnected &&
            acceptingRequestId !== requestId
          ) {
            setDialogRequestCancelled(true);
          }
        }
      });

      setNotifications(prevNotifications => {
        const currentRequestIds = new Set(requestsWithUsers.map(req => req.id));
        const filteredNotifications = prevNotifications.filter(notif => {
          if (notif.type === 'chat_request') {
            const requestId =
              notif.id || (notif.data && 'id' in notif.data && notif.data.id);
            return currentRequestIds.has(requestId as string);
          }
          return true;
        });

        const chatNotifications: Notification[] = [];
        for (const request of requestsWithUsers) {
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

  useEffect(() => {
    if (!user) {
      return;
    }

    const messageSubscription = messageService.subscribeToNewMessages(
      user.userId,
      async message => {
        const currentConversationId = getCurrentConversationId();

        if (currentConversationId !== message.conversationId) {
          const senderResult = await userService.getUserPresence(
            message.senderId
          );
          const senderEmail = senderResult.data?.email;

          setNotifications(prevNotifications => {
            const existingConversationNotifications = prevNotifications.filter(
              notif =>
                notif.type === 'message' &&
                notif.data &&
                'conversationId' in notif.data &&
                notif.data.conversationId === message.conversationId
            );

            if (existingConversationNotifications.length > 0) {
              return prevNotifications;
            }

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

            const messageNotification: Notification = {
              id: `message-${message.conversationId}`,
              type: 'message',
              title,
              content,
              timestamp:
                message.timestamp ||
                message.createdAt ||
                new Date().toISOString(),
              isRead: false,
              data: notificationData,
            };

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
      router.push(createShortChatUrl(notification.data.conversationId));

      if (user) {
        if (notification.type === 'message') {
          await notificationService.deleteNotificationsForConversation(
            user.userId,
            notification.data.conversationId
          );
        } else {
          await notificationService.markNotificationAsRead(notification.id);
        }
      }

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
    if (status === 'ACCEPTED') {
      setAcceptingRequestId(chatRequestId);

      // Immediately remove from UI for better UX
      setChatRequests(prev => prev.filter(req => req.id !== chatRequestId));
      setNotifications(prev =>
        prev.filter(notif => notif.id !== chatRequestId)
      );
      setIsOpen(false);

      try {
        const result = await chatService.respondToChatRequest(
          chatRequestId,
          status
        );

        if (result.error) {
          // If API call failed, restore the notification
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
      } catch (error) {
        console.error('Error responding to chat request:', error);
        // Restore notification on error
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
      } finally {
        setAcceptingRequestId(null);
      }

      return;
    }

    setDecliningId(chatRequestId);

    setChatRequests(prev => prev.filter(req => req.id !== chatRequestId));
    setNotifications(prev => prev.filter(notif => notif.id !== chatRequestId));

    try {
      const result = await chatService.respondToChatRequest(
        chatRequestId,
        status
      );

      if (result.error) {
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
    } catch {
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
    if (dialogRequest) {
      // Set accepting ID to prevent the cancellation logic from triggering
      setAcceptingRequestId(dialogRequest.id);
      shownDialogRequestIds.current.add(dialogRequest.id);
      // The ChatRequestDialog handles the API call internally
      // We just need to track that this request was processed
    }
  };

  const handleDialogReject = () => {
    if (dialogRequest) {
      shownDialogRequestIds.current.add(dialogRequest.id);
      // The ChatRequestDialog handles the API call internally
      // We just need to track that this request was processed
    }
  };

  const handleDialogClose = () => {
    setShowDialog(false);
    setDialogRequest(null);
    setShowDialogConnected(false);
    setDialogConversationId(null);
    setDialogRequestCancelled(false);
    setAcceptingRequestId(null);
  };

  const handleMarkAllAsRead = () => {
    setNotifications([]);
    setIsOpen(false);
  };

  const handleRemoveNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
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
        <button
          onClick={() => setIsOpen(!isOpen)}
          className='relative flex items-center hover:opacity-80 focus:outline-none transition-opacity'
        >
          <span className='sr-only'>View notifications</span>

          {/* Notification Bell */}
          <div className='p-1.5 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center'>
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
            
            {/* Notification Count Badge */}
            {notifications.length > 0 && (
              <div className='absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1'>
                {notifications.length > 99 ? '99+' : notifications.length}
              </div>
            )}
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
          onRemoveNotification={handleRemoveNotification}
          onMarkAllAsRead={handleMarkAllAsRead}
          onError={setError}
        />
      </div>
    </>
  );
}
