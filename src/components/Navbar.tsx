'use client';

import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

import { simplePresenceManager } from '../lib/presence-utils';
import { UserProfileService } from '../services/user-profile.service';

import { NotificationBell } from './notifications';
import UserAvatar from './UserAvatar';

export default function Navbar() {
  const { handleSignOut, user } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userSummary, setUserSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getUserEmail = () => {
    return user?.signInDetails?.loginId || '';
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load current user's AI summary
  useEffect(() => {
    let mounted = true;

    const loadUserSummary = async () => {
      if (!user?.userId) return;

      setLoadingSummary(true);
      try {
        const summary = await UserProfileService.getProfileSummary(user.userId);
        if (mounted) {
          setUserSummary(summary);
        }
      } catch (error) {
        console.error('Error loading user summary:', error);
      } finally {
        if (mounted) {
          setLoadingSummary(false);
        }
      }
    };

    loadUserSummary();

    return () => {
      mounted = false;
    };
  }, [user?.userId]);

  const handleSignOutClick = async () => {
    // Use the presence manager's setOffline method for proper cleanup
    await simplePresenceManager.setOffline();
    handleSignOut();
  };

  return (
    <nav className='bg-white/95 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-40'>
      <div className='w-full px-3 sm:px-4 lg:px-6'>
        <div className='flex items-center justify-between h-14 sm:h-16'>
          {/* Logo */}
          <div className='flex items-center'>
            <Link
              href='/?stay=true'
              className='flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity'
            >
              <Image
                src='/loopn.svg'
                alt='Loopn'
                width={32}
                height={32}
                className='sm:w-10 sm:h-10'
                priority
              />
              <h1 className='text-lg sm:text-xl font-semibold text-zinc-900'>
                Loopn
              </h1>
            </Link>
          </div>

          {/* Right side icons */}
          <div className='flex items-center gap-3 sm:gap-4'>
            <NotificationBell />

            {/* User menu */}
            <div className='relative' ref={dropdownRef}>
              <div>
                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                <div
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className='p-1.5 rounded-full hover:bg-zinc-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors'
                >
                  <span className='sr-only'>Open user menu</span>
                  <div className='sm:hidden'>
                    <UserAvatar email={getUserEmail()} size='sm' />
                  </div>
                  <div className='hidden sm:block'>
                    <UserAvatar email={getUserEmail()} size='md' />
                  </div>
                </div>
              </div>

              {isDropdownOpen && (
                <div
                  className='origin-top-right absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl shadow-sm bg-white/95 backdrop-blur-md border border-zinc-200 focus:outline-none z-50'
                  role='menu'
                  aria-orientation='vertical'
                  aria-labelledby='user-menu-button'
                  tabIndex={-1}
                >
                  <div className='py-1' role='none'>
                    <div className='flex flex-col items-center px-4 py-4 sm:py-5 border-b border-zinc-200'>
                      <UserAvatar email={getUserEmail()} size='lg' />
                      <p className='mt-3 text-sm sm:text-base font-medium text-zinc-900 truncate no-email-detection max-w-full px-2'>
                        {getUserEmail()}
                      </p>
                      <p className='text-xs sm:text-sm text-zinc-500'>
                        Welcome
                      </p>

                      {/* AI Profile Summary */}
                      {loadingSummary ? (
                        <div className='mt-3 w-full flex items-center gap-2 text-sm text-zinc-500'>
                          <div className='w-2 h-2 bg-zinc-100 rounded-full animate-pulse'></div>
                          <span>Loading summary...</span>
                        </div>
                      ) : userSummary ? (
                        <div className='mt-3 w-full'>
                          <div className='text-sm bg-zinc-100 rounded-lg p-3 border border-zinc-200'>
                            <p className='text-zinc-900 mb-2 font-bold'>
                              Anonymous Overview
                            </p>
                            <div className='text-zinc-900 leading-relaxed text-left'>
                              {userSummary}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <div className='p-2'>
                      <button
                        onClick={handleSignOutClick}
                        className='w-full text-left rounded-xl px-4 py-3 text-sm text-zinc-900 hover:bg-zinc-100 flex items-center gap-3 transition-colors'
                        role='menuitem'
                        tabIndex={-1}
                        id='user-menu-item-2'
                      >
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          className='h-5 w-5 text-zinc-500'
                          fill='none'
                          viewBox='0 0 24 24'
                          stroke='currentColor'
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                          />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
