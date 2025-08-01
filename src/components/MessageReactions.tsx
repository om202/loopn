'use client';

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
}

export default function MessageReactions({
  reactions,
  currentUserId,
  onToggleReaction,
}: MessageReactionsProps) {
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
      {reactionGroups.map(group => (
        <button
          key={group.emoji}
          onClick={() => onToggleReaction(group.emoji)}
          className={`inline-flex items-center justify-center min-w-[28px] h-7 px-1 rounded-full transition-colors duration-150 ${
            group.hasCurrentUser
              ? 'bg-white border border-gray-300'
              : 'bg-white border border-gray-300'
          }`}
          title={`${group.count} reaction${group.count !== 1 ? 's' : ''}`}
        >
          <span>{group.emoji}</span>
          {group.count > 1 && (
            <span className="ml-1 text-xs font-medium">{group.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
