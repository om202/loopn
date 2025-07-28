'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';

import { userService } from '../services/user.service';

import CircularIcon from './CircularIcon';
import NotificationBell from './NotificationBell';
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
    if (user) {
      // Set user offline immediately before signing out
      await userService.setUserOffline(
        user.userId,
        user.signInDetails?.loginId || ''
      );
    }
    signOut();
  };

  return (
    <div className='bg-white border-b border-gray-200'>
      <div className='max-w-6xl mx-auto px-6 py-4'>
        <div className='flex items-center justify-between'>
          {/* Logo */}
          <div className='flex items-center space-x-3'>
            <Image src='/loopn.svg' alt='Loopn' width={32} height={32} />
            <h1 className='text-xl font-bold text-gray-900'>Loopn</h1>
          </div>

          {/* Notifications and User Menu */}
          <div className='flex items-center gap-2'>
            <NotificationBell />
            <div className='relative' ref={dropdownRef}>
              <button onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <div className='relative p-2 rounded-lg hover:bg-gray-50 transition-colors'>
                  <UserAvatar email={getUserEmail()} size='md' />
                  {/* Dropdown Arrow - Bottom Right Corner */}
                  <div className='absolute bottom-1 right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center border border-gray-200'>
                    <svg
                      className='w-2.5 h-2.5 text-gray-600'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M19 9l-7 7-7-7'
                      />
                    </svg>
                  </div>
                </div>

                {/* Dropdown Menu */}
                {isDropdownOpen ? (
                  <div className='absolute right-0 top-full w-80 max-w-md bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-10'>
                    <div className='px-4 py-3 border-b border-gray-100'>
                      <div className='flex items-center space-x-3'>
                        <UserAvatar
                          email={getUserEmail()}
                          size='sm'
                          className='flex-shrink-0'
                        />
                        <div className='min-w-0 flex-1'>
                          <p
                            className='text-base font-medium text-gray-900 truncate text-left'
                            title={getUserEmail()}
                          >
                            {getUserEmail()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div
                      onClick={handleSignOut}
                      className='w-full text-left px-4 py-3 text-base text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-3'
                    >
                      <CircularIcon
                        size='md'
                        icon={
                          <svg
                            className='text-gray-600'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                            />
                          </svg>
                        }
                      />
                      Sign Out
                    </div>
                  </div>
                ) : null}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
