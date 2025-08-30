'use client';

import type { Schema } from '../../../amplify/data/resource';
import UserAvatar from '../UserAvatar';
import { formatPresenceTime } from '../../lib/presence-utils';
import { useUserProfile } from '../../hooks/useUserProfile';

type Conversation = Schema['Conversation']['type'];
type UserPresence = Schema['UserPresence']['type'];

interface ChatHeaderProps {
  conversation: Conversation;
  otherParticipantId: string;
  otherUserPresence: UserPresence | null;
  sendingConnectionRequest: boolean;
  onSendConnectionRequest: () => void;
  onBack: () => void;
}

const getDisplayName = (
  userProfile?: { fullName?: string | null; email?: string | null } | null,
  userId?: string
) => {
  // Try to get full name from profile first
  if (userProfile?.fullName) {
    return userProfile.fullName;
  }
  // Fall back to email if available
  if (userProfile?.email) {
    return userProfile.email;
  }
  // Last resort: User + last 4 chars of userId
  return userId ? `User ${userId.slice(-4)}` : 'Unknown User';
};

export default function ChatHeader({
  otherParticipantId,
  otherUserPresence,
  sendingConnectionRequest,
  onSendConnectionRequest,
  onBack,
}: ChatHeaderProps) {
  // Use optimized profile hook with caching instead of local state and API calls
  const { profile: userProfile } = useUserProfile(otherParticipantId);

  const getUserDisplayName = () => {
    return getDisplayName(userProfile, otherParticipantId);
  };

  return (
    <div
      className='flex-shrink-0 bg-white border-b border-slate-200 relative z-10'
      style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)' }}
    >
      <div className='w-full px-3 sm:px-4 lg:px-6'>
        <div className='py-2 sm:py-3'>
          <div className='flex items-center gap-2 sm:gap-3'>
            {/* Back Button */}
            <button
              onClick={onBack}
              className='p-1.5 sm:p-2 -ml-1 sm:-ml-2 text-slate-500 hover:text-black hover:bg-slate-100 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2'
            >
              <svg
                className='w-4 h-4 sm:w-5 sm:h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M15 19l-7-7 7-7'
                />
              </svg>
            </button>

            {/* User Avatar */}
            <UserAvatar
              email={userProfile?.email}
              userId={otherParticipantId}
              profilePictureUrl={userProfile?.profilePictureUrl}
              hasProfilePicture={userProfile?.hasProfilePicture || false}
              size='md'
              showStatus
              status={
                otherUserPresence?.status === 'ONLINE' ||
                otherUserPresence?.status === 'BUSY'
                  ? otherUserPresence.status
                  : otherUserPresence?.lastSeen &&
                      formatPresenceTime(otherUserPresence.lastSeen) ===
                        'Recently active'
                    ? 'RECENTLY_ACTIVE'
                    : 'OFFLINE'
              }
            />

            <div className='flex-1 min-w-0'>
              <h1 className='text-sm sm:text-base font-medium text-black truncate no-email-detection mb-1'>
                {getUserDisplayName()}
              </h1>

              {/* Profession */}
              {userProfile?.jobRole && (
                <div className='text-sm sm:text-sm text-slate-500 truncate'>
                  {userProfile.jobRole}
                </div>
              )}
            </div>

            {/* Connection Actions - Right Side */}
            <div className='flex items-center gap-1 sm:gap-2'>
              {/* Line Separator - hidden on small screens */}
              <div className='w-0.5 h-6 sm:h-8 bg-slate-100 mr-1 sm:mr-2 hidden sm:block'></div>

              {/* Optional Connect Button for social features */}
              <button
                onClick={onSendConnectionRequest}
                disabled={sendingConnectionRequest}
                className='px-3 py-2 text-sm font-medium rounded-xl border transition-colors flex items-center justify-center gap-1 bg-brand-50 text-brand-600 border-brand-200 hover:bg-brand-200 hover:border-brand-400 disabled:bg-brand-50 disabled:cursor-not-allowed'
              >
                <svg
                  width='16'
                  height='16'
                  viewBox='30 30 160 160'
                  className='w-4 h-4 flex-shrink-0'
                  aria-hidden='true'
                >
                  <circle cx='75' cy='110' r='35' fill='currentColor' />
                  <circle cx='145' cy='110' r='35' fill='currentColor' />
                </svg>
                <span className='text-sm font-medium'>
                  {sendingConnectionRequest ? 'Connecting...' : 'Connect'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
