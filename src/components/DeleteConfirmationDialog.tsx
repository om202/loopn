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
  title = 'Delete Message',
  message = 'Are you sure you want to delete this message? This action cannot be undone.',
}: DeleteConfirmationDialogProps) {
  return (
    <DialogContainer isOpen={isOpen} onClose={onCancel} maxWidth="xs">
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
    </DialogContainer>
  );
}