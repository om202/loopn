'use client';

import Avatar from 'boring-avatars';

interface UserAvatarProps {
  email?: string | null;
  userId?: string;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  status?: string | null;
  className?: string;
  variant?: 'marble' | 'beam' | 'pixel' | 'sunset' | 'ring' | 'bauhaus';
  colors?: string[];
}

export default function UserAvatar({
  email,
  userId,
  size = 'md',
  showStatus = false,
  status,
  className = '',
  variant = 'beam',
  colors = ['#92A1C6', '#146A7C', '#F0AB3D', '#C271B4', '#C20D90'],
}: UserAvatarProps) {
  const getUserIdentifier = () => {
    return email || userId || 'anonymous-user';
  };

  const getAvatarColors = () => {
    // Use gray and light colors for anonymous users
    if (!email && !userId) {
      return ['#E5E7EB', '#D1D5DB', '#9CA3AF', '#6B7280', '#F3F4F6'];
    }
    // Use default colorful palette for actual users
    return colors;
  };

  const getAvatarSize = () => {
    switch (size) {
      case 'sm':
        return 32; // w-8 h-8
      case 'lg':
        return 48; // w-12 h-12
      default:
        return 40; // w-10 h-10
    }
  };

  const getIndicatorSizeAndPosition = () => {
    switch (size) {
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
      default: // md
        return {
          size: 'w-3 h-3',
          position: '-bottom-0 -right-0',
        };
    }
  };

  const getStatusIndicator = () => {
    if (!showStatus) {
      return null;
    }

    const { size: indicatorSize } = getIndicatorSizeAndPosition();

    switch (status) {
      case 'ONLINE':
        return (
          <div
            className={`${indicatorSize} bg-green-500 rounded-full border-2 border-white box-content`}
          />
        );
      case 'BUSY':
        return (
          <div
            className={`${indicatorSize} bg-red-500 rounded-full border-2 border-white box-content`}
          />
        );
      case 'RECENTLY_ACTIVE':
        return (
          <div
            className={`${indicatorSize} bg-blue-500 rounded-full border-2 border-white box-content`}
          />
        );
      case 'OFFLINE':
        return (
          <div
            className={`${indicatorSize} bg-gray-400 rounded-full border-2 border-white box-content`}
          />
        );
      default:
        return (
          <div
            className={`${indicatorSize} bg-gray-400 rounded-full border-2 border-white box-content`}
          />
        );
    }
  };

  return (
    <div className={`relative ${className} cursor-pointer`}>
      <div className='rounded-full overflow-hidden border border-blue-600'>
        <Avatar
          size={getAvatarSize()}
          name={getUserIdentifier()}
          variant={variant}
          colors={getAvatarColors()}
        />
      </div>
      {showStatus === true && (
        <div className={`absolute ${getIndicatorSizeAndPosition().position}`}>
          {getStatusIndicator()}
        </div>
      )}
    </div>
  );
}
