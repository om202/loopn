'use client';

import React, { useState } from 'react';
import { X, Bug, Lightbulb } from 'lucide-react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import DialogContainer from './DialogContainer';
import { BugReportService } from '../services/bug-report.service';

interface BugReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type SubmissionType = 'bug' | 'suggestion';

export default function BugReportDialog({
  isOpen,
  onClose,
}: BugReportDialogProps) {
  const { user } = useAuthenticator();
  const [type, setType] = useState<SubmissionType>('bug');
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
      description.trim(),
      type
    );

    if (result.success) {
      setTitle('');
      setDescription('');
      setIsSubmitting(false);
      onClose();
      alert(
        `${type === 'bug' ? 'Bug report' : 'Suggestion'} submitted successfully!`
      );
    } else {
      setIsSubmitting(false);
      alert(
        `Failed to submit ${type === 'bug' ? 'bug report' : 'suggestion'}. Please try again.`
      );
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setType('bug');
      setTitle('');
      setDescription('');
      onClose();
    }
  };

  return (
    <DialogContainer isOpen={isOpen} onClose={handleClose} maxWidth='md'>
      {/* Header */}
      <div className='flex items-center justify-between px-6 py-4 border-b border-slate-100'>
        <div className='flex items-center gap-3'>
          <div>
            {type === 'bug' ? (
              <Bug className='w-7 h-7 text-brand-600' />
            ) : (
              <Lightbulb className='w-7 h-7 text-brand-600' />
            )}
          </div>
          <div>
            <h2 className='text-lg font-semibold text-black'>
              {type === 'bug' ? 'Report a Bug' : 'Share a Suggestion'}
            </h2>
            <p className='text-sm text-slate-500'>Help us improve Loopn</p>
          </div>
        </div>
        <button
          onClick={() => !isSubmitting && handleClose()}
          className={`p-2 hover:bg-slate-50 rounded-lg transition-colors ${
            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <X className='w-5 h-5 text-slate-500' />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className='px-6 py-5 space-y-5'>
        {/* Type Selector */}
        <div>
          <label className='block text-sm font-medium text-black mb-3'>
            What would you like to share?
          </label>
          <div className='grid grid-cols-2 gap-3'>
            <button
              type='button'
              onClick={() => !isSubmitting && setType('bug')}
              className={`p-3 rounded-lg border transition-colors text-left ${
                type === 'bug'
                  ? 'border-brand-200 bg-brand-50 text-brand-600'
                  : 'border-slate-200 hover:bg-slate-50 text-black'
              } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className='flex items-center gap-2 mb-1'>
                <Bug
                  className={`w-4 h-4 ${type === 'bug' ? 'text-brand-600' : 'text-slate-500'}`}
                />
                <span
                  className={`font-medium text-sm ${type === 'bug' ? 'text-brand-600' : 'text-black'}`}
                >
                  Bug Report
                </span>
              </div>
              <p
                className={`text-sm ${type === 'bug' ? 'text-brand-600' : 'text-slate-500'}`}
              >
                Something isn't working
              </p>
            </button>

            <button
              type='button'
              onClick={() => !isSubmitting && setType('suggestion')}
              className={`p-3 rounded-lg border transition-colors text-left ${
                type === 'suggestion'
                  ? 'border-brand-200 bg-brand-50 text-brand-600'
                  : 'border-slate-200 hover:bg-slate-50 text-black'
              } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className='flex items-center gap-2 mb-1'>
                <Lightbulb
                  className={`w-4 h-4 ${type === 'suggestion' ? 'text-brand-600' : 'text-slate-500'}`}
                />
                <span
                  className={`font-medium text-sm ${type === 'suggestion' ? 'text-brand-600' : 'text-black'}`}
                >
                  Suggestion
                </span>
              </div>
              <p
                className={`text-sm ${type === 'suggestion' ? 'text-brand-600' : 'text-slate-500'}`}
              >
                Idea for improvement
              </p>
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor='submission-title'
            className='block text-sm font-medium text-black mb-2'
          >
            {type === 'bug' ? "What's the issue?" : "What's your idea?"}
          </label>
          <input
            id='submission-title'
            type='text'
            value={title}
            onChange={e => !isSubmitting && setTitle(e.target.value)}
            placeholder={
              type === 'bug'
                ? 'Brief description of the bug'
                : 'Brief description of your suggestion'
            }
            className={`w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-brand-200 focus:border-brand-300 outline-none transition-colors bg-white hover:border-slate-300 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            required
          />
        </div>

        <div>
          <label
            htmlFor='submission-description'
            className='block text-sm font-medium text-black mb-2'
          >
            Tell us more
          </label>
          <textarea
            id='submission-description'
            value={description}
            onChange={e => !isSubmitting && setDescription(e.target.value)}
            placeholder={
              type === 'bug'
                ? 'Please write detailed steps to reproduce, what you expected to happen, what actually happened...'
                : 'Describe your suggestion in detail. How would this improve the user experience?'
            }
            rows={4}
            className={`w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-brand-200 focus:border-brand-300 outline-none transition-colors resize-none bg-white hover:border-slate-300 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            required
          />
        </div>

        {/* Actions */}
        <div className='flex gap-3 pt-3'>
          <button
            type='button'
            onClick={() => !isSubmitting && handleClose()}
            className={`flex-1 px-4 py-2.5 text-black bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Cancel
          </button>
          <button
            type='submit'
            className='flex-1 px-4 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors flex items-center justify-center gap-2 font-medium'
          >
            {isSubmitting ? (
              <>
                <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                Submitting...
              </>
            ) : (
              <>Submit {type === 'bug' ? 'Report' : 'Suggestion'}</>
            )}
          </button>
        </div>
      </form>
    </DialogContainer>
  );
}
