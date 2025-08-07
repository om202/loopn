'use client';

interface LoadingContainerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spin' | 'pulse' | 'dots';
}

export default function LoadingContainer({
  className = '',
  size = 'md',
  variant = 'spin',
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

  const renderSpinner = () => {
    switch (variant) {
      case 'pulse':
        return (
          <div
            className={`${getSizeClasses().replace('border-[3px]', '').replace('border-[5px]', '')} bg-brand-500 rounded-full animate-pulse`}
          />
        );
      case 'dots':
        const dotSize =
          size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3';
        return (
          <div className='flex space-x-2'>
            <div
              className={`${dotSize} bg-brand-500 rounded-full animate-bounce`}
              style={{ animationDelay: '0ms' }}
            />
            <div
              className={`${dotSize} bg-brand-500 rounded-full animate-bounce`}
              style={{ animationDelay: '150ms' }}
            />
            <div
              className={`${dotSize} bg-brand-500 rounded-full animate-bounce`}
              style={{ animationDelay: '300ms' }}
            />
          </div>
        );
      default:
        return (
          <div
            className={`${getSizeClasses()} border-slate-200 border-t-blue-600 rounded-full animate-spin`}
          />
        );
    }
  };

  return (
    <div
      className={`flex items-start justify-center w-full h-full pt-20 ${className}`}
    >
      {renderSpinner()}
    </div>
  );
}
