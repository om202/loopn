'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Shield } from 'lucide-react';

interface ConfirmSignUpFormProps {
  email: string;
  onConfirmSuccess: () => void;
  onSwitchToSignIn: () => void;
}

export default function ConfirmSignUpForm({
  email,
  onConfirmSuccess,
  onSwitchToSignIn,
}: ConfirmSignUpFormProps) {
  const [confirmationCode, setConfirmationCode] = useState('');
  const {
    handleConfirmSignUp,
    handleResendSignUpCode,
    isLoading,
    error,
    clearError,
  } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!confirmationCode) {
      return;
    }

    await handleConfirmSignUp(email, confirmationCode);

    // If successful, go to sign in
    if (!error) {
      onConfirmSuccess();
    }
  };

  const handleResendCode = async () => {
    clearError();
    await handleResendSignUpCode(email);
  };

  return (
    <div className='w-full'>
      <form onSubmit={handleSubmit} className='space-y-5'>
        {error && (
          <div className='p-4 text-sm text-b_red-500 bg-b_red-100 border border-b_red-200 rounded-xl'>
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor='confirmationCode'
            className='block text-sm font-medium text-neutral-950 mb-3'
          >
            Verification code
          </label>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
              <Shield className='h-5 w-5 text-neutral-500' />
            </div>
            <input
              id='confirmationCode'
              type='text'
              value={confirmationCode}
              onChange={e => setConfirmationCode(e.target.value)}
              className='w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors bg-white text-center text-lg tracking-widest'
              placeholder='000000'
              maxLength={6}
              required
            />
          </div>
          <p className='text-sm text-neutral-500 mt-2 text-center'>
            Enter the 6-digit code from your email
          </p>
        </div>

        <button
          type='submit'
          disabled={isLoading || !confirmationCode}
          className='w-full bg-brand-500 text-white py-3 px-4 rounded-xl hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium'
        >
          {isLoading ? 'Verifying...' : 'Verify Email'}
        </button>

        <div className='text-center'>
          <span className='text-sm text-neutral-950'>
            Didn't receive the code?{' '}
          </span>
          <button
            type='button'
            onClick={handleResendCode}
            disabled={isLoading}
            className='text-sm text-brand-500 hover:text-brand-700 font-medium transition-colors disabled:opacity-50'
          >
            Resend
          </button>
        </div>

        <div className='text-center pt-2 border-t border-slate-200'>
          <button
            type='button'
            onClick={onSwitchToSignIn}
            className='text-sm text-brand-500 hover:text-brand-700 font-medium transition-colors'
          >
            Back to sign in
          </button>
        </div>
      </form>
    </div>
  );
}
