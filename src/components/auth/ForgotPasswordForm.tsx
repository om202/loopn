'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, ArrowLeft } from 'lucide-react';

interface ForgotPasswordFormProps {
  onSwitchToSignIn: () => void;
  onResetCodeSent: (email: string) => void;
}

export default function ForgotPasswordForm({
  onSwitchToSignIn,
  onResetCodeSent,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const { handleResetPassword, isLoading, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!email) {
      return;
    }

    await handleResetPassword(email);

    // If successful, switch to confirmation view
    if (!error) {
      onResetCodeSent(email);
    }
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
            htmlFor='email'
            className='block text-sm font-medium text-slate-900 mb-3'
          >
            Email address
          </label>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
              <Mail className='h-5 w-5 text-slate-500' />
            </div>
            <input
              id='email'
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              className='w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors bg-white'
              placeholder='Enter your email'
              required
            />
          </div>
        </div>

        <button
          type='submit'
          disabled={isLoading || !email}
          className='w-full bg-brand-500 text-white py-3 px-4 rounded-xl hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium'
        >
          {isLoading ? 'Sending reset code...' : 'Send Reset Code'}
        </button>

        <div className='text-center pt-2 border-t border-slate-200'>
          <button
            type='button'
            onClick={onSwitchToSignIn}
            className='text-sm text-brand-500 hover:text-brand-700 font-medium transition-colors flex items-center justify-center gap-2 mx-auto'
          >
            <ArrowLeft className='w-4 h-4' />
            Back to sign in
          </button>
        </div>
      </form>
    </div>
  );
}
