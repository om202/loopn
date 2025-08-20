'use client';

import DialogContainer from './DialogContainer';

interface TrialEndedByOtherDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TrialEndedByOtherDialog({
  isOpen,
  onClose,
}: TrialEndedByOtherDialogProps) {
  return (
    <DialogContainer isOpen={isOpen} onClose={onClose} maxWidth='md'>
      {/* Dialog content */}
      <div className='p-6'>
        {/* Title */}
        <h3 className='text-lg font-medium text-slate-950 mb-6'>
          Chat Trial Ended
        </h3>

        {/* Content */}
        <div className='text-sm text-slate-950 space-y-4 leading-relaxed'>
          <p>
            The chat trial has been ended by the other user. You can no longer
            send messages in this conversation.
          </p>
        </div>

        {/* Action button */}
        <div className='mt-6'>
          <button
            onClick={onClose}
            className='w-full px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-500 focus:outline-none transition-colors'
          >
            OK
          </button>
        </div>
      </div>
    </DialogContainer>
  );
}
