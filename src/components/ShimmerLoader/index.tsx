'use client';

import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface ShimmerProviderProps {
  children: React.ReactNode;
}

// Base shimmer theme provider
export function ShimmerProvider({ children }: ShimmerProviderProps) {
  return (
    <SkeletonTheme baseColor='#f1f5f9' highlightColor='#e2e8f0'>
      {children}
    </SkeletonTheme>
  );
}

export { Skeleton };
export default Skeleton;
