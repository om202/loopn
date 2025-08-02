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
  onNewReaction?: (reaction: MessageReaction) => void; // Callback for new reactions from others
}

export default function MessageReactions({
  reactions,
  currentUserId,
  onToggleReaction,
  onNewReaction,
}: MessageReactionsProps) {
  const [animatingEmojis, setAnimatingEmojis] = useState<Set<string>>(
    new Set()
  );
  const previousReactionsRef = useRef<MessageReaction[]>([]);

  // Detect new reactions from other users and trigger animation
  useEffect(() => {
    // Always update previous reactions at the end, but check for new ones first
    const previousReactions = previousReactionsRef.current;

    if (previousReactions.length === 0 && reactions.length > 0) {
      // First load with existing reactions - don't animate
      previousReactionsRef.current = reactions;
      return;
    }

    if (reactions.length === 0) {
      // No reactions to process
      previousReactionsRef.current = reactions;
      return;
    }

    // Find new reactions that weren't in the previous list
    const previousIds = new Set(previousReactions.map(r => r.id));
    const newReactions = reactions.filter(r => !previousIds.has(r.id));

    if (newReactions.length > 0) {
      // Check for new reactions from other users
      const newReactionsFromOthers = newReactions.filter(
        r => r.userId !== currentUserId
      );

      if (newReactionsFromOthers.length > 0) {
        // Trigger animation for the new emojis
        const newEmojis = new Set(newReactionsFromOthers.map(r => r.emoji));
        setAnimatingEmojis(newEmojis);

        // Call the callback to play sound
        if (onNewReaction) {
          newReactionsFromOthers.forEach(reaction => {
            onNewReaction(reaction);
          });
        }

        // Remove animation after 400ms
        setTimeout(() => {
          setAnimatingEmojis(new Set());
        }, 400);
      }
    }

    // Always update previous reactions
    previousReactionsRef.current = reactions;
  }, [reactions, currentUserId, onNewReaction]);

  if (!reactions || reactions.length === 0) {
    return null;
  }

  // Group reactions by emoji
  const groupedReactions = reactions.reduce(
    (acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: [],
          hasCurrentUser: false,
        };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push(reaction.userId);
      if (reaction.userId === currentUserId) {
        acc[reaction.emoji].hasCurrentUser = true;
      }
      return acc;
    },
    {} as Record<string, ReactionGroup>
  );

  const reactionGroups = Object.values(groupedReactions);

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
