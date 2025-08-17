'use client';

import DialogContainer from './DialogContainer';

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
}: DeleteConfirmationDialogProps) {
  return (
    <DialogContainer isOpen={isOpen} onClose={onCancel} maxWidth='xs'>
      {/* Dialog content */}
      <div className='p-4'>
        {/* Title */}
        <h3 className='text-base font-medium text-zinc-900 text-center mb-4'>
          Delete message for everyone?
        </h3>

        {/* Action buttons */}
        <div className='flex gap-2'>
          <button
            onClick={onCancel}
            className='flex-1 px-3 py-2 text-sm font-medium text-zinc-900 bg-zinc-100 rounded-lg hover:bg-zinc-100 focus:outline-none transition-colors'
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className='flex-1 px-3 py-2 text-sm font-medium text-b_red-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 focus:outline-none transition-colors'
          >
            Delete
          </button>
        </div>
      </div>
    </DialogContainer>
  );
}
