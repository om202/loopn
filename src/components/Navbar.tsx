'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import Image from 'next/image';
import { useState } from 'react';

import { userService } from '../services/user.service';
import UserAvatar from './UserAvatar';

export default function Navbar() {
  const { signOut, user } = useAuthenticator(context => [
    context.signOut,
    context.user,
  ]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getUserInitial = () => {
    return user?.signInDetails?.loginId?.charAt(0).toUpperCase() || 'U';
  };

  const getUserEmail = () => {
    return user?.signInDetails?.loginId || '';
  };

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

          {/* User Menu */}
          <button
            className='relative'
            onMouseEnter={() => setIsDropdownOpen(true)}
            onMouseLeave={() => setIsDropdownOpen(false)}
          >
            <div className='flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors'>
              <UserAvatar 
                email={getUserEmail()} 
                size="sm"
              />
            </div>

            {/* Dropdown Menu */}
            {isDropdownOpen ? (
              <div className='absolute right-0 top-full w-72 max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-10'>
                <div className='px-4 py-3 border-b border-gray-100'>
                  <div className='flex items-center space-x-3'>
                    <UserAvatar 
                      email={getUserEmail()} 
                      size="md"
                      className="flex-shrink-0"
                    />
                    <div className='min-w-0 flex-1'>
                      <p className='text-sm font-medium text-gray-900'>
                        Professional
                      </p>
                      <p
                        className='text-sm text-gray-600 truncate'
                        title={getUserEmail()}
                      >
                        {getUserEmail()}
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  onClick={handleSignOut}
                  className='w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer'
                >
                  Sign Out
                </div>
              </div>
            ) : null}
          </button>
        </div>
      </div>
    </div>
  );
}
