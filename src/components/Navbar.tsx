'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

import { simplePresenceManager } from '../lib/presence-utils';

import { NotificationBell } from './notifications';
import UserAvatar from './UserAvatar';

export default function Navbar() {
  const { signOut, user } = useAuthenticator(context => [
    context.signOut,
    context.user,
  ]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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

  const handleSignOut = async () => {
    // Use the presence manager's setOffline method for proper cleanup
    await simplePresenceManager.setOffline();
    signOut();
  };

  return (
    <nav className='bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40'>
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
              <h1 className='text-lg sm:text-xl font-semibold text-gray-800'>Loopn</h1>
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
                  className='p-1.5 rounded-full hover:bg-gray-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
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
                  className='origin-top-right absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl shadow-xl bg-white/95 backdrop-blur-md border border-gray-200 focus:outline-none z-50'
                  role='menu'
                  aria-orientation='vertical'
                  aria-labelledby='user-menu-button'
                  tabIndex={-1}
                >
                  <div className='py-1' role='none'>
                    <div className='flex flex-col items-center px-4 py-4 sm:py-5 border-b border-gray-200'>
                      <UserAvatar email={getUserEmail()} size='lg' />
                      <p className='mt-3 text-sm sm:text-base font-medium text-gray-800 truncate no-email-detection max-w-full px-2'>
                        {getUserEmail()}
                      </p>
                      <p className='text-xs sm:text-sm text-gray-500'>
                        Welcome
                      </p>
                    </div>
                    <div className='p-2'>
                      <button
                        onClick={handleSignOut}
                        className='w-full text-left rounded-xl px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors'
                        role='menuitem'
                        tabIndex={-1}
                        id='user-menu-item-2'
                      >
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          className='h-5 w-5 text-gray-500'
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
