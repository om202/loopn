'use client';

import DialogContainer from './DialogContainer';

interface RemoveConnectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  userName?: string;
}

export default function RemoveConnectionDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  userName,
}: RemoveConnectionDialogProps) {
  return (
    <DialogContainer isOpen={isOpen} onClose={onClose} maxWidth='xs'>
      <div className='p-4'>
        <h3 className='text-lg font-medium text-black text-center mb-3'>
          Remove connection?
        </h3>
        <p className='text-sm text-black text-center mb-4'>
          This will permanently remove your connection with{' '}
          {userName ? userName : 'this user'}. You won&apos;t be able to message
          each other anymore, and the chat will be closed.
        </p>
        <div className='flex gap-2'>
          <button
            onClick={onClose}
            disabled={isLoading}
            className='flex-1 px-3 py-2 text-base font-medium text-black bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className='flex-1 px-3 py-2 text-base font-medium text-red-600 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isLoading ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>
    </DialogContainer>
  );
}
