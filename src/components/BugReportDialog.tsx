'use client';

import React, { useState } from 'react';
import { X, Bug, Send } from 'lucide-react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import DialogContainer from './DialogContainer';
import { BugReportService } from '../services/bug-report.service';

interface BugReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BugReportDialog({ isOpen, onClose }: BugReportDialogProps) {
  const { user } = useAuthenticator();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !user) return;

    setIsSubmitting(true);
    
    const result = await BugReportService.submitBugReport(
      user.userId,
      title.trim(),
      description.trim()
    );

    if (result.success) {
      setTitle('');
      setDescription('');
      setIsSubmitting(false);
      onClose();
      alert('Bug report submitted successfully!');
    } else {
      setIsSubmitting(false);
      alert('Failed to submit bug report. Please try again.');
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setTitle('');
      setDescription('');
      onClose();
    }
  };

  return (
    <DialogContainer isOpen={isOpen} onClose={handleClose} maxWidth='md'>
      {/* Header */}
      <div className='flex items-center justify-between p-6 border-b border-zinc-200'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center'>
            <Bug className='w-5 h-5 text-brand-600' />
          </div>
          <div>
            <h2 className='text-lg font-semibold text-zinc-900'>Report a Bug</h2>
            <p className='text-sm text-zinc-500'>Help us improve Loopn</p>
          </div>
        </div>
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          className='p-2 hover:bg-zinc-100 rounded-lg transition-colors disabled:opacity-50'
        >
          <X className='w-5 h-5 text-zinc-500' />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className='p-6 space-y-4'>
        <div>
          <label htmlFor='bug-title' className='block text-sm font-medium text-zinc-900 mb-2'>
            What's the issue?
          </label>
          <input
            id='bug-title'
            type='text'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='Brief description of the bug'
            className='w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors'
            disabled={isSubmitting}
            required
          />
        </div>

        <div>
          <label htmlFor='bug-description' className='block text-sm font-medium text-zinc-900 mb-2'>
            Tell us more
          </label>
          <textarea
            id='bug-description'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder='Steps to reproduce, what you expected to happen, what actually happened...'
            rows={4}
            className='w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors resize-none'
            disabled={isSubmitting}
            required
          />
        </div>

        {/* Actions */}
        <div className='flex gap-3 pt-2'>
          <button
            type='button'
            onClick={handleClose}
            disabled={isSubmitting}
            className='flex-1 px-4 py-2 text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50'
          >
            Cancel
          </button>
          <button
            type='submit'
            disabled={isSubmitting || !title.trim() || !description.trim()}
            className='flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
          >
            {isSubmitting ? (
              <>
                <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                Submitting...
              </>
            ) : (
              <>
                <Send className='w-4 h-4' />
                Submit Report
              </>
            )}
          </button>
        </div>
      </form>
    </DialogContainer>
  );
}
