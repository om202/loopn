'use client';

import {
  MessageCircle,
  CheckCircle2,
  Users,
  Compass,
  HelpCircle,
  Bell,
  Search,
} from 'lucide-react';
import Image from 'next/image';
import React from 'react';

export default function DashboardDemo() {
  return (
    <div className='bg-white md:rounded-2xl shadow-xl border border-zinc-200 md:max-w-7xl md:mx-auto overflow-hidden w-full'>
      {/* Dashboard Layout - Desktop and Tablet */}
      <div className='hidden md:flex h-[650px]'>
        {/* Left Sidebar */}
        <div className='w-64 bg-white rounded-2xl border border-zinc-200 flex flex-col'>
          {/* Logo at top */}
          <div className='px-4 py-6 border-b border-zinc-100'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <Image
                  src='/loopn.svg'
                  alt='Loopn'
                  width={32}
                  height={32}
                  priority
                />
                <div className='flex items-center gap-2'>
                  <h1 className='text-2xl font-bold text-zinc-900'>Loopn</h1>
                  <span className='bg-brand-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full tracking-wide uppercase'>
                    beta
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation items */}
          <nav className='flex-1 overflow-y-auto py-4'>
            <div className='px-2 space-y-1'>
              {/* Discover - Active */}
              <button
                disabled
                className='relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left group border transition-colors duration-150 bg-brand-50 text-brand-700 border-brand-200 cursor-not-allowed opacity-90'
              >
                <div className='w-5 h-5 flex-shrink-0 flex items-center justify-center'>
                  <Compass className='w-5 h-5' />
                </div>
                <span className='font-medium text-base flex-1 flex items-center gap-3'>
                  Discover
                </span>
              </button>

              {/* Connections */}
              <button
                disabled
                className='relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left group border transition-colors duration-150 text-zinc-900 hover:bg-zinc-50 hover:text-zinc-900 border-transparent cursor-not-allowed opacity-70'
              >
                <div className='w-5 h-5 flex-shrink-0 flex items-center justify-center'>
                  <Users className='w-5 h-5' />
                </div>
                <span className='font-medium text-base flex-1 flex items-center gap-3'>
                  Connections
                </span>
              </button>

              {/* Chats */}
              <button
                disabled
                className='relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left group border transition-colors duration-150 text-zinc-900 hover:bg-zinc-50 hover:text-zinc-900 border-transparent cursor-not-allowed opacity-70'
              >
                <div className='w-5 h-5 flex-shrink-0 flex items-center justify-center'>
                  <MessageCircle className='w-5 h-5' />
                </div>
                <span className='font-medium text-base flex-1 flex items-center gap-3'>
                  Chats
                </span>
              </button>

              {/* Notifications */}
              <button
                disabled
                className='relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left group border transition-colors duration-150 text-zinc-900 hover:bg-zinc-50 hover:text-zinc-900 border-transparent cursor-not-allowed opacity-70'
              >
                <div className='w-5 h-5 flex-shrink-0 flex items-center justify-center'>
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
                </div>
                <span className='font-medium text-base flex-1 flex items-center gap-3'>
                  Notifications
                  <span className='text-xs font-bold flex items-center justify-center h-6 w-6 rounded-full text-center bg-brand-50 text-brand-500 border border-brand-100'>
                    2
                  </span>
                </span>
              </button>
            </div>
          </nav>

          {/* Help and Account buttons at bottom */}
          <div className='border-t border-zinc-100 p-2 space-y-1'>
            {/* Help Button */}
            <div className='flex items-center gap-2'>
              <button
                disabled
                className='relative flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-left group border transition-colors duration-150 text-zinc-900 hover:bg-zinc-50 hover:text-zinc-900 border-transparent cursor-not-allowed opacity-70'
              >
                <div className='w-5 h-5 flex-shrink-0 flex items-center justify-center'>
                  <HelpCircle className='w-5 h-5' />
                </div>
                <span className='font-medium text-base flex-1'>
                  Help & Support
                </span>
              </button>

              <button
                disabled
                className='p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-colors border border-transparent hover:border-zinc-200 cursor-not-allowed opacity-50'
                title='Report Bug / Share Suggestion'
              >
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z'
                  />
                </svg>
              </button>
            </div>

            {/* Account Button */}
            <button
              disabled
              className='relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left group border transition-colors duration-150 text-zinc-900 hover:bg-zinc-50 hover:text-zinc-900 border-transparent cursor-not-allowed opacity-70'
            >
              <div className='w-5 h-5 flex-shrink-0 flex items-center justify-center'>
                <div className='relative'>
                  <Image
                    src='/dummy-users/dummy-user5.jpg'
                    alt='Your Profile'
                    width={20}
                    height={20}
                    className='w-5 h-5 rounded-full object-cover'
                  />
                  <div className='absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-b_green-400 border border-white rounded-full'></div>
                </div>
              </div>
              <span className='font-medium text-base flex-1 truncate'>
                Jordan Blake
              </span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className='flex-1 bg-white rounded-2xl border border-zinc-200 p-2 sm:p-4 lg:p-6 overflow-hidden flex flex-col min-h-0 ml-4'>
          {/* Search User - Always visible at top */}
          <div className='flex-shrink-0 mb-2 sm:mb-2'>
            <div className='max-w-md mx-auto relative'>
              <div className='relative'>
                <svg
                  className='absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M13 10V3L4 14h7v7l9-11h-7z'
                  />
                </svg>
                <input
                  type='text'
                  placeholder='Search or ask Loopn'
                  disabled
                  style={{
                    fontSize: '16px',
                    WebkitAppearance: 'none',
                    MozAppearance: 'textfield',
                  }}
                  className='w-full pl-10 pr-16 py-3 rounded-full border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand-200 focus:bg-white bg-zinc-100 hover:bg-brand-50 transition-colors placeholder-zinc-500 cursor-not-allowed opacity-70'
                />
                <button
                  type='button'
                  disabled
                  className='absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full hover:bg-gray-50 flex items-center justify-center transition-colors duration-150 shadow-sm border border-gray-200 cursor-not-allowed opacity-70'
                >
                  <svg
                    className='w-4 h-4 text-brand-500'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Section Header */}
          <div className='flex-shrink-0 mb-4 sm:mb-5 lg:mb-6'>
            <h2 className='text-xl font-bold text-zinc-900 mb-1'>
              Smart Matches for You
            </h2>
            <p className='text-sm text-zinc-600'>
              AI-curated professionals based on your interests and goals
            </p>
          </div>

          {/* User Cards Grid - Using Real UserCard Style */}
          <div className='flex-1 overflow-y-auto'>
            <div className='space-y-0'>
              {/* User Card 1 - Zara Thompson */}
              <div className='px-3 py-2 group transition-all duration-200 cursor-pointer bg-white hover:bg-zinc-50 hover:rounded-2xl border border-transparent border-b-zinc-100 opacity-0 animate-[slideUpFade_0.6s_ease-out_0.5s_forwards]'>
                <div className='flex items-center gap-3'>
                  <div className='flex-shrink-0'>
                    <div className='relative'>
                      <Image
                        src='/dummy-users/dummy-user6.jpg'
                        alt='Zara Thompson'
                        width={48}
                        height={48}
                        className='w-12 h-12 rounded-full object-cover'
                      />
                      <div className='absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-b_green-400 border-2 border-white rounded-full'></div>
                    </div>
                  </div>

                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1'>
                      <div className='text-zinc-900 truncate no-email-detection font-medium'>
                        Zara Thompson
                      </div>
                    </div>
                    <div className='text-[15px] text-zinc-500 mb-1.5 truncate'>
                      AI Researcher
                    </div>
                  </div>

                  <div className='flex-shrink-0 flex items-center gap-1.5'>
                    <button
                      disabled
                      className='px-2 py-1.5 text-base font-medium rounded-xl border transition-colors flex items-center justify-center flex-shrink-0 w-[40px] h-[40px] md:w-auto md:h-auto md:gap-1.5 md:min-w-[44px] bg-brand-50 text-brand-500 border-brand-100 hover:bg-brand-100 hover:border-brand-200 cursor-not-allowed opacity-80'
                    >
                      <CheckCircle2 className='w-4 h-4 text-brand-500 flex-shrink-0' />
                      <span className='hidden md:inline text-base font-medium'>
                        Send Request
                      </span>
                    </button>

                    <button
                      disabled
                      className='md:flex p-1.5 text-base font-medium rounded-full border transition-colors items-center justify-center w-[32px] h-[32px] bg-white border-zinc-100 hover:bg-zinc-100 cursor-not-allowed opacity-70'
                    >
                      <svg
                        className='w-5 h-5 text-zinc-500'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z'
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* User Card 2 - Kai Anderson */}
              <div className='px-3 py-2 group transition-all duration-200 cursor-pointer bg-white hover:bg-zinc-50 hover:rounded-2xl border border-transparent border-b-zinc-100 opacity-0 animate-[slideUpFade_0.6s_ease-out_1s_forwards]'>
                <div className='flex items-center gap-3'>
                  <div className='flex-shrink-0'>
                    <div className='relative'>
                      <Image
                        src='/dummy-users/dummy-user7.jpg'
                        alt='Kai Anderson'
                        width={48}
                        height={48}
                        className='w-12 h-12 rounded-full object-cover'
                      />
                      <div className='absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-b_green-400 border-2 border-white rounded-full'></div>
                    </div>
                  </div>

                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1'>
                      <div className='text-zinc-900 truncate no-email-detection font-medium'>
                        Kai Anderson
                      </div>
                    </div>
                    <div className='text-[15px] text-zinc-500 mb-1.5 truncate'>
                      Quantum Computing Engineer
                    </div>
                  </div>

                  <div className='flex-shrink-0 flex items-center gap-1.5'>
                    <button
                      disabled
                      className='px-2 py-1.5 text-base font-medium rounded-xl border transition-colors flex items-center justify-center flex-shrink-0 w-[40px] h-[40px] md:w-auto md:h-auto md:gap-1.5 md:min-w-[44px] bg-brand-50 text-brand-500 border-brand-100 hover:bg-brand-100 hover:border-brand-200 cursor-not-allowed opacity-80'
                    >
                      <MessageCircle className='w-4 h-4 text-brand-500 flex-shrink-0' />
                      <span className='hidden md:inline text-base font-medium'>
                        Chat
                      </span>
                    </button>

                    <button
                      disabled
                      className='md:flex p-1.5 text-base font-medium rounded-full border transition-colors items-center justify-center w-[32px] h-[32px] bg-white border-zinc-100 hover:bg-zinc-100 cursor-not-allowed opacity-70'
                    >
                      <svg
                        className='w-5 h-5 text-zinc-500'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z'
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* User Card 3 - Ganesh Thapa */}
              <div className='px-3 py-2 group transition-all duration-200 cursor-pointer bg-white hover:bg-zinc-50 hover:rounded-2xl border border-transparent border-b-zinc-100 opacity-0 animate-[slideUpFade_0.6s_ease-out_1.5s_forwards]'>
                <div className='flex items-center gap-3'>
                  <div className='flex-shrink-0'>
                    <div className='relative'>
                      <Image
                        src='/dummy-users/dummy-user8.jpg'
                        alt='Ganesh Thapa'
                        width={48}
                        height={48}
                        className='w-12 h-12 rounded-full object-cover'
                      />
                      <div className='absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-b_green-400 border-2 border-white rounded-full'></div>
                    </div>
                  </div>

                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1'>
                      <div className='text-zinc-900 truncate no-email-detection font-medium'>
                        Ganesh Thapa
                      </div>
                    </div>
                    <div className='text-[15px] text-zinc-500 mb-1.5 truncate'>
                      Space Systems Engineer
                    </div>
                  </div>

                  <div className='flex-shrink-0 flex items-center gap-1.5'>
                    <button
                      disabled
                      className='px-2 py-1.5 text-base font-medium rounded-xl border transition-colors flex items-center justify-center flex-shrink-0 w-[40px] h-[40px] md:w-auto md:h-auto md:gap-1.5 md:min-w-[44px] bg-brand-50 text-brand-500 border-brand-100 hover:bg-brand-100 hover:border-brand-200 cursor-not-allowed opacity-80'
                    >
                      <CheckCircle2 className='w-4 h-4 text-brand-500 flex-shrink-0' />
                      <span className='hidden md:inline text-base font-medium'>
                        Send Request
                      </span>
                    </button>

                    <button
                      disabled
                      className='md:flex p-1.5 text-base font-medium rounded-full border transition-colors items-center justify-center w-[32px] h-[32px] bg-white border-zinc-100 hover:bg-zinc-100 cursor-not-allowed opacity-70'
                    >
                      <svg
                        className='w-5 h-5 text-zinc-500'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z'
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* User Card 4 - Haoyu Lee */}
              <div className='px-3 py-2 group transition-all duration-200 cursor-pointer bg-white hover:bg-zinc-50 hover:rounded-2xl border border-transparent border-b-zinc-100 opacity-0 animate-[slideUpFade_0.6s_ease-out_2s_forwards]'>
                <div className='flex items-center gap-3'>
                  <div className='flex-shrink-0'>
                    <div className='relative'>
                      <Image
                        src='/dummy-users/dummy-usr9.jpg'
                        alt='Haoyu Lee'
                        width={48}
                        height={48}
                        className='w-12 h-12 rounded-full object-cover'
                      />
                      <div className='absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-b_green-400 border-2 border-white rounded-full'></div>
                    </div>
                  </div>

                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1'>
                      <div className='text-zinc-900 truncate no-email-detection font-medium'>
                        Haoyu Lee
                      </div>
                    </div>
                    <div className='text-[15px] text-zinc-500 mb-1.5 truncate'>
                      Biotech Engineer
                    </div>
                  </div>

                  <div className='flex-shrink-0 flex items-center gap-1.5'>
                    <button
                      disabled
                      className='px-2 py-1.5 text-base font-medium rounded-xl border transition-colors flex items-center justify-center flex-shrink-0 w-[40px] h-[40px] md:w-auto md:h-auto md:gap-1.5 md:min-w-[44px] bg-brand-50 text-brand-500 border-brand-100 hover:bg-brand-100 hover:border-brand-200 cursor-not-allowed opacity-80'
                    >
                      <MessageCircle className='w-4 h-4 text-brand-500 flex-shrink-0' />
                      <span className='hidden md:inline text-base font-medium'>
                        Chat
                      </span>
                    </button>

                    <button
                      disabled
                      className='md:flex p-1.5 text-base font-medium rounded-full border transition-colors items-center justify-center w-[32px] h-[32px] bg-white border-zinc-100 hover:bg-zinc-100 cursor-not-allowed opacity-70'
                    >
                      <svg
                        className='w-5 h-5 text-zinc-500'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z'
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* User Card 5 - Alex Chen */}
              <div className='px-3 py-2 group transition-all duration-200 cursor-pointer bg-white hover:bg-zinc-50 hover:rounded-2xl border border-transparent border-b-0 last:border-b-0 opacity-0 animate-[slideUpFade_0.6s_ease-out_2.5s_forwards]'>
                <div className='flex items-center gap-3'>
                  <div className='flex-shrink-0'>
                    <div className='relative'>
                      <Image
                        src='/dummy-users/dummy-user2.jpg'
                        alt='Alex Chen'
                        width={48}
                        height={48}
                        className='w-12 h-12 rounded-full object-cover'
                      />
                      <div className='absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-b_green-400 border-2 border-white rounded-full'></div>
                    </div>
                  </div>

                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1'>
                      <div className='text-zinc-900 truncate no-email-detection font-medium'>
                        Alex Chen
                      </div>
                    </div>
                    <div className='text-[15px] text-zinc-500 mb-1.5 truncate'>
                      Full-Stack Developer
                    </div>
                  </div>

                  <div className='flex-shrink-0 flex items-center gap-1.5'>
                    <button
                      disabled
                      className='px-2 py-1.5 text-base font-medium rounded-xl border transition-colors flex items-center justify-center flex-shrink-0 w-[40px] h-[40px] md:w-auto md:h-auto md:gap-1.5 md:min-w-[44px] bg-brand-50 text-brand-500 border-brand-100 hover:bg-brand-100 hover:border-brand-200 cursor-not-allowed opacity-80'
                    >
                      <CheckCircle2 className='w-4 h-4 text-brand-500 flex-shrink-0' />
                      <span className='hidden md:inline text-base font-medium'>
                        Send Request
                      </span>
                    </button>

                    <button
                      disabled
                      className='md:flex p-1.5 text-base font-medium rounded-full border transition-colors items-center justify-center w-[32px] h-[32px] bg-white border-zinc-100 hover:bg-zinc-100 cursor-not-allowed opacity-70'
                    >
                      <svg
                        className='w-5 h-5 text-zinc-500'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z'
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Dashboard Layout */}
      <div className='md:hidden'>
        {/* Mobile Header */}
        <div className='p-4 border-b border-zinc-200 bg-white'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='relative'>
                <Image
                  src='/dummy-users/dummy-user5.jpg'
                  alt='Your Profile'
                  width={40}
                  height={40}
                  className='w-10 h-10 rounded-full object-cover'
                />
                <div className='absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-b_green-400 border-2 border-white rounded-full'></div>
              </div>
              <div className='flex-1 min-w-0'>
                <h3 className='text-sm font-semibold text-zinc-900 truncate'>
                  Jordan Blake
                </h3>
                <p className='text-xs text-zinc-600 truncate'>
                  Blockchain Developer
                </p>
              </div>
            </div>
            <div className='flex items-center gap-3'>
              <div className='relative'>
                <Bell className='w-5 h-5 text-zinc-600' />
                <div className='absolute -top-1 -right-1 w-3 h-3 bg-brand-500 rounded-full flex items-center justify-center'>
                  <span className='text-white text-xs font-bold'>2</span>
                </div>
              </div>
              <Search className='w-5 h-5 text-zinc-600' />
              <MessageCircle className='w-5 h-5 text-zinc-600' />
            </div>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className='flex bg-zinc-50 border-b border-zinc-200'>
          <div className='flex-1 px-3 py-3 text-center text-sm font-medium text-brand-600 bg-white border-b-2 border-brand-500'>
            Suggested
          </div>
          <div className='flex-1 px-3 py-3 text-center text-sm font-medium text-zinc-600'>
            Connections
          </div>
          <div className='flex-1 px-3 py-3 text-center text-sm font-medium text-zinc-600 relative'>
            Notifications
            <div className='absolute -top-1 -right-1 w-4 h-4 bg-brand-500 rounded-full flex items-center justify-center'>
              <span className='text-white text-xs font-bold'>2</span>
            </div>
          </div>
          <div className='flex-1 px-3 py-3 text-center text-sm font-medium text-zinc-600'>
            Messages
          </div>
        </div>

        {/* Mobile Content */}
        <div className='p-4 bg-zinc-50 min-h-[500px]'>
          {/* Mobile Header */}
          <div className='mb-4'>
            <h2 className='text-lg font-bold text-zinc-900 mb-1'>
              Smart Matches for You
            </h2>
            <p className='text-sm text-zinc-600'>
              AI-curated professionals based on your interests
            </p>
          </div>

          {/* Mobile User Cards */}
          <div className='space-y-3'>
            {/* Mobile User Card 1 - Zara Thompson */}
            <div className='rounded-xl border px-3 py-3 group transition-all duration-200 cursor-pointer bg-white border-zinc-200 hover:bg-zinc-50 opacity-0 animate-[slideUpFade_0.6s_ease-out_0.5s_forwards]'>
              <div className='flex items-center gap-3'>
                <div className='flex-shrink-0'>
                  <div className='relative'>
                    <Image
                      src='/dummy-users/dummy-user6.jpg'
                      alt='Zara Thompson'
                      width={48}
                      height={48}
                      className='w-12 h-12 rounded-full object-cover border border-brand-500'
                    />
                    <div className='absolute -bottom-0 -right-0 w-3 h-3 bg-b_green-500 rounded-full border-2 border-white box-content'></div>
                  </div>
                </div>

                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 mb-1'>
                    <div className='text-zinc-900 truncate no-email-detection font-medium text-sm'>
                      Zara Thompson
                    </div>
                    <div className='w-2 h-2 bg-brand-500 rounded-full animate-pulse'></div>
                  </div>
                  <div className='text-xs mb-2 text-zinc-600'>
                    AI Researcher
                  </div>
                  <div className='flex flex-wrap gap-1'>
                    <span className='bg-brand-50 text-brand-700 text-xs px-2 py-0.5 rounded-full font-medium'>
                      Computer Vision
                    </span>
                    <span className='bg-zinc-100 text-zinc-700 text-xs px-2 py-0.5 rounded-full font-medium'>
                      Robotics
                    </span>
                  </div>
                </div>

                <div className='flex-shrink-0'>
                  <button
                    disabled
                    className='px-3 py-2 text-xs font-medium rounded-lg border transition-colors bg-white text-brand-500 border-zinc-200 hover:bg-brand-100 hover:border-zinc-200 flex items-center gap-1.5 opacity-80 cursor-not-allowed'
                  >
                    <MessageCircle className='w-3 h-3 text-brand-500 flex-shrink-0' />
                    Chat
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile User Card 2 - Kai Anderson */}
            <div className='rounded-xl border px-3 py-3 group transition-all duration-200 cursor-pointer bg-white border-zinc-200 hover:bg-zinc-50 opacity-0 animate-[slideUpFade_0.6s_ease-out_1s_forwards]'>
              <div className='flex items-center gap-3'>
                <div className='flex-shrink-0'>
                  <div className='relative'>
                    <Image
                      src='/dummy-users/dummy-user7.jpg'
                      alt='Kai Anderson'
                      width={48}
                      height={48}
                      className='w-12 h-12 rounded-full object-cover border border-brand-500'
                    />
                    <div className='absolute -bottom-0 -right-0 w-3 h-3 bg-b_green-500 rounded-full border-2 border-white box-content'></div>
                  </div>
                </div>

                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 mb-1'>
                    <div className='text-zinc-900 truncate no-email-detection font-medium text-sm'>
                      Kai Anderson
                    </div>
                  </div>
                  <div className='text-xs mb-2 text-zinc-600'>
                    Quantum Computing Engineer
                  </div>
                  <div className='flex flex-wrap gap-1'>
                    <span className='bg-brand-50 text-brand-700 text-xs px-2 py-0.5 rounded-full font-medium'>
                      Algorithms
                    </span>
                    <span className='bg-zinc-100 text-zinc-700 text-xs px-2 py-0.5 rounded-full font-medium'>
                      Hardware
                    </span>
                  </div>
                </div>

                <div className='flex-shrink-0'>
                  <button
                    disabled
                    className='px-3 py-2 text-xs font-medium rounded-lg border transition-colors bg-white text-brand-500 border-zinc-200 hover:bg-brand-100 hover:border-zinc-200 flex items-center gap-1.5 opacity-80 cursor-not-allowed'
                  >
                    <CheckCircle2 className='w-3 h-3 text-brand-500 flex-shrink-0' />
                    Start
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile User Card 3 - Ganesh Thapa */}
            <div className='rounded-xl border px-3 py-3 group transition-all duration-200 cursor-pointer bg-white border-zinc-200 hover:bg-zinc-50 opacity-0 animate-[slideUpFade_0.6s_ease-out_1.5s_forwards]'>
              <div className='flex items-center gap-3'>
                <div className='flex-shrink-0'>
                  <div className='relative'>
                    <Image
                      src='/dummy-users/dummy-user8.jpg'
                      alt='Ganesh Thapa'
                      width={48}
                      height={48}
                      className='w-12 h-12 rounded-full object-cover border border-brand-500'
                    />
                    <div className='absolute -bottom-0 -right-0 w-3 h-3 bg-b_green-500 rounded-full border-2 border-white box-content'></div>
                  </div>
                </div>

                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 mb-1'>
                    <div className='text-zinc-900 truncate no-email-detection font-medium text-sm'>
                      Ganesh Thapa
                    </div>
                  </div>
                  <div className='text-xs mb-2 text-zinc-600'>
                    Space Systems Engineer
                  </div>
                  <div className='flex flex-wrap gap-1'>
                    <span className='bg-brand-50 text-brand-700 text-xs px-2 py-0.5 rounded-full font-medium'>
                      Satellites
                    </span>
                    <span className='bg-zinc-100 text-zinc-700 text-xs px-2 py-0.5 rounded-full font-medium'>
                      Mission Planning
                    </span>
                  </div>
                </div>

                <div className='flex-shrink-0'>
                  <button
                    disabled
                    className='px-3 py-2 text-xs font-medium rounded-lg border transition-colors bg-white text-brand-500 border-zinc-200 hover:bg-brand-100 hover:border-zinc-200 flex items-center gap-1.5 opacity-80 cursor-not-allowed'
                  >
                    <MessageCircle className='w-3 h-3 text-brand-500 flex-shrink-0' />
                    Chat
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile User Card 4 - Haoyu Lee */}
            <div className='rounded-xl border px-3 py-3 group transition-all duration-200 cursor-pointer bg-white border-zinc-200 hover:bg-zinc-50 opacity-0 animate-[slideUpFade_0.6s_ease-out_2s_forwards]'>
              <div className='flex items-center gap-3'>
                <div className='flex-shrink-0'>
                  <div className='relative'>
                    <Image
                      src='/dummy-users/dummy-usr9.jpg'
                      alt='Haoyu Lee'
                      width={48}
                      height={48}
                      className='w-12 h-12 rounded-full object-cover border border-brand-500'
                    />
                    <div className='absolute -bottom-0 -right-0 w-3 h-3 bg-b_green-500 rounded-full border-2 border-white box-content'></div>
                  </div>
                </div>

                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 mb-1'>
                    <div className='text-zinc-900 truncate no-email-detection font-medium text-sm'>
                      Haoyu Lee
                    </div>
                  </div>
                  <div className='text-xs mb-2 text-zinc-600'>
                    Biotech Engineer
                  </div>
                  <div className='flex flex-wrap gap-1'>
                    <span className='bg-brand-50 text-brand-700 text-xs px-2 py-0.5 rounded-full font-medium'>
                      Gene Therapy
                    </span>
                    <span className='bg-zinc-100 text-zinc-700 text-xs px-2 py-0.5 rounded-full font-medium'>
                      Lab Automation
                    </span>
                  </div>
                </div>

                <div className='flex-shrink-0'>
                  <button
                    disabled
                    className='px-3 py-2 text-xs font-medium rounded-lg border transition-colors bg-white text-brand-500 border-zinc-200 hover:bg-brand-100 hover:border-zinc-200 flex items-center gap-1.5 opacity-80 cursor-not-allowed'
                  >
                    <CheckCircle2 className='w-3 h-3 text-brand-500 flex-shrink-0' />
                    Start
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
