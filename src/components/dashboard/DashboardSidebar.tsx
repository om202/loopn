'use client';

import React, { useState } from 'react';
import { Compass, Bug, Bookmark } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useAuth } from '@/contexts/AuthContext';

import UserAvatar from '../UserAvatar';
import BugReportDialog from '../BugReportDialog';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useChatRequests } from '../../hooks/useChatRequests';
import { useNotifications } from '../../hooks/useNotifications';
import { useSavedUsers } from '../../hooks/useSavedUsers';

// Custom Connect Icon using circles from logo
const ConnectIcon = ({ className }: { className?: string }) => (
  <svg
    width='20'
    height='20'
    viewBox='30 30 160 160'
    className={className}
    fill='none'
    stroke='currentColor'
    strokeWidth='13'
  >
    <circle cx='75' cy='110' r='35' />
    <circle cx='145' cy='110' r='35' />
  </svg>
);

type SidebarSection =
  | 'connections'
  | 'suggested'
  | 'saved'
  | 'search'
  | 'notifications'
  | 'account';

interface DashboardSidebarProps {
  activeSection: SidebarSection;
  onSectionChange: (section: SidebarSection) => void;
  connectionsCount: number;
  suggestedUsersCount: number;
}

export default function DashboardSidebar({
  activeSection,
  onSectionChange,
  connectionsCount,
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

  // Use our centralized saved users hook for count
  const { savedCount } = useSavedUsers({
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

  // Notification count is now handled by useNotifications hook (includes connection requests)

  const sidebarItems = [
    {
      id: 'suggested' as const,
      icon: Compass,
      label: 'Discover',
      count: suggestedUsersCount,
    },
    {
      id: 'connections' as const,
      icon: 'ConnectIcon',
      label: 'Connections',
      count: connectionsCount,
    },
    {
      id: 'saved' as const,
      icon: Bookmark,
      label: 'Saved',
      count: savedCount,
    },
    {
      id: 'notifications' as const,
      icon: 'NotificationBell',
      label: 'Notifications',
      count: notificationCount,
    },
  ];

  const accountItem = {
    id: 'account' as const,
    icon: 'UserAvatar',
    label: getUserDisplayName(),
    count: 0,
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className='hidden lg:block w-56 flex-shrink-0'>
        <div className='bg-white rounded-2xl h-full flex flex-col border border-slate-200'>
          {/* Logo at top */}
          <div className='px-3 py-3 border-b border-slate-100'>
            <div className='flex items-center justify-between'>
              <Link
                href='/?stay=true'
                className='flex items-center gap-3 hover:opacity-80 transition-opacity'
              >
                <Image
                  src='/loopn.svg'
                  alt='Loopn'
                  width={36}
                  height={36}
                  priority
                />
                <div className='flex items-center gap-2'>
                  <h1 className='text-[26px] font-bold text-brand-600'>
                    Loopn
                  </h1>
                </div>
              </Link>
            </div>
          </div>

          {/* Navigation items */}
          <nav className='flex-1 overflow-y-auto py-3'>
            <div className='px-3 space-y-2'>
              {sidebarItems.map(({ id, icon, label, count }) => (
                <button
                  key={id}
                  onClick={() => onSectionChange(id)}
                  className={`relative w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left group transition-colors ${
                    activeSection === id
                      ? 'text-brand-600 bg-brand-50 font-medium'
                      : 'text-black hover:bg-slate-50 font-medium'
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
                          strokeWidth={
                            count > 0 && id === 'notifications' ? 2.5 : 2
                          }
                          d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
                        />
                      </svg>
                    ) : icon === 'ConnectIcon' ? (
                      <ConnectIcon className='w-5 h-5' />
                    ) : (
                      React.createElement(icon, {
                        className: 'w-5 h-5',
                      })
                    )}
                  </div>
                  <span className='flex-1 flex items-center justify-between min-w-0'>
                    <span
                      className={`text-base truncate ${count > 0 && id === 'notifications' ? 'font-semibold' : 'font-medium'} flex items-center gap-2`}
                    >
                      {label}
                      {count > 0 && id === 'notifications' && (
                        <span className='w-2 h-2 rounded-full bg-brand-500 flex-shrink-0'></span>
                      )}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </nav>

          {/* Account and utility buttons at bottom */}
          <div className='border-t border-slate-100 px-3 py-2 space-y-2'>
            {/* Bug Report Button */}
            <button
              onClick={() => setIsBugReportOpen(true)}
              className='relative w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left group transition-colors text-black hover:bg-slate-50 font-medium'
            >
              <div className='w-5 h-5 flex-shrink-0 flex items-center justify-center'>
                <Bug className='w-4 h-4' />
              </div>
              <span className='text-sm font-medium'>Report Bug</span>
            </button>

            {/* Account Button */}
            <button
              onClick={() => onSectionChange(accountItem.id)}
              className={`relative w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left group transition-colors ${
                activeSection === accountItem.id
                  ? 'text-brand-600 bg-brand-50 font-medium'
                  : 'text-black hover:bg-slate-50 font-medium'
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
                  showStatus={false}
                />
              </div>
              <div className='flex-1 min-w-0'>
                <div className={`text-black text-sm font-medium truncate`}>
                  {accountItem.label}
                </div>
                <div className='text-sm text-slate-500'>Account</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <div className='lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-100 border-t border-slate-200'>
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
                    : 'text-black hover:text-black'
                }`}
                title={label}
              >
                <div className='relative w-6 h-6 flex-shrink-0 flex items-center justify-center'>
                  {icon === 'NotificationBell' ? (
                    <>
                      <svg
                        className='w-6 h-6'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={
                            count > 0 && id === 'notifications' ? 2.5 : 2
                          }
                          d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
                        />
                      </svg>
                    </>
                  ) : icon === 'UserAvatar' ? (
                    <div className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 ${
                      activeSection === id ? 'ring-2 ring-brand-500 ring-offset-1' : ''
                    }`}>
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
                        showStatus={false}
                      />
                    </div>
                  ) : icon === 'ConnectIcon' ? (
                    <ConnectIcon className='w-6 h-6' />
                  ) : (
                    React.createElement(icon, {
                      className: 'w-6 h-6',
                    })
                  )}
                </div>
                <div
                  className={`text-xs leading-tight text-center flex items-center justify-center gap-1 ${count > 0 && id === 'notifications' ? 'font-semibold' : 'font-medium'}`}
                  style={{ textShadow: '0 1px 1px rgba(255, 255, 255, 0.8)' }}
                >
                  {id === 'account'
                    ? ''
                    : id === 'suggested'
                      ? 'Discover'
                      : id === 'saved'
                        ? 'Saved'
                        : id === 'connections'
                          ? 'Connect'
                          : id === 'notifications'
                            ? 'Notify'
                            : label}
                  {count > 0 && id === 'notifications' && (
                    <span className='w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0'></span>
                  )}
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
