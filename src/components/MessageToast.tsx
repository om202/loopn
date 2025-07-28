'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface MessageToastProps {
  isVisible: boolean;
  senderEmail?: string;
  message: string;
  conversationId: string;
  onClose: () => void;
}

export default function MessageToast({
  isVisible,
  senderEmail,
  message,
  conversationId,
  onClose,
}: MessageToastProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for animation to complete
  };

  const handleOpenChat = () => {
    router.push(`/chat/${conversationId}`);
    handleClose();
  };

  if (!isVisible) return null;

  return (
    <div className='fixed top-4 right-4 z-50'>
      <div
        className={`bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm w-full transform transition-all duration-300 ${
          isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
        {/* Header */}
        <div className='flex items-center justify-between mb-2'>
          <div className='flex items-center gap-2'>
            <div className='w-2 h-2 bg-green-500 rounded-full'></div>
            <span className='text-sm font-medium text-gray-900'>New Message</span>
          </div>
          <button
            onClick={handleClose}
            className='text-gray-400 hover:text-gray-600'
          >
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        </div>

        {/* Sender */}
        <div className='text-sm text-gray-600 mb-1'>
          From: {senderEmail || 'Unknown User'}
        </div>

        {/* Message Preview */}
        <div className='text-sm text-gray-900 mb-3 line-clamp-2'>
          {message.length > 50 ? `${message.substring(0, 50)}...` : message}
        </div>

        {/* Action Buttons */}
        <div className='flex gap-2'>
          <button
            onClick={handleOpenChat}
            className='flex-1 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors'
          >
            Open Chat
          </button>
          <button
            onClick={handleClose}
            className='px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors'
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
} 