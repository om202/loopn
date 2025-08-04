'use client';

import { MessageCircle } from 'lucide-react';
import type { Notification } from './types';

interface NotificationBadgeProps {
  notifications: Notification[];
}

export default function NotificationBadge({
  notifications,
}: NotificationBadgeProps) {
  if (notifications.length === 0) {
    return null;
  }

  const messageCount = notifications
    .filter(n => n.type === 'message')
    .reduce((total, notif) => {
      if (notif.data && 'messageCount' in notif.data) {
        return total + ((notif.data as any).messageCount || 1);
      }
      return total + 1;
    }, 0);
  const otherCount = notifications.filter(n => n.type !== 'message').length;
  const badges = [];

  // Message badge (top position)
  if (messageCount > 0) {
    badges.push(
      <div
        key='message'
        className='flex items-center gap-2 bg-white text-red-500 rounded-2xl rounded-br-sm px-4 py-1.5 border border-red-300 min-h-[28px]'
      >
        <MessageCircle className='w-5 h-5 flex-shrink-0' />
        <span className='text-base font-bold leading-none'>
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
        className='flex items-center gap-2 bg-white text-red-500 rounded-2xl rounded-br-sm px-4 py-1.5 border border-red-300 min-h-[28px]'
      >
        <svg
          className='w-5 h-5 flex-shrink-0'
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
        <span className='text-base font-bold leading-none'>
          {otherCount > 99 ? '99+' : otherCount}
        </span>
      </div>
    );
  }

  return <div className='flex flex-col items-start gap-1.5 mr-2'>{badges}</div>;
}
