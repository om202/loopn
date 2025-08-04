import { useEffect, useState, useRef, useCallback } from 'react';
import { useRealtime } from '@/contexts/RealtimeContext';
import { soundService } from '@/services/sound.service';
import type { Schema } from '../../../amplify/data/resource';

type Message = Schema['Message']['type'];

interface UseRealtimeMessagesProps {
  conversationId: string;
  userId: string;
  enabled?: boolean;
}

interface UseRealtimeMessagesReturn {
  messages: Message[];
  isInitializing: boolean;
  isInitialLoadComplete: boolean;
  hasActiveSession: boolean;
  shouldAutoScroll: boolean;
  unreadMessagesSnapshot: Set<string>;
  error: string | null;
  // Control functions
  setShouldAutoScroll: (value: boolean) => void;
}

export function useRealtimeMessages({
  conversationId,
  userId,
  enabled = true,
}: UseRealtimeMessagesProps): UseRealtimeMessagesReturn {
  const { subscribeToMessages } = useRealtime();

  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialLoadComplete, setInitialLoadComplete] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(false);
  const [unreadMessagesSnapshot, setUnreadMessagesSnapshot] = useState<
    Set<string>
  >(new Set());
  const [error, setError] = useState<string | null>(null);

  // Refs for subscription logic
  const isFirstLoadRef = useRef(true);
  const previousMessageIdsRef = useRef(new Set<string>());
  const canPlaySoundsRef = useRef(false);

  // Reset function when conversation changes
  const resetState = useCallback(() => {
    setMessages([]);
    setIsInitializing(false);
    setInitialLoadComplete(false);
    setHasActiveSession(false);
    setShouldAutoScroll(false);
    setUnreadMessagesSnapshot(new Set());
    setError(null);
    isFirstLoadRef.current = true;
    previousMessageIdsRef.current = new Set();
    canPlaySoundsRef.current = false;
  }, []);

  // Main subscription effect
  useEffect(() => {
    if (!conversationId || !userId || !enabled) {
      resetState();
      return;
    }

    setIsInitializing(true);
    resetState();

    console.log(
      `[useRealtimeMessages] Setting up subscription for conversation: ${conversationId}`
    );

    const unsubscribe = subscribeToMessages(conversationId, data => {
      try {
        // Handle both observeQuery format and individual message format
        const typedData = data as { items?: Message[] } | Message;
        const newMessages = (typedData as { items?: Message[] }).items || [
          typedData as Message,
        ];

        // Sort messages by timestamp (oldest first for chat display)
        const sortedMessages = [...newMessages].sort((a, b) => {
          const timestampA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const timestampB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return timestampA - timestampB;
        });

        if (isFirstLoadRef.current) {
          console.log(
            `[useRealtimeMessages] First load: ${sortedMessages.length} messages`
          );

          // First load: set all messages and complete initialization
          setMessages(sortedMessages);
          setInitialLoadComplete(true);
          setHasActiveSession(true);

          // Take a snapshot of unread message IDs when first loading
          const unreadIds = new Set(
            sortedMessages
              .filter(
                msg =>
                  !msg.isRead &&
                  msg.senderId !== userId &&
                  msg.senderId !== 'SYSTEM'
              )
              .map(msg => msg.id)
          );
          setUnreadMessagesSnapshot(unreadIds);

          // Initialize previous message IDs for next updates
          previousMessageIdsRef.current = new Set(
            sortedMessages.map(msg => msg.id)
          );

          setIsInitializing(false);

          // Trigger scroll to bottom after messages are loaded
          setShouldAutoScroll(true);

          isFirstLoadRef.current = false;

          // Enable sound playing after a short delay to avoid playing sounds for existing messages
          setTimeout(() => {
            canPlaySoundsRef.current = true;
          }, 1000); // 1 second delay before enabling sounds
        } else {
          console.log(
            `[useRealtimeMessages] Update: ${sortedMessages.length} messages`
          );

          // Subsequent updates: check for new messages from other users
          const currentMessageIds = new Set(sortedMessages.map(msg => msg.id));
          const newMessageIds = sortedMessages.filter(
            msg => !previousMessageIdsRef.current.has(msg.id)
          );

          // Play received sound for new messages from other users (not system or self)
          // Only play if we're past the initial load period
          if (canPlaySoundsRef.current) {
            const newMessagesFromOthers = newMessageIds.filter(
              msg => msg.senderId !== userId && msg.senderId !== 'SYSTEM'
            );

            if (newMessagesFromOthers.length > 0) {
              console.log(
                `[useRealtimeMessages] Playing sound for ${newMessagesFromOthers.length} new messages`
              );
              soundService.playReceivedSound();
            }
          }

          // Update previous message IDs for next comparison
          previousMessageIdsRef.current = currentMessageIds;

          // Update messages
          setMessages(sortedMessages);
        }
      } catch (err) {
        console.error(
          '[useRealtimeMessages] Error processing message data:',
          err
        );
        setError('Failed to process real-time messages');
      }
    });

    return () => {
      console.log(
        `[useRealtimeMessages] Cleaning up subscription for: ${conversationId}`
      );
      unsubscribe();
    };
  }, [conversationId, userId, enabled, subscribeToMessages, resetState]);

  // Error handling effect
  useEffect(() => {
    if (error) {
      setIsInitializing(false);
    }
  }, [error]);

  return {
    messages,
    isInitializing,
    isInitialLoadComplete,
    hasActiveSession,
    shouldAutoScroll,
    unreadMessagesSnapshot,
    error,
    setShouldAutoScroll,
  };
}
