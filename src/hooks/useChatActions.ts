'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { Schema } from '../../amplify/data/resource';
import { createShortChatUrl } from '../lib/url-utils';
import { chatService } from '../services/chat.service';

type Conversation = Schema['Conversation']['type'];

interface UseChatActionsProps {
  user: any;
  existingConversations: Map<string, Conversation>;
  canUserReconnect: (userId: string) => boolean;
  onChatRequestSent: () => void;
}

export function useChatActions({
  user,
  existingConversations,
  canUserReconnect,
  onChatRequestSent,
}: UseChatActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleChatAction = async (receiverId: string, pendingRequests: Set<string>) => {
    // Do nothing if there's already a pending request
    if (pendingRequests.has(receiverId)) {
      return;
    }

    // Check if there's an existing conversation
    const conversation = existingConversations.get(receiverId);

    if (conversation) {
      // If this is a reconnectable ended chat, send a new chat request
      if (conversation.chatStatus === 'ENDED' && canUserReconnect(receiverId)) {
        return 'send-request';
      }

      // Open existing chat with short URL
      router.push(createShortChatUrl(conversation.id));
      return 'open-chat';
    }

    // Send new chat request
    return 'send-request';
  };

  const handleSendChatRequest = async (receiverId: string, setPendingRequests: (fn: (prev: Set<string>) => Set<string>) => void) => {
    if (!user) {
      return;
    }

    // Optimistic update - immediately show pending state
    setPendingRequests(prev => new Set([...prev, receiverId]));

    // Do the API calls in the background without blocking UI
    try {
      // Check if there's already a pending request
      const existingRequest = await chatService.hasPendingChatRequest(
        user.userId,
        receiverId
      );

      if (existingRequest.error) {
        // Revert optimistic update
        setPendingRequests(prev => {
          const newSet = new Set(prev);
          newSet.delete(receiverId);
          return newSet;
        });
        setError(existingRequest.error);
        return;
      }

      if (existingRequest.data) {
        // Don't revert - they already have a pending request
        return;
      }

      const result = await chatService.sendChatRequest(
        receiverId,
        user.userId
      );

      if (result.error) {
        // Revert optimistic update on error
        setPendingRequests(prev => {
          const newSet = new Set(prev);
          newSet.delete(receiverId);
          return newSet;
        });
        setError(result.error);
      } else {
        onChatRequestSent();
        // Keep optimistic update - subscription will sync
      }
    } catch {
      // Revert optimistic update on any error
      setPendingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(receiverId);
        return newSet;
      });
      setError('Failed to send chat request');
    }
  };

  const handleCancelChatRequest = async (receiverId: string, setPendingRequests: (fn: (prev: Set<string>) => Set<string>) => void) => {
    if (!user) {
      return;
    }

    // Optimistic update - immediately remove pending state
    setPendingRequests(prev => {
      const newSet = new Set(prev);
      newSet.delete(receiverId);
      return newSet;
    });

    try {
      const result = await chatService.cancelChatRequest(
        user.userId,
        receiverId
      );

      if (result.error) {
        // Revert optimistic update on error
        setPendingRequests(prev => new Set([...prev, receiverId]));
        setError(result.error);
      }
      // On success, keep the optimistic update
    } catch {
      // Revert optimistic update on any error
      setPendingRequests(prev => new Set([...prev, receiverId]));
      setError('Failed to cancel chat request');
    }
  };

  return {
    handleChatAction,
    handleSendChatRequest,
    handleCancelChatRequest,
    error,
    setError,
  };
}