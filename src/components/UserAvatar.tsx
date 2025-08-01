'use client';

interface UserAvatarProps {
  email?: string | null;
  userId?: string;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  status?: string | null;
  className?: string;
}

export default function UserAvatar({
  email,
  userId,
  size = 'md',
  showStatus = false,
  status,
  className = '',
}: UserAvatarProps) {
  const getInitial = () => {
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    if (userId) {
      return userId.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8 text-sm';
      case 'lg':
        return 'w-12 h-12 text-lg';
      default:
        return 'w-10 h-10 text-sm';
    }
  };

  const getIndicatorSizeAndPosition = () => {
    switch (size) {
      case 'sm':
        return {
          size: 'w-2.5 h-2.5',
          position: '-top-0 -right-0',
        };
      case 'lg':
        return {
          size: 'w-3 h-3',
          position: '-top-0 -right-0',
        };
      default: // md
        return {
          size: 'w-2.5 h-2.5',
          position: '-top-0 -right-0',
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
      case 'OFFLINE':
        return (
          <div
            className={`${indicatorSize} bg-gray-400 rounded-full border-2 border-white box-content`}
          />
        );
      default:
        return (
          <div
            className={`${indicatorSize} bg-yellow-500 rounded-full border-2 border-white box-content`}
          />
        );
    }
  };

  return (
    <div className={`relative ${className} cursor-pointer`}>
      <div
        className={`${getSizeClasses()} bg-blue-600 rounded-full flex items-center justify-center text-white font-medium`}
      >
        {getInitial()}
      </div>
      {showStatus === true && (
        <div className={`absolute ${getIndicatorSizeAndPosition().position}`}>
          {getStatusIndicator()}
        </div>
      )}
    </div>
  );
}
