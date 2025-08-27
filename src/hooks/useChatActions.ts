'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { Schema } from '../../amplify/data/resource';
import { createShortChatUrl } from '../lib/url-utils';
import { chatService } from '../services/chat.service';
import { useSubscriptionStore } from '../stores/subscription-store';

type Conversation = Schema['Conversation']['type'];

interface UseChatActionsProps {
  user: { userId: string };
  existingConversations: Map<string, Conversation>;
  onChatRequestSent: () => void;
}

export function useChatActions({
  user,
  existingConversations,
  onChatRequestSent,
}: UseChatActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { sentChatRequests } = useSubscriptionStore();

  const handleChatAction = async (
    receiverId: string,
    pendingRequests: Set<string>
  ) => {
    // Do nothing if there's already a pending request
    if (pendingRequests.has(receiverId)) {
      return;
    }

    // Check if there's an existing conversation
    const conversation = existingConversations.get(receiverId);

    if (conversation) {
      // All conversations are permanent - just open the chat
      router.push(createShortChatUrl(conversation.id));
      return 'open-chat';
    }

    // Send new chat request
    return 'send-request';
  };

  const handleSendChatRequest = async (
    receiverId: string,
    setPendingRequests: (fn: (prev: Set<string>) => Set<string>) => void
  ) => {
    if (!user) {
      return;
    }

    // Optimistic update - immediately show pending state
    setPendingRequests(prev => new Set([...prev, receiverId]));

    // Do the API calls in the background without blocking UI
    try {
      // Check if there's already a pending request using our Zustand cache
      const existingRequest = sentChatRequests.find(
        req => req.receiverId === receiverId && req.status === 'PENDING'
      );

      if (existingRequest) {
        // Don't revert - they already have a pending request
        console.log(
          '[useChatActions] Request already exists in cache, skipping API call'
        );
        return;
      }

      const result = await chatService.sendChatRequest(receiverId, user.userId);

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
      setError('Failed to send connection request');
    }
  };

  const handleCancelChatRequest = async (
    receiverId: string,
    setPendingRequests: (fn: (prev: Set<string>) => Set<string>) => void
  ) => {
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
      setError('Failed to cancel connection request');
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
