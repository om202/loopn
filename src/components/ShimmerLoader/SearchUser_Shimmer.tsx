'use client';

import Skeleton from '.';

export default function SearchUser_Shimmer() {
  return (
    <div className='max-w-md mx-auto'>
      <Skeleton height={48} className='rounded-xl' />
    </div>
  );
}
