'use client';

import React from 'react';
import { MessageCircle, Sparkles, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { NotificationBell } from '../notifications';
import UserAvatar from '../UserAvatar';

type SidebarSection = 'all' | 'connections' | 'suggested' | 'notifications' | 'account';

interface DashboardSidebarProps {
  activeSection: SidebarSection;
  onSectionChange: (section: SidebarSection) => void;
  onlineUsersCount: number;
  connectionsCount: number;
  chatTrialsCount: number;
  suggestedUsersCount: number;
}

export default function DashboardSidebar({
  activeSection,
  onSectionChange,
  onlineUsersCount,
  connectionsCount,
  chatTrialsCount,
  suggestedUsersCount,
}: DashboardSidebarProps) {
  const getUserEmail = () => {
    // For demo purposes, using a placeholder email
    return 'user@example.com';
  };

  const sidebarItems = [
    {
      id: 'suggested' as const,
      icon: Sparkles,
      label: 'Suggested',
      count: suggestedUsersCount,
    },
    {
      id: 'all' as const,
      icon: MessageCircle,
      label: 'Chats',
      count: onlineUsersCount + connectionsCount + chatTrialsCount,
    },
    {
      id: 'connections' as const,
      icon: Users,
      label: 'Connections',
      count: connectionsCount,
    },
    {
      id: 'notifications' as const,
      icon: 'NotificationBell',
      label: 'Notifications',
      count: 0,
    },
    {
      id: 'account' as const,
      icon: 'UserAvatar',
      label: 'Your Account',
      count: 0,
    },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className='hidden lg:block w-72 flex-shrink-0'>
        <div className='bg-white rounded-2xl border border-zinc-200 p-6 h-full flex flex-col'>
          {/* Logo at top */}
          <div className='mb-6'>
            <Link
              href='/?stay=true'
              className='flex items-center space-x-2 hover:opacity-80 transition-opacity'
            >
              <Image
                src='/loopn.svg'
                alt='Loopn'
                width={28}
                height={28}
                priority
              />
              <h1 className='text-lg font-semibold text-zinc-900'>
                Loopn
              </h1>
            </Link>
          </div>

          {/* Navigation items */}
          <nav className='space-y-2 flex-1 overflow-y-auto'>
            {sidebarItems.map(({ id, icon, label, count }) => (
              <button
                key={id}
                onClick={() => onSectionChange(id)}
                className={`relative w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  activeSection === id
                    ? 'bg-brand-100 text-brand-700'
                    : 'text-zinc-900 hover:bg-zinc-50'
                }`}
              >
                {icon === 'NotificationBell' ? (
                  <div className='w-5 h-5 flex-shrink-0 flex items-center justify-center'>
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' />
                    </svg>
                  </div>
                ) : icon === 'UserAvatar' ? (
                  <div className='w-5 h-5 flex-shrink-0 flex items-center justify-center'>
                    <UserAvatar email={getUserEmail()} size='xs' />
                  </div>
                ) : (
                  React.createElement(icon, { className: 'w-5 h-5 flex-shrink-0' })
                )}
                <span className='font-medium text-base'>{label}</span>
                {count > 0 && (
                  <span className='ml-auto text-sm text-zinc-500 font-medium bg-zinc-100 px-2 py-0.5 rounded-full min-w-[20px] text-center'>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </nav>


        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <div className='lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-zinc-200 px-4 py-3'>
        <nav className='flex justify-center items-stretch'>
          <div className='flex bg-zinc-50 rounded-2xl p-1 gap-1 max-w-xs w-full'>
            {sidebarItems.map(({ id, icon: Icon, label, count }) => (
              <button
                key={id}
                onClick={() => onSectionChange(id)}
                className={`relative flex-1 flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-xl transition-all duration-200 min-h-[56px] ${
                  activeSection === id
                    ? 'text-brand-500 bg-white shadow-lg'
                    : 'text-zinc-500 hover:text-zinc-700 hover:bg-white/50'
                }`}
                title={label}
              >
                <Icon className='w-5 h-5 flex-shrink-0' />
                <span className='text-sm font-medium leading-none'>
                  {label}
                </span>

                {/* Count indicator for mobile */}
                {count > 0 && (
                  <span className='absolute -top-1 -right-1 bg-brand-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center min-w-[20px] font-semibold shadow-lg'>
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}
