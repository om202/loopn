'use client';

import Skeleton from '.';
import UserAvatar_Shimmer from './UserAvatar_Shimmer';

export default function DashboardSidebar_Shimmer() {
  return (
    <div className='w-full lg:w-64 xl:w-72 flex-shrink-0'>
      <div className='bg-white sm:rounded-2xl sm:border sm:border-zinc-200 h-full flex flex-col'>
        {/* Header shimmer */}
        <div className='p-4 sm:p-6 border-b border-zinc-200'>
          <div className='flex items-center gap-3'>
            <UserAvatar_Shimmer size='lg' />
            <div className='hidden lg:block flex-1'>
              <Skeleton width={120} height={16} className='mb-1' />
              <Skeleton width={80} height={12} />
            </div>
          </div>
        </div>

        {/* Navigation shimmer */}
        <div className='flex-1 p-4 sm:p-6'>
          <nav className='space-y-2'>
            {/* Navigation items */}
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className='flex items-center gap-3 p-3'>
                <Skeleton circle height={20} width={20} />
                <div className='hidden lg:block flex-1'>
                  <Skeleton width={100} height={16} />
                </div>
                <div className='hidden lg:block'>
                  <Skeleton width={20} height={16} />
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Footer shimmer */}
        <div className='p-4 sm:p-6 border-t border-zinc-200'>
          <div className='flex items-center gap-3'>
            <UserAvatar_Shimmer size='sm' />
            <div className='hidden lg:block flex-1'>
              <Skeleton width={80} height={14} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
