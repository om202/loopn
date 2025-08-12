'use client';

import {
  MessageCircle,
  CheckCircle2,
  Users,
  Sparkles,
  Search,
  Bell,
} from 'lucide-react';
import Image from 'next/image';
import React from 'react';

export default function DashboardDemo() {
  return (
    <div className='bg-white rounded-2xl shadow-2xl border border-zinc-200 max-w-7xl mx-auto overflow-hidden'>
      {/* Dashboard Layout - Desktop and Tablet */}
      <div className='hidden md:flex h-[650px]'>
        {/* Left Sidebar */}
        <div className='w-80 bg-white border-r border-zinc-200 flex flex-col'>
          {/* User Profile Section */}
          <div className='p-6 border-b border-zinc-200'>
            <div className='flex items-center gap-3'>
              <div className='relative'>
                <Image
                  src='/dummy-user5.jpg'
                  alt='Your Profile'
                  width={48}
                  height={48}
                  className='w-12 h-12 rounded-full object-cover'
                />
                <div className='absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-b_green-400 border-2 border-white rounded-full'></div>
              </div>
              <div className='flex-1 min-w-0'>
                <h3 className='text-sm font-semibold text-zinc-900 truncate'>
                  Jordan Blake
                </h3>
                <p className='text-sm text-zinc-600 truncate'>
                  Blockchain Developer
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className='flex-1 p-4 space-y-2'>
            {/* Suggested Matches - Active */}
            <div className='flex items-center gap-3 px-4 py-3 bg-brand-50 text-brand-700 rounded-xl font-medium'>
              <Sparkles className='w-5 h-5' />
              <span className='flex-1'>Suggested Matches</span>
              <span className='bg-brand-100 text-brand-700 text-sm px-2 py-1 rounded-full font-semibold'>
                12
              </span>
            </div>

            {/* All Connections */}
            <div className='flex items-center gap-3 px-4 py-3 text-zinc-600 hover:bg-zinc-50 rounded-xl font-medium transition-colors cursor-pointer'>
              <Users className='w-5 h-5' />
              <span className='flex-1'>All Connections</span>
              <span className='bg-zinc-100 text-zinc-600 text-sm px-2 py-1 rounded-full font-semibold'>
                8
              </span>
            </div>

            {/* Messages */}
            <div className='flex items-center gap-3 px-4 py-3 text-zinc-600 hover:bg-zinc-50 rounded-xl font-medium transition-colors cursor-pointer'>
              <MessageCircle className='w-5 h-5' />
              <span className='flex-1'>Messages</span>
              <span className='bg-zinc-100 text-zinc-600 text-sm px-2 py-1 rounded-full font-semibold'>
                3
              </span>
            </div>

            {/* Notifications */}
            <div className='flex items-center gap-3 px-4 py-3 text-zinc-600 hover:bg-zinc-50 rounded-xl font-medium transition-colors cursor-pointer'>
              <Bell className='w-5 h-5' />
              <span className='flex-1'>Notifications</span>
              <span className='bg-red-100 text-red-600 text-sm px-2 py-1 rounded-full font-semibold'>
                2
              </span>
            </div>

            {/* Search */}
            <div className='flex items-center gap-3 px-4 py-3 text-zinc-600 hover:bg-zinc-50 rounded-xl font-medium transition-colors cursor-pointer'>
              <Search className='w-5 h-5' />
              <span className='flex-1'>Search</span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className='flex-1 bg-zinc-50 p-6'>
          {/* Header */}
          <div className='mb-6'>
            <h2 className='text-xl font-bold text-zinc-900 mb-1'>
              Smart Matches for You
            </h2>
            <p className='text-sm text-zinc-600'>
              AI-curated professionals based on your interests and goals
            </p>
          </div>

          {/* User Cards Grid - Using Real UserCard Style */}
          <div className='space-y-3 overflow-y-auto max-h-[500px]'>
            {/* User Card 1 - Zara Thompson */}
            <div className='rounded-2xl border px-3 py-3 group transition-all duration-200 cursor-pointer bg-white border-zinc-200 hover:bg-zinc-50 opacity-0 animate-[slideUpFade_0.6s_ease-out_0.5s_forwards]'>
              <div className='flex items-center gap-3'>
                <div className='flex-shrink-0'>
                  <div className='relative'>
                    <Image
                      src='/dummy-user6.jpg'
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
                    <div className='text-zinc-900 truncate no-email-detection font-medium'>
                      Zara Thompson
                    </div>
                  </div>
                  <div className='text-sm mb-1.5 text-zinc-600'>
                    AI Researcher • Computer Vision, Robotics
                  </div>
                </div>

                <div className='flex-shrink-0 flex items-center gap-1.5'>
                  <button
                    disabled
                    className='px-2.5 py-2 text-sm font-medium rounded-xl border transition-colors bg-white text-brand-500 border-zinc-200 hover:bg-brand-100 hover:border-zinc-200 flex items-center gap-1.5 flex-shrink-0 min-w-[44px] justify-center opacity-80 cursor-not-allowed'
                  >
                    <MessageCircle className='w-4 h-4 text-brand-500 flex-shrink-0' />
                    <span className='hidden min-[400px]:inline'>Chat Now</span>
                  </button>
                </div>
              </div>
            </div>

            {/* User Card 2 - Kai Anderson */}
            <div className='rounded-2xl border px-3 py-3 group transition-all duration-200 cursor-pointer bg-white border-zinc-200 hover:bg-zinc-50 opacity-0 animate-[slideUpFade_0.6s_ease-out_1s_forwards]'>
              <div className='flex items-center gap-3'>
                <div className='flex-shrink-0'>
                  <div className='relative'>
                    <Image
                      src='/dummy-user7.jpg'
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
                    <div className='text-zinc-900 truncate no-email-detection font-medium'>
                      Kai Anderson
                    </div>
                  </div>
                  <div className='text-sm mb-1.5 text-zinc-600'>
                    Quantum Computing Engineer • Algorithms, Hardware
                  </div>
                </div>

                <div className='flex-shrink-0 flex items-center gap-1.5'>
                  <button
                    disabled
                    className='px-2.5 py-2 text-sm font-medium rounded-xl border transition-colors bg-white text-brand-500 border-zinc-200 hover:bg-brand-100 hover:border-zinc-200 flex items-center gap-1.5 flex-shrink-0 min-w-[44px] justify-center opacity-80 cursor-not-allowed'
                  >
                    <CheckCircle2 className='w-4 h-4 text-brand-500 flex-shrink-0' />
                    <span className='hidden min-[400px]:inline'>
                      Start Trial
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* User Card 3 - Ganesh Thapa */}
            <div className='rounded-2xl border px-3 py-3 group transition-all duration-200 cursor-pointer bg-white border-zinc-200 hover:bg-zinc-50 opacity-0 animate-[slideUpFade_0.6s_ease-out_1.5s_forwards]'>
              <div className='flex items-center gap-3'>
                <div className='flex-shrink-0'>
                  <div className='relative'>
                    <Image
                      src='/dummy-user8.jpg'
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
                    <div className='text-zinc-900 truncate no-email-detection font-medium'>
                      Ganesh Thapa
                    </div>
                  </div>
                  <div className='text-sm mb-1.5 text-zinc-600'>
                    Space Systems Engineer • Satellites, Mission Planning
                  </div>
                </div>

                <div className='flex-shrink-0 flex items-center gap-1.5'>
                  <button
                    disabled
                    className='px-2.5 py-2 text-sm font-medium rounded-xl border transition-colors bg-white text-brand-500 border-zinc-200 hover:bg-brand-100 hover:border-zinc-200 flex items-center gap-1.5 flex-shrink-0 min-w-[44px] justify-center opacity-80 cursor-not-allowed'
                  >
                    <MessageCircle className='w-4 h-4 text-brand-500 flex-shrink-0' />
                    <span className='hidden min-[400px]:inline'>Chat Now</span>
                  </button>
                </div>
              </div>
            </div>

            {/* User Card 4 - Haoyu Lee */}
            <div className='rounded-2xl border px-3 py-3 group transition-all duration-200 cursor-pointer bg-white border-zinc-200 hover:bg-zinc-50 opacity-0 animate-[slideUpFade_0.6s_ease-out_2s_forwards]'>
              <div className='flex items-center gap-3'>
                <div className='flex-shrink-0'>
                  <div className='relative'>
                    <Image
                      src='/dummy-usr9.jpg'
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
                    <div className='text-zinc-900 truncate no-email-detection font-medium'>
                      Haoyu Lee
                    </div>
                  </div>
                  <div className='text-sm mb-1.5 text-zinc-600'>
                    Biotech Engineer • Gene Therapy, Lab Automation
                  </div>
                </div>

                <div className='flex-shrink-0 flex items-center gap-1.5'>
                  <button
                    disabled
                    className='px-2.5 py-2 text-sm font-medium rounded-xl border transition-colors bg-white text-brand-500 border-zinc-200 hover:bg-brand-100 hover:border-zinc-200 flex items-center gap-1.5 flex-shrink-0 min-w-[44px] justify-center opacity-80 cursor-not-allowed'
                  >
                    <CheckCircle2 className='w-4 h-4 text-brand-500 flex-shrink-0' />
                    <span className='hidden min-[400px]:inline'>
                      Start Trial
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* User Card 5 - Alex Chen */}
            <div className='rounded-2xl border px-3 py-3 group transition-all duration-200 cursor-pointer bg-white border-zinc-200 hover:bg-zinc-50 opacity-0 animate-[slideUpFade_0.6s_ease-out_2.5s_forwards]'>
              <div className='flex items-center gap-3'>
                <div className='flex-shrink-0'>
                  <div className='relative'>
                    <Image
                      src='/dummy-user2.jpg'
                      alt='Alex Chen'
                      width={48}
                      height={48}
                      className='w-12 h-12 rounded-full object-cover border border-brand-500'
                    />
                    <div className='absolute -bottom-0 -right-0 w-3 h-3 bg-b_green-500 rounded-full border-2 border-white box-content'></div>
                  </div>
                </div>

                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 mb-1'>
                    <div className='text-zinc-900 truncate no-email-detection font-medium'>
                      Alex Chen
                    </div>
                    <div className='w-2 h-2 bg-b_green-500 rounded-full animate-pulse'></div>
                  </div>
                  <div className='text-sm mb-1.5 text-zinc-600'>
                    Full-Stack Developer • React, Node.js, Cloud Architecture
                  </div>
                </div>

                <div className='flex-shrink-0 flex items-center gap-1.5'>
                  <button
                    disabled
                    className='px-2.5 py-2 text-sm font-medium rounded-xl border transition-colors bg-white text-brand-500 border-zinc-200 hover:bg-brand-100 hover:border-zinc-200 flex items-center gap-1.5 flex-shrink-0 min-w-[44px] justify-center opacity-80 cursor-not-allowed'
                  >
                    <MessageCircle className='w-4 h-4 text-brand-500 flex-shrink-0' />
                    <span className='hidden min-[400px]:inline'>Chat Now</span>
                  </button>
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
                  src='/dummy-user5.jpg'
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
            <div className='flex items-center gap-2'>
              <div className='relative'>
                <Bell className='w-5 h-5 text-zinc-600' />
                <div className='absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center'>
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
            <div className='absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center'>
              <span className='text-white text-xs font-bold'>2</span>
            </div>
          </div>
          <div className='flex-1 px-3 py-3 text-center text-sm font-medium text-zinc-600'>
            Messages
          </div>
        </div>

        {/* Mobile Content */}
        <div className='p-4 bg-zinc-50 min-h-[600px]'>
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
                      src='/dummy-user6.jpg'
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
                      src='/dummy-user7.jpg'
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
                      src='/dummy-user8.jpg'
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
                    <CheckCircle2 className='w-3 h-3 text-brand-500 flex-shrink-0' />
                    Start
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
                      src='/dummy-usr9.jpg'
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
