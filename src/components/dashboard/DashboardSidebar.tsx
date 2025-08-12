'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, Sparkles, Users, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useAuth } from '@/contexts/AuthContext';

import UserAvatar from '../UserAvatar';
import { notificationService } from '../../services/notification.service';
import { useChatRequests } from '../../hooks/realtime/useChatRequests';

type SidebarSection =
  | 'all'
  | 'connections'
  | 'suggested'
  | 'search'
  | 'notifications'
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
  const { onboardingStatus } = useAuth();
  const { user } = useAuthenticator();
  const [notificationCount, setNotificationCount] = useState(0);

  const {
    incomingRequests: realtimeChatRequests,
    isLoadingIncoming: chatRequestsLoading,
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

  // Simple notification count tracking (lightweight)
  useEffect(() => {
    if (!user) {
      setNotificationCount(0);
      return;
    }

    // Just get the count, don't store all notification data
    const getNotificationCount = async () => {
      try {
        const result = await notificationService.getUnreadNotifications(
          user.userId
        );
        if (result.data) {
          const count = result.data.reduce((total, notification) => {
            if (
              notification.type === 'message' &&
              notification.data &&
              'messageCount' in notification.data
            ) {
              return total + (notification.data.messageCount || 1);
            }
            return total + 1;
          }, 0);
          setNotificationCount(count);
        }
      } catch (error) {
        console.error('Error getting notification count:', error);
      }
    };

    // Lightweight subscription just for count updates
    const notificationSubscription =
      notificationService.observeUserNotifications(
        user.userId,
        notifications => {
          const count = notifications.reduce((total, notification) => {
            if (
              notification.type === 'message' &&
              notification.data &&
              'messageCount' in notification.data
            ) {
              return total + (notification.data.messageCount || 1);
            }
            return total + 1;
          }, 0);
          setNotificationCount(count);
        },
        error => {
          console.error('Error observing notification count:', error);
        }
      );

    const timeoutId = setTimeout(getNotificationCount, 500); // Faster initial load

    return () => {
      clearTimeout(timeoutId);
      notificationSubscription.unsubscribe();
    };
  }, [user]);

  // Update count when chat requests change
  useEffect(() => {
    if (!user) return;

    // Recalculate total count including chat requests
    const updateTotalCount = async () => {
      try {
        const result = await notificationService.getUnreadNotifications(
          user.userId
        );
        let count = 0;

        if (result.data) {
          count = result.data.reduce((total, notification) => {
            if (
              notification.type === 'message' &&
              notification.data &&
              'messageCount' in notification.data
            ) {
              return total + (notification.data.messageCount || 1);
            }
            return total + 1;
          }, 0);
        }

        // Add chat requests
        if (realtimeChatRequests && !chatRequestsLoading) {
          count += realtimeChatRequests.length;
        }

        setNotificationCount(count);
      } catch (error) {
        console.error('Error updating notification count:', error);
      }
    };

    updateTotalCount();
  }, [user, realtimeChatRequests, chatRequestsLoading]);

  const sidebarItems = [
    {
      id: 'suggested' as const,
      icon: Sparkles,
      label: 'Suggested',
      count: suggestedUsersCount,
    },
    {
      id: 'search' as const,
      icon: Search,
      label: 'Search',
      count: 0,
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
      <div className='hidden lg:block w-64 flex-shrink-0'>
        <div className='bg-white rounded-2xl border border-zinc-200 h-full flex flex-col'>
          {/* Logo at top */}
          <div className='px-4 py-6 border-b border-zinc-100'>
            <Link
              href='/?stay=true'
              className='flex items-center gap-3 hover:opacity-80 transition-opacity'
            >
              <Image
                src='/loopn.svg'
                alt='Loopn'
                width={28}
                height={28}
                priority
              />
              <h1 className='text-xl font-bold text-zinc-900'>Loopn</h1>
            </Link>
          </div>

          {/* Navigation items */}
          <nav className='flex-1 overflow-y-auto py-4'>
            <div className='px-2 space-y-1'>
              {sidebarItems.map(({ id, icon, label, count }) => (
                <button
                  key={id}
                  onClick={() => onSectionChange(id)}
                  className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left group border ${
                    activeSection === id
                      ? 'bg-brand-50 text-brand-700 border-brand-200'
                      : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 border-transparent'
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
                  <span className='font-medium text-sm flex-1'>{label}</span>
                  {count > 0 && (
                    <span
                      className={`text-xs font-semibold flex items-center justify-center h-5 w-5 rounded-full text-center ${
                        id === 'notifications'
                          ? 'bg-b_red-500 text-white'
                          : activeSection === id
                            ? 'bg-brand-200 text-brand-800'
                            : 'bg-zinc-200 text-zinc-600'
                      }`}
                    >
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </nav>

          {/* Account button at bottom */}
          <div className='border-t border-zinc-100 p-2'>
            <button
              onClick={() => onSectionChange(accountItem.id)}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left group border ${
                activeSection === accountItem.id
                  ? 'bg-brand-50 text-brand-700 border-brand-200'
                  : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 border-transparent'
              }`}
            >
              <div className='w-5 h-5 flex-shrink-0 flex items-center justify-center'>
                <UserAvatar
                  email={getUserEmail()}
                  userId={user?.userId}
                  profilePictureUrl={
                    onboardingStatus?.onboardingData?.profilePictureUrl
                  }
                  hasProfilePicture={
                    !!onboardingStatus?.onboardingData?.profilePictureUrl
                  }
                  size='xs'
                />
              </div>
              <span className='font-medium text-sm flex-1'>
                {accountItem.label}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <div className='lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-zinc-200'>
        <nav className='flex justify-center items-stretch px-4 py-2'>
          <div className='flex bg-zinc-50 rounded-2xl p-1 gap-0.5 w-full max-w-md'>
            {[...sidebarItems, accountItem].map(
              ({ id, icon, label, count }) => (
                <button
                  key={id}
                  onClick={() => onSectionChange(id)}
                  className={`relative flex-1 flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-xl border ${
                    activeSection === id
                      ? 'text-brand-600 bg-white shadow-sm border-brand-100'
                      : 'text-zinc-500 hover:text-zinc-700 hover:bg-white/60 border-transparent'
                  }`}
                  title={label}
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
                    ) : icon === 'UserAvatar' ? (
                      <UserAvatar
                        email={getUserEmail()}
                        userId={user?.userId}
                        profilePictureUrl={
                          onboardingStatus?.onboardingData?.profilePictureUrl
                        }
                        hasProfilePicture={
                          !!onboardingStatus?.onboardingData?.profilePictureUrl
                        }
                        size='xs'
                      />
                    ) : (
                      React.createElement(icon, {
                        className: 'w-5 h-5',
                      })
                    )}
                  </div>
                  <span className='text-xs font-medium leading-tight text-center'>
                    {label}
                  </span>

                  {/* Count indicator for mobile */}
                  {count > 0 && (
                    <span
                      className={`absolute -top-0.5 -right-0.5 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold shadow-sm ${
                        id === 'notifications' ? 'bg-b_red-500' : 'bg-brand-500'
                      }`}
                    >
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                </button>
              )
            )}
          </div>
        </nav>
      </div>
    </>
  );
}
