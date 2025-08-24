'use client';

interface CircularIconProps {
  icon: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  bgColor?: string;
  className?: string;
}

export default function CircularIcon({
  icon,
  size = 'md',
  bgColor = 'bg-slate-100',
  className = '',
}: CircularIconProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-6 h-6';
      case 'lg':
        return 'w-10 h-10';
      default:
        return 'w-8 h-8';
    }
  };

  const getIconSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-3 h-3';
      case 'lg':
        return 'w-5 h-5';
      default:
        return 'w-4 h-4';
    }
  };

  return (
    <div
      className={`${getSizeClasses()} ${bgColor} rounded-full flex items-center justify-center ${className}`}
    >
      <div
        className={`${getIconSizeClasses()} flex items-center justify-center`}
      >
        {icon}
      </div>
    </div>
  );
}
