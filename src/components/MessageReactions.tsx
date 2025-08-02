'use client';

import { useState, useEffect, useRef } from 'react';
import type { Schema } from '../../amplify/data/resource';

type MessageReaction = Schema['MessageReaction']['type'];

interface ReactionGroup {
  emoji: string;
  count: number;
  users: string[];
  hasCurrentUser: boolean;
}

interface MessageReactionsProps {
  reactions: MessageReaction[];
  currentUserId: string;
  onToggleReaction: (emoji: string) => void;
  onNewReaction?: (reaction: MessageReaction) => void;
  triggerAnimation?: string;
}

export default function MessageReactions({
  reactions,
  currentUserId,
  onToggleReaction,
  onNewReaction,
  triggerAnimation,
}: MessageReactionsProps) {
  const [animatingEmojis, setAnimatingEmojis] = useState<Set<string>>(
    new Set()
  );
  const previousReactionsRef = useRef<MessageReaction[]>([]);

  useEffect(() => {
    if (triggerAnimation) {
      setAnimatingEmojis(new Set([triggerAnimation]));
      setTimeout(() => {
        setAnimatingEmojis(new Set());
      }, 400);
    }
  }, [triggerAnimation]);

  useEffect(() => {
    const previousReactions = previousReactionsRef.current;

    if (previousReactions.length === 0 && reactions.length > 0) {
      previousReactionsRef.current = reactions;
      return;
    }

    if (reactions.length === 0) {
      previousReactionsRef.current = reactions;
      return;
    }

    const previousIds = new Set(previousReactions.map(r => r.id));
    const newReactions = reactions.filter(r => !previousIds.has(r.id));

    if (newReactions.length > 0) {
      const newReactionsFromOthers = newReactions.filter(
        r => r.userId !== currentUserId
      );

      if (newReactionsFromOthers.length > 0) {
        const newEmojis = new Set(newReactionsFromOthers.map(r => r.emoji));
        setAnimatingEmojis(newEmojis);

        if (onNewReaction) {
          newReactionsFromOthers.forEach(reaction => {
            onNewReaction(reaction);
          });
        }

        setTimeout(() => {
          setAnimatingEmojis(new Set());
        }, 400);
      }
    }

    previousReactionsRef.current = reactions;
  }, [reactions, currentUserId, onNewReaction]);

  if (!reactions || reactions.length === 0) {
    return null;
  }

  // Group reactions by emoji and track the earliest timestamp for each emoji
  const groupedReactions = reactions.reduce(
    (acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: [],
          hasCurrentUser: false,
          earliestTimestamp: reaction.timestamp,
        };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push(reaction.userId);
      if (reaction.userId === currentUserId) {
        acc[reaction.emoji].hasCurrentUser = true;
      }
      // Keep track of the earliest timestamp for this emoji type
      if (reaction.timestamp < acc[reaction.emoji].earliestTimestamp) {
        acc[reaction.emoji].earliestTimestamp = reaction.timestamp;
      }
      return acc;
    },
    {} as Record<string, ReactionGroup & { earliestTimestamp: string }>
  );

  // Sort reaction groups by their earliest timestamp (first occurrence)
  const reactionGroups = Object.values(groupedReactions).sort(
    (a, b) => new Date(a.earliestTimestamp).getTime() - new Date(b.earliestTimestamp).getTime()
  );

  return (
    <div className='flex flex-wrap gap-1 -mt-2 mb-1'>
      {reactionGroups.map(group => {
        const isAnimating = animatingEmojis.has(group.emoji);
        return (
          <button
            key={group.emoji}
            onClick={() => onToggleReaction(group.emoji)}
            className={`inline-flex items-center justify-center min-w-[28px] h-7 px-1 rounded-full transition-all duration-150 ${
              group.hasCurrentUser
                ? 'bg-white border border-gray-300'
                : 'bg-white border border-gray-300'
            } ${isAnimating ? 'reaction-animate' : ''}`}
            title={`${group.count} reaction${group.count !== 1 ? 's' : ''}`}
          >
            <span>{group.emoji}</span>
            {group.count > 1 && (
              <span className='ml-1 text-xs font-medium'>{group.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
