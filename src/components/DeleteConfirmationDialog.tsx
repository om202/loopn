'use client';

import { useEffect } from 'react';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
}

export default function DeleteConfirmationDialog({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Delete Message',
  message = 'Are you sure you want to delete this message? This action cannot be undone.',
}: DeleteConfirmationDialogProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
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
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Background overlay */}
      <div
        className="fixed inset-0 bg-white/30 transition-opacity"
        onClick={onCancel}
      />
      
      {/* Dialog container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-xs transform overflow-hidden rounded-xl bg-white border border-gray-200 shadow-xl transition-all">
          {/* Dialog content */}
          <div className="p-4">
            {/* Title */}
            <h3 className="text-base font-medium text-gray-900 text-center mb-4">
              Delete message for everyone?
            </h3>
            
            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}