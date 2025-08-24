'use client';

import React, { useState } from 'react';
import { MessageCircle, Compass, Users, HelpCircle, Bug } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useAuth } from '@/contexts/AuthContext';

import UserAvatar from '../UserAvatar';
import BugReportDialog from '../BugReportDialog';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useChatRequests } from '../../hooks/useChatRequests';
import { useNotifications } from '../../hooks/useNotifications';

type SidebarSection =
  | 'all'
  | 'connections'
  | 'suggested'
  | 'search'
  | 'notifications'
  | 'help'
  | 'account';

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
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);
  const { onboardingStatus } = useAuth();
  const { user } = useAuthenticator();

  // Use our centralized user profile hook for current user
  const { profile: userProfile } = useUserProfile(user?.userId || '');

  // Use our centralized notifications hook for count
  const { notificationCount } = useNotifications({
    userId: user?.userId || '',
    enabled: !!user?.userId,
  });

  const {
    incomingRequests: _realtimeChatRequests,
    isLoadingIncoming: _chatRequestsLoading,
  } = useChatRequests({
    userId: user?.userId || '',
    enabled: !!user?.userId,
  });

  const getUserEmail = () => {
    return user?.signInDetails?.loginId || 'user@example.com';
  };

  const getUserDisplayName = () => {
    // Try to get full name from onboarding data first
    if (onboardingStatus?.onboardingData?.fullName) {
      return onboardingStatus.onboardingData.fullName;
    }
    // Fall back to email if available
    if (user?.signInDetails?.loginId) {
      return user.signInDetails.loginId;
    }
    // Last resort: generic name
    return 'Your Account';
  };

  // Notification count is now handled by useNotifications hook

  // Notification count is now handled by useNotifications hook (includes chat requests)

  const sidebarItems = [
    {
      id: 'suggested' as const,
      icon: Compass,
      label: 'Discover',
      count: suggestedUsersCount,
    },
    {
      id: 'connections' as const,
      icon: Users,
      label: 'Connections',
      count: connectionsCount,
    },
    {
      id: 'all' as const,
      icon: MessageCircle,
      label: 'Chats',
      count: onlineUsersCount + connectionsCount + chatTrialsCount,
    },
    {
      id: 'notifications' as const,
      icon: 'NotificationBell',
      label: 'Notifications',
      count: notificationCount,
    },
  ];

  const helpItem = {
    id: 'help' as const,
    icon: HelpCircle,
    label: 'Help & Support',
    count: 0,
  };

  const accountItem = {
    id: 'account' as const,
    icon: 'UserAvatar',
    label: getUserDisplayName(),
    count: 0,
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className='hidden lg:block w-64 flex-shrink-0'>
        <div className='bg-white rounded-2xl h-full flex flex-col shadow-sm border border-gray-100'>
          {/* Logo at top */}
          <div className='px-4 py-4 border-b border-gray-100'>
            <div className='flex items-center justify-between'>
              <Link
                href='/?stay=true'
                className='flex items-center gap-3 hover:opacity-80 transition-opacity'
              >
                <Image
                  src='/loopn.svg'
                  alt='Loopn'
                  width={32}
                  height={32}
                  priority
                />
                <div className='flex items-center gap-2'>
                  <h1 className='text-2xl font-bold text-gray-900'>Loopn</h1>
                </div>
              </Link>
            </div>
          </div>

          {/* Navigation items */}
          <nav className='flex-1 overflow-y-auto py-4'>
            <div className='px-4 space-y-1'>
              {sidebarItems.map(({ id, icon, label, count }) => (
                <button
                  key={id}
                  onClick={() => onSectionChange(id)}
                  className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left group transition-colors ${
                    activeSection === id
                      ? 'text-brand-600 bg-brand-50 font-medium'
                      : 'text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className='w-5 h-5 flex-shrink-0 flex items-center justify-center'>
                    {icon === 'NotificationBell' ? (
                      <svg
                        className='w-5 h-5'
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
                    ) : (
                      React.createElement(icon, {
                        className: 'w-5 h-5',
                      })
                    )}
                  </div>
                  <span className='flex-1 flex items-center justify-between'>
                    <span
                      className={`${activeSection === id ? 'font-medium' : ''}`}
                    >
                      {label}
                    </span>
                    {count > 0 && id === 'notifications' && (
                      <span className='text-xs font-bold flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white'>
                        {count > 99 ? '99+' : count}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </nav>

          {/* Help and Account buttons at bottom */}
          <div className='border-t border-gray-100 p-4 space-y-2'>
            {/* Help Button with Bug Report Button */}
            <div className='flex items-center gap-2'>
              <button
                onClick={() => onSectionChange(helpItem.id)}
                className={`relative flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-left group transition-colors ${
                  activeSection === helpItem.id
                    ? 'text-brand-600 bg-brand-50 font-medium'
                    : 'text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className='w-5 h-5 flex-shrink-0 flex items-center justify-center'>
                  <HelpCircle className='w-5 h-5' />
                </div>
                <span
                  className={`${activeSection === helpItem.id ? 'font-medium' : ''}`}
                >
                  {helpItem.label}
                </span>
              </button>

              <button
                onClick={() => setIsBugReportOpen(true)}
                className='p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors'
                title='Report Bug / Share Suggestion'
              >
                <Bug className='w-4 h-4' />
              </button>
            </div>

            {/* Account Button */}
            <button
              onClick={() => onSectionChange(accountItem.id)}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left group transition-colors ${
                activeSection === accountItem.id
                  ? 'text-brand-600 bg-brand-50 font-medium'
                  : 'text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className='flex-shrink-0 flex items-center justify-center'>
                <UserAvatar
                  email={getUserEmail()}
                  userId={user?.userId}
                  profilePictureUrl={
                    userProfile?.profilePictureUrl ||
                    onboardingStatus?.onboardingData?.profilePictureUrl
                  }
                  hasProfilePicture={
                    !!userProfile?.profilePictureUrl ||
                    !!onboardingStatus?.onboardingData?.profilePictureUrl
                  }
                  size='sm'
                  showStatus={true}
                  status='ONLINE'
                />
              </div>
              <div className='flex-1'>
                <div
                  className={`text-gray-900 ${activeSection === accountItem.id ? 'font-medium' : 'font-medium'}`}
                >
                  {accountItem.label}
                </div>
                <div className='text-sm text-gray-500'>Account</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <div className='lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-100 border-t border-gray-200'>
        <nav className='flex items-stretch px-2 py-1'>
          <div className='flex w-full'>
            {[
              // Filter out help for mobile
              ...sidebarItems,
              accountItem,
            ].map(({ id, icon, label, count }) => (
              <button
                key={id}
                onClick={() => onSectionChange(id)}
                className={`relative flex-1 flex flex-col items-center justify-center gap-1 px-1 py-2 transition-colors duration-150 ${
                  activeSection === id
                    ? 'text-brand-600'
                    : 'text-gray-900 hover:text-gray-900'
                }`}
                title={label}
              >
                <div className='relative w-6 h-6 flex-shrink-0 flex items-center justify-center'>
                  {icon === 'NotificationBell' ? (
                    <>
                      <svg
                        className='w-5 h-5'
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
                      {count > 0 && id === 'notifications' && (
                        <div className='absolute -top-1 -right-1 w-4 h-4 bg-b_red-500 rounded-full flex items-center justify-center'>
                          <span className='text-white text-[8px] font-bold leading-none'>
                            {count > 99 ? '99+' : count}
                          </span>
                        </div>
                      )}
                    </>
                  ) : icon === 'UserAvatar' ? (
                    <div className='w-8 h-8 flex items-center justify-center'>
                      <UserAvatar
                        email={getUserEmail()}
                        userId={user?.userId}
                        profilePictureUrl={
                          userProfile?.profilePictureUrl ||
                          onboardingStatus?.onboardingData?.profilePictureUrl
                        }
                        hasProfilePicture={
                          !!userProfile?.profilePictureUrl ||
                          !!onboardingStatus?.onboardingData?.profilePictureUrl
                        }
                        size='sm'
                        showStatus={true}
                        status='ONLINE'
                      />
                    </div>
                  ) : (
                    React.createElement(icon, {
                      className: 'w-5 h-5',
                    })
                  )}
                </div>
                <div
                  className='text-xs font-medium leading-tight text-center flex items-center justify-center gap-1'
                  style={{ textShadow: '0 1px 1px rgba(255, 255, 255, 0.8)' }}
                >
                  {id === 'account'
                    ? 'You'
                    : id === 'suggested'
                      ? 'Discover'
                      : id === 'connections'
                        ? 'Connect'
                        : id === 'notifications'
                          ? 'Notify'
                          : label}
                </div>
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Bug Report Dialog */}
      <BugReportDialog
        isOpen={isBugReportOpen}
        onClose={() => setIsBugReportOpen(false)}
      />
    </>
  );
}
