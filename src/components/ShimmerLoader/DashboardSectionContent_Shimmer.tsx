'use client';

import Skeleton from '.';
import UserCard_Shimmer from './UserCard_Shimmer';

interface DashboardSectionContent_ShimmerProps {
  userCount?: number;
}

export default function DashboardSectionContent_Shimmer({
  userCount = 5,
}: DashboardSectionContent_ShimmerProps) {
  return (
    <div>
      {/* Header shimmer */}
      <div className='mb-6 sm:mb-8 lg:mb-10'>
        <Skeleton width={150} height={32} className='mb-1' />
        <Skeleton width={200} height={16} />
      </div>

      {/* User cards shimmer */}
      <div className='space-y-2.5 sm:space-y-3'>
        {Array.from({ length: userCount }, (_, i) => (
          <UserCard_Shimmer key={i} />
        ))}
      </div>
    </div>
  );
}
