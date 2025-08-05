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
      <div className='text-center mb-6'>
        <div className='w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4'>
          <Mail className='w-8 h-8 text-blue-600' />
        </div>
        <h2 className='text-xl lg:text-2xl font-bold text-slate-900 mb-2'>
          Reset your password
        </h2>
        <p className='text-slate-600 text-sm lg:text-base'>
          Enter your email and we'll send you a reset code
        </p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-5'>
        {error && (
          <div className='p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl'>
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor='email'
            className='block text-sm font-medium text-slate-700 mb-3'
          >
            Email address
          </label>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
              <Mail className='h-5 w-5 text-slate-400' />
            </div>
            <input
              id='email'
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              className='w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white'
              placeholder='Enter your email'
              required
            />
          </div>
        </div>

        <button
          type='submit'
          disabled={isLoading || !email}
          className='w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium'
        >
          {isLoading ? 'Sending reset code...' : 'Send Reset Code'}
        </button>

        <div className='text-center pt-2 border-t border-slate-100'>
          <button
            type='button'
            onClick={onSwitchToSignIn}
            className='text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors flex items-center justify-center gap-2 mx-auto'
          >
            <ArrowLeft className='w-4 h-4' />
            Back to sign in
          </button>
        </div>
      </form>
    </div>
  );
}