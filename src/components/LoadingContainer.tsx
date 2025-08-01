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
        return 'w-6 h-6 border-2';
      case 'lg':
        return 'w-10 h-10 border-4';
      default:
        return 'w-8 h-8 border-2';
    }
  };

  return (
    <div
      className={`flex items-center justify-center w-full h-full ${className}`}
    >
      <div
        className={`${getSizeClasses()} border-gray-200 border-t-blue-500 rounded-full animate-spin`}
      />
    </div>
  );
}
