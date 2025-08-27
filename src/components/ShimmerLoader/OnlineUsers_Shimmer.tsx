'use client';

import Skeleton from '.';
import DashboardSidebar_Shimmer from './DashboardSidebar_Shimmer';
import DashboardSectionContent_Shimmer from './DashboardSectionContent_Shimmer';
import SearchUser_Shimmer from './SearchUser_Shimmer';
import UserAvatar_Shimmer from './UserAvatar_Shimmer';

interface OnlineUsers_ShimmerProps {
  userCount?: number;
}

export default function OnlineUsers_Shimmer({
  userCount = 5,
}: OnlineUsers_ShimmerProps) {
  return (
    <div className='flex lg:gap-4 h-full pb-20 lg:pb-0'>
      {/* Sidebar shimmer */}
      <DashboardSidebar_Shimmer />

      {/* Main content shimmer */}
      <div className='flex-1 bg-white sm:rounded-2xl sm:border sm:border-slate-200 py-4 px-6 sm:py-4 sm:px-6 lg:py-4 lg:px-6 ultra-compact overflow-hidden flex flex-col min-h-0'>
        {/* Search User shimmer - Always visible at top */}
        <div className='flex-shrink-0 mb-4 sm:mb-6'>
          <SearchUser_Shimmer />
        </div>

        {/* Content area shimmer */}
        <div className='overflow-y-auto flex-1'>
          <DashboardSectionContent_Shimmer userCount={userCount} />
        </div>
      </div>

      {/* Right push sidebar shimmer - desktop only */}
      <div className='hidden md:flex w-[400px] xl:w-[420px] flex-shrink-0'>
        <div className='bg-white rounded-2xl border border-slate-200 w-full h-full flex flex-col'>
          {/* Profile header shimmer */}
          <div className='p-6 pb-4 flex justify-center'>
            <div className='flex flex-col items-center text-center'>
              <UserAvatar_Shimmer size='xl' showStatus className='mb-4' />
              <Skeleton width={150} height={20} className='mb-1' />
              <Skeleton width={100} height={16} />
            </div>
          </div>

          {/* Action button shimmer */}
          <div className='px-6 pb-6'>
            <Skeleton height={44} className='rounded-xl' />
          </div>

          {/* Profile details shimmer */}
          <div className='flex-1 overflow-y-auto px-6 pb-8'>
            <div className='space-y-4'>
              {/* Section headers and content */}
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i}>
                  <Skeleton width={120} height={16} className='mb-3' />
                  <div className='space-y-2'>
                    <Skeleton width='100%' height={14} />
                    <Skeleton width='80%' height={14} />
                    <Skeleton width='60%' height={14} />
                  </div>
                </div>
              ))}

              {/* Skills/Interests tags shimmer */}
              <div>
                <Skeleton width={140} height={16} className='mb-3' />
                <div className='flex flex-wrap gap-2'>
                  {Array.from({ length: 6 }, (_, i) => (
                    <Skeleton
                      key={i}
                      width={60}
                      height={24}
                      className='rounded-md'
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
