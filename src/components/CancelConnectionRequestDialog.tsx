'use client';

import DialogContainer from './DialogContainer';

interface CancelConnectionRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function CancelConnectionRequestDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: CancelConnectionRequestDialogProps) {
  return (
    <DialogContainer isOpen={isOpen} onClose={onClose} maxWidth='sm'>
      <div className='p-4'>
        <h3 className='text-lg font-medium text-black text-center mb-3'>
          Cancel Connection Request?
        </h3>
        <p className='text-sm text-black text-center mb-4'>
          This will cancel your pending connection request. You can send a new
          request later if you change your mind.
        </p>
        <div className='flex gap-2'>
          <button
            onClick={onClose}
            disabled={isLoading}
            className='flex-1 px-3 py-2 text-base font-medium text-black bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Keep Request
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className='flex-1 px-3 py-2 text-base font-medium text-b_red-600 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isLoading ? 'Canceling...' : 'Cancel Request'}
          </button>
        </div>
      </div>
    </DialogContainer>
  );
}
