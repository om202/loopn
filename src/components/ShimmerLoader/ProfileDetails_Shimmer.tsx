'use client';

import Skeleton from '.';

export default function ProfileDetails_Shimmer() {
  return (
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
            <Skeleton key={i} width={60} height={24} className='rounded-md' />
          ))}
        </div>
      </div>
    </div>
  );
}
