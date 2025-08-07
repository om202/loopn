'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, Shield } from 'lucide-react';

interface ResetPasswordFormProps {
  email: string;
  onResetSuccess: () => void;
  onSwitchToSignIn: () => void;
}

export default function ResetPasswordForm({
  email,
  onResetSuccess,
  onSwitchToSignIn,
}: ResetPasswordFormProps) {
  const [confirmationCode, setConfirmationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const {
    handleConfirmResetPassword,
    handleResetPassword,
    isLoading,
    error,
    clearError,
  } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!confirmationCode || !newPassword) {
      return;
    }

    if (newPassword !== confirmPassword) {
      return;
    }

    await handleConfirmResetPassword(email, confirmationCode, newPassword);

    // If successful, go to sign in
    if (!error) {
      onResetSuccess();
    }
  };

  const handleResendCode = async () => {
    clearError();
    await handleResetPassword(email);
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
            className='block text-sm font-medium text-slate-900 mb-3'
          >
            Verification code
          </label>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
              <Shield className='h-5 w-5 text-slate-500' />
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
          <div className='flex justify-between items-center mt-2'>
            <p className='text-xs text-slate-500'>
              Code sent to <span className='font-medium'>{email}</span>
            </p>
            <button
              type='button'
              onClick={handleResendCode}
              disabled={isLoading}
              className='text-xs text-brand-500 hover:text-brand-700 font-medium transition-colors disabled:opacity-50'
            >
              Resend code
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor='newPassword'
            className='block text-sm font-medium text-slate-900 mb-3'
          >
            New password
          </label>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
              <Lock className='h-5 w-5 text-slate-500' />
            </div>
            <input
              id='newPassword'
              type='password'
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className='w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors bg-white'
              placeholder='Enter new password'
              required
            />
          </div>
          <p className='text-xs text-slate-500 mt-2'>
            Must be at least 8 characters with uppercase, lowercase, numbers,
            and symbols
          </p>
        </div>

        <div>
          <label
            htmlFor='confirmPassword'
            className='block text-sm font-medium text-slate-900 mb-3'
          >
            Confirm new password
          </label>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
              <Lock className='h-5 w-5 text-slate-500' />
            </div>
            <input
              id='confirmPassword'
              type='password'
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-colors bg-white ${
                confirmPassword && newPassword !== confirmPassword
                  ? 'border-b_red-200 focus:ring-b_red-500'
                  : 'border-slate-200 focus:ring-brand-500'
              }`}
              placeholder='Confirm new password'
              required
            />
          </div>
          {confirmPassword && newPassword !== confirmPassword && (
            <p className='text-xs text-b_red-500 mt-2'>Passwords do not match</p>
          )}
        </div>

        <button
          type='submit'
          disabled={
            isLoading ||
            !confirmationCode ||
            !newPassword ||
            !confirmPassword ||
            newPassword !== confirmPassword
          }
          className='w-full bg-brand-500 text-white py-3 px-4 rounded-xl hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium'
        >
          {isLoading ? 'Resetting password...' : 'Reset Password'}
        </button>

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
