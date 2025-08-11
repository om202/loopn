'use client';

import Skeleton from '.';

interface UserAvatar_ShimmerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  className?: string;
}

export default function UserAvatar_Shimmer({
  size = 'md',
  showStatus = false,
  className = '',
}: UserAvatar_ShimmerProps) {
  const getAvatarSize = () => {
    switch (size) {
      case 'xs':
        return 25; // w-5 h-5
      case 'sm':
        return 35; // w-8 h-8
      case 'lg':
        return 50; // w-12 h-12
      case 'xl':
        return 65; // w-16 h-16
      default:
        return 50; // w-10 h-10
    }
  };

  const getIndicatorSizeAndPosition = () => {
    switch (size) {
      case 'xs':
        return {
          size: 'w-1.5 h-1.5',
          position: '-bottom-0 -right-0',
        };
      case 'sm':
        return {
          size: 'w-2.5 h-2.5',
          position: '-bottom-0 -right-0',
        };
      case 'lg':
        return {
          size: 'w-3.5 h-3.5',
          position: '-bottom-0 -right-0',
        };
      case 'xl':
        return {
          size: 'w-4 h-4',
          position: '-bottom-0 -right-0',
        };
      default: // md
        return {
          size: 'w-3 h-3',
          position: '-bottom-0 -right-0',
        };
    }
  };

  const avatarSize = getAvatarSize();

  return (
    <div className={`relative ${className}`}>
      <div
        className='rounded-full overflow-hidden flex-shrink-0'
        style={{
          width: `${avatarSize}px`,
          height: `${avatarSize}px`,
        }}
      >
        <Skeleton
          circle
          width={avatarSize}
          height={avatarSize}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </div>
      {showStatus && (
        <div className={`absolute ${getIndicatorSizeAndPosition().position}`}>
          <Skeleton
            circle
            width={12}
            height={12}
            className={getIndicatorSizeAndPosition().size}
          />
        </div>
      )}
    </div>
  );
}
