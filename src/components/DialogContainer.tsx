'use client';

import { useEffect, ReactNode, ReactElement } from 'react';
import { createPortal } from 'react-dom';

interface DialogContainerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg';
}

export default function DialogContainer({
  isOpen,
  onClose,
  children,
  maxWidth = 'xs',
}: DialogContainerProps): ReactElement | null {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  const dialogContent = (
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      {/* Background overlay */}
      <div
        className='fixed inset-0 bg-white/50 transition-opacity'
        onClick={onClose}
      />

      {/* Dialog container */}
      <div className='flex min-h-full items-center justify-center p-4'>
        <div
          className={`relative w-full ${maxWidthClasses[maxWidth]} transform overflow-hidden rounded-xl bg-white border border-zinc-200 shadow-lg transition-all`}
        >
          {children}
        </div>
      </div>
    </div>
  );

  // Render dialog as a portal to avoid any parent container overflow issues
  return typeof window !== 'undefined'
    ? (createPortal(dialogContent, document.body) as ReactElement)
    : null;
}
