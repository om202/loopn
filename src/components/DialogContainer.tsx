'use client';

import { useEffect, useState, ReactNode, ReactElement } from 'react';
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
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Handle dialog visibility transitions
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to ensure DOM is ready for transition
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      // Wait for transition to complete before removing from DOM
      const timer = setTimeout(() => setShouldRender(false), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

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

  if (!shouldRender) return null;

  const maxWidthClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  const dialogContent = (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto transition-opacity duration-100 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Background overlay */}
      <div
        className={`fixed inset-0 bg-gray-950/16 transition-opacity duration-100 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Dialog container */}
      <div className='flex min-h-full items-center justify-center p-4'>
        <div
          className={`relative w-full ${maxWidthClasses[maxWidth]} transform overflow-hidden rounded-xl bg-white border border-gray-200 shadow-lg transition-all duration-100 ${
            isVisible
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-95 translate-y-4'
          }`}
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
