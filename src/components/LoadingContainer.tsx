'use client';

interface LoadingContainerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingContainer({
  className = '',
  size = 'md',
}: LoadingContainerProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-6 h-6 border-[3px]';
      case 'lg':
        return 'w-12 h-12 border-[5px]';
      default:
        return 'w-10 h-10 border-[3px]';
    }
  };

  return (
    <div
      className={`flex items-start justify-center w-full h-full pt-20 ${className}`}
    >
      <div
        className={`${getSizeClasses()} border-gray-200 border-t-blue-500 rounded-full animate-spin`}
      />
    </div>
  );
}
