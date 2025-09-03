'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Shield } from 'lucide-react';
import { useAnalytics } from '../../hooks/useAnalytics';

interface ConfirmSignUpFormProps {
  email: string;
  password?: string;
  onConfirmSuccess: () => void;
  onSwitchToSignIn: () => void;
}

export default function ConfirmSignUpForm({
  email,
  password,
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
  const analytics = useAnalytics();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!confirmationCode) {
      return;
    }

    const success = await handleConfirmSignUp(
      email,
      confirmationCode,
      password
    );

    // If successful and password was provided, user will be auto-logged in
    // If no password or confirmation without auto-login, redirect to sign in
    if (success) {
      // Track signup completion
      analytics.trackSignupCompleted();

      // Only call onConfirmSuccess if we don't have password for auto-login
      // (This handles edge cases where password might not be available)
      if (!password) {
        onConfirmSuccess();
      }
      // If password was provided, the user is now automatically logged in
      // and will be redirected by the auth flow
    }
  };

  const handleResendCode = async () => {
    clearError();
    await handleResendSignUpCode(email);
  };

  return (
    <div className='w-full'>
      <form onSubmit={handleSubmit} className='space-y-5'>
        {error && <div className='text-base text-b_red-500'>{error}</div>}

        <div>
          <label
            htmlFor='confirmationCode'
            className='block text-sm font-medium text-neutral-900 mb-3'
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
              className='w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors bg-white text-center text-lg tracking-widest'
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
          <span className='text-base text-neutral-900'>
            Didn't receive the code?{' '}
          </span>
          <button
            type='button'
            onClick={handleResendCode}
            disabled={isLoading}
            className='text-base text-brand-600 hover:text-brand-600 hover:underline hover:underline-offset-4 hover:decoration-2 font-medium transition-colors disabled:opacity-50'
          >
            Resend
          </button>
        </div>

        <div className='text-center pt-2 border-t border-neutral-200'>
          <button
            type='button'
            onClick={onSwitchToSignIn}
            className='text-base text-brand-600 hover:text-brand-600 hover:underline hover:underline-offset-4 hover:decoration-2 font-medium transition-colors'
          >
            Back to sign in
          </button>
        </div>
      </form>
    </div>
  );
}
