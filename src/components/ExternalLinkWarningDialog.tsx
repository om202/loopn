'use client';

import React from 'react';
import { ExternalLink, X } from 'lucide-react';
import DialogContainer from './DialogContainer';

interface ExternalLinkWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  url: string;
  linkName: string;
}

export default function ExternalLinkWarningDialog({
  isOpen,
  onClose,
  onConfirm,
  url,
  linkName,
}: ExternalLinkWarningDialogProps) {
  const getDomain = (url: string) => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname;
    } catch {
      return url;
    }
  };

  return (
    <DialogContainer isOpen={isOpen} onClose={onClose} maxWidth='sm'>
      <div className='p-6'>
        {/* Header */}
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-amber-100 rounded-lg'>
              <ExternalLink className='w-5 h-5 text-amber-600' />
            </div>
            <h3 className='text-lg font-semibold text-slate-900'>
              This will open an external link
            </h3>
          </div>
          <button
            onClick={onClose}
            className='p-1 text-slate-500 hover:text-slate-700 transition-colors rounded-lg hover:bg-slate-100'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Content */}
        <div className='mb-6'>
          <div className='p-3 bg-slate-50 rounded-lg border'>
            <p className='text-sm font-medium text-slate-900 mb-1'>
              {linkName}
            </p>
            <p className='text-sm text-slate-600 break-all'>{getDomain(url)}</p>
          </div>
          <p className='text-sm text-slate-500 mt-3'>
            This will open in a new tab.
          </p>
        </div>

        {/* Actions */}
        <div className='flex gap-3'>
          <button
            onClick={onClose}
            className='flex-1 px-4 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors'
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className='flex-1 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2'
          >
            Continue
            <ExternalLink className='w-4 h-4' />
          </button>
        </div>
      </div>
    </DialogContainer>
  );
}
