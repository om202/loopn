'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, Home, Users, HelpCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useAuth } from '@/contexts/AuthContext';

import UserAvatar from '../UserAvatar';
import { notificationService } from '../../services/notification.service';
import { useChatRequests } from '../../hooks/realtime/useChatRequests';
import { UserProfileService } from '../../services/user-profile.service';
import type { Schema } from '../../../amplify/data/resource';

type UserProfile = Schema['UserProfile']['type'];

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
  const { onboardingStatus } = useAuth();
  const { user } = useAuthenticator();
  const [notificationCount, setNotificationCount] = useState(0);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

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

  // Load current user's profile data
  useEffect(() => {
    let mounted = true;

    const loadUserProfile = async () => {
      if (!user?.userId) return;

      try {
        const profile = await UserProfileService.getProfileDetails(user.userId);
        if (mounted) {
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error loading user profile in sidebar:', error);
      }
    };

    loadUserProfile();

    return () => {
      mounted = false;
    };
  }, [user?.userId]);

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
      icon: Home,
      label: 'Home',
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
                width={32}
                height={32}
                priority
              />
              <h1 className='text-2xl font-bold text-zinc-900'>Loopn</h1>
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
                  {count > 0 && id === 'notifications' && (
                    <span className='text-xs font-semibold flex items-center justify-center h-5 w-5 rounded-full text-center bg-b_red-500 text-white'>
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </nav>

          {/* Help and Account buttons at bottom */}
          <div className='border-t border-zinc-100 p-2 space-y-1'>
            {/* Help Button */}
            <button
              onClick={() => onSectionChange(helpItem.id)}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left group border ${
                activeSection === helpItem.id
                  ? 'bg-brand-50 text-brand-700 border-brand-200'
                  : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 border-transparent'
              }`}
            >
              <div className='w-5 h-5 flex-shrink-0 flex items-center justify-center'>
                <HelpCircle className='w-5 h-5' />
              </div>
              <span className='font-medium text-sm flex-1'>
                {helpItem.label}
              </span>
            </button>

            {/* Account Button */}
            <button
              onClick={() => onSectionChange(accountItem.id)}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left group border ${
                activeSection === accountItem.id
                  ? 'bg-brand-50 text-brand-700 border-brand-200'
                  : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 border-transparent'
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
                <div className='font-medium text-sm'>{accountItem.label}</div>
                <div className='text-xs text-zinc-500'>You</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <div className='lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-zinc-200'>
        <nav className='flex items-stretch px-4 py-2'>
          <div className='flex w-full'>
            {[
              // Filter out help for mobile
              ...sidebarItems,
              accountItem,
            ].map(({ id, icon, label, count }) => (
              <button
                key={id}
                onClick={() => onSectionChange(id)}
                className={`relative flex-1 flex flex-col items-center justify-center gap-1.5 px-1 py-2.5 ${
                  activeSection === id
                    ? 'text-brand-600'
                    : 'text-zinc-700 hover:text-zinc-800'
                }`}
                title={label}
              >
                <div className='relative w-6 h-6 flex-shrink-0 flex items-center justify-center'>
                  {icon === 'NotificationBell' ? (
                    <svg
                      className='w-6 h-6'
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
                    <div className='w-6 h-6 flex items-center justify-center'>
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
                        size='xs'
                        showStatus={true}
                        status='ONLINE'
                      />
                    </div>
                  ) : (
                    React.createElement(icon, {
                      className: 'w-6 h-6',
                    })
                  )}

                  {/* Count indicator positioned on the icon */}
                  {count > 0 && id === 'notifications' && (
                    <span
                      className='absolute -top-3 -right-3 bg-zinc-100 text-[9px] rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-sm border border-b_red-500 text-b_red-600 leading-none'
                      style={{ minWidth: '20px', minHeight: '20px' }}
                    >
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                </div>
                <div
                  className='text-[10px] font-medium leading-tight text-center'
                  style={{ textShadow: '0 1px 1px rgba(255, 255, 255, 0.8)' }}
                >
                  {id === 'account'
                    ? 'You'
                    : id === 'suggested'
                      ? 'Home'
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
    </>
  );
}
