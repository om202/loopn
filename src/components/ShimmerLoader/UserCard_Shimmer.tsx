'use client';

import Skeleton from '.';
import UserAvatar_Shimmer from './UserAvatar_Shimmer';

export default function UserCard_Shimmer() {
  return (
    <div className='rounded-2xl border bg-white border-slate-200 px-3 py-3'>
      <div className='flex items-center gap-3'>
        {/* Avatar shimmer */}
        <div className='flex-shrink-0'>
          <UserAvatar_Shimmer size='md' showStatus />
        </div>

        {/* Content shimmer */}
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2 mb-1'>
            <Skeleton width={120} height={16} />
            {/* Trial indicator placeholder */}
            <Skeleton width={50} height={20} />
          </div>
          <div className='mb-1.5'>
            <Skeleton width={80} height={14} />
          </div>
        </div>

        {/* Action buttons shimmer */}
        <div className='flex-shrink-0 flex items-center gap-1.5'>
          <Skeleton width={100} height={36} />
          {/* Profile button */}
          <div className='md:hidden'>
            <Skeleton width={44} height={36} />
          </div>
          {/* Desktop three dots */}
          <div className='hidden md:block'>
            <Skeleton circle width={40} height={40} />
          </div>
        </div>
      </div>
    </div>
  );
}
