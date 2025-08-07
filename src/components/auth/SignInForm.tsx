'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock } from 'lucide-react';

interface SignInFormProps {
  onSwitchToSignUp: () => void;
  onSwitchToForgotPassword: () => void;
}

export default function SignInForm({
  onSwitchToSignUp,
  onSwitchToForgotPassword,
}: SignInFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { handleSignIn, isLoading, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!email || !password) {
      // You can add a toast notification or error state here if needed
      console.warn('Email and password are required');
      return;
    }

    await handleSignIn(email, password);
  };

  return (
    <div className='w-full'>
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

        <div>
          <label
            htmlFor='password'
            className='block text-sm font-medium text-slate-700 mb-3'
          >
            Password
          </label>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
              <Lock className='h-5 w-5 text-slate-400' />
            </div>
            <input
              id='password'
              type='password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              className='w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white'
              placeholder='Enter your password'
              required
            />
          </div>
        </div>

        <button
          type='submit'
          disabled={isLoading}
          className='w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium'
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>

        <div className='text-center'>
          <button
            type='button'
            onClick={onSwitchToForgotPassword}
            className='text-sm text-blue-600 hover:text-blue-700 transition-colors'
          >
            Forgot your password?
          </button>
        </div>

        <div className='text-center pt-2 border-t border-slate-200'>
          <span className='text-sm text-slate-600'>
            Don't have an account?{' '}
          </span>
          <button
            type='button'
            onClick={onSwitchToSignUp}
            className='text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors'
          >
            Sign up
          </button>
        </div>
      </form>
    </div>
  );
}
