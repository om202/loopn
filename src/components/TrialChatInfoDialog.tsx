'use client';

import DialogContainer from './DialogContainer';

interface TrialChatInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onEndChat?: () => void;
}

export default function TrialChatInfoDialog({
  isOpen,
  onClose,
  onEndChat,
}: TrialChatInfoDialogProps) {
  return (
    <DialogContainer isOpen={isOpen} onClose={onClose} maxWidth='md'>
      {/* Dialog content */}
      <div className='p-6'>
        {/* Title */}
        <h3 className='text-lg font-medium text-neutral-950 mb-6'>Trial Chat</h3>

        {/* Content */}
        <div className='text-sm text-neutral-950 space-y-4 leading-relaxed'>
          <p>
            You have 7 days to chat and get to know each other. Either person
            can send a connection request to continue chatting after the trial
            period.
          </p>

          <p>
            If no connection is made, the chat expires after 7 days and all
            messages are deleted.
          </p>

          <p className='text-neutral-500'>
            Send a connection request if you want to keep chatting beyond the
            trial period.
          </p>
        </div>

        {/* Action buttons */}
        <div className='mt-6 space-y-3'>
          {onEndChat && (
            <button
              onClick={() => {
                onEndChat();
                onClose();
              }}
              className='w-full px-4 py-2 text-sm font-medium text-b_red-600 bg-white border border-b_red-600 rounded-lg hover:bg-b_red-50 focus:outline-none transition-colors'
            >
              End Chat Now
            </button>
          )}
          <button
            onClick={onClose}
            className='w-full px-4 py-2 text-sm font-medium text-brand-500 bg-white border border-brand-500 rounded-lg hover:bg-brand-50 focus:outline-none transition-colors'
          >
            Got it
          </button>
        </div>
      </div>
    </DialogContainer>
  );
}
