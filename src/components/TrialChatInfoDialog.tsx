'use client';

import DialogContainer from './DialogContainer';

interface TrialChatInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TrialChatInfoDialog({
  isOpen,
  onClose,
}: TrialChatInfoDialogProps) {
  return (
    <DialogContainer isOpen={isOpen} onClose={onClose} maxWidth='md'>
      {/* Dialog content */}
      <div className='p-6'>
        {/* Title */}
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>
          Trial Chat Period
        </h3>

        {/* Content */}
        <div className='text-sm text-gray-600 space-y-3'>
          <p>
            <strong>What is a Trial Chat?</strong>
            <br />
            When someone accepts your chat request, you start with a 7-day trial
            period to get to know each other.
          </p>

          <p>
            <strong>During the trial period:</strong>
            <br />
            • You can chat freely for 7 days
            <br />
            • Either person can send a &ldquo;Connection Request&rdquo;
            <br />
            • If accepted, you can chat forever
            <br />• You can end the chat early using &ldquo;End Now&rdquo;
          </p>

          <p>
            <strong>After 7 days:</strong>
            <br />
            • If not connected, the chat expires automatically
            <br />
            • All messages and conversation data are deleted
            <br />• You&rsquo;ll need to send a new chat request to reconnect
          </p>

          <p className='text-blue-600'>
            💡 <strong>Tip:</strong> Send a connection request if you&rsquo;d
            like to chat beyond the trial period!
          </p>
        </div>

        {/* Close button */}
        <div className='mt-6'>
          <button
            onClick={onClose}
            className='w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none transition-colors'
          >
            Got it
          </button>
        </div>
      </div>
    </DialogContainer>
  );
}
