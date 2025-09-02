'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);
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
      {/* Sign up prompt at the top */}
      <div className='text-center mb-6 p-4 bg-neutral-100 rounded-xl border border-neutral-200'>
        <span className='text-base text-neutral-500 mr-3 font-medium'>
          New to Loopn?
        </span>
        <button
          type='button'
          onClick={() => {
            clearError();
            onSwitchToSignUp();
          }}
          className='text-base text-brand-600 hover:text-brand-600 hover:underline hover:underline-offset-4 transition-colors'
        >
          Create an account
        </button>
      </div>

      <form onSubmit={handleSubmit} className='space-y-5'>
        {error && <div className='text-base text-b_red-500'>{error}</div>}

        <div>
          <label
            htmlFor='email'
            className='block text-sm font-medium text-black mb-3'
          >
            Email address
          </label>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
              <Mail className='h-5 w-5 text-neutral-500' />
            </div>
            <input
              id='email'
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              className='w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors bg-white'
              placeholder='Enter your email'
              required
            />
          </div>
        </div>

        <div>
          <label
            htmlFor='password'
            className='block text-sm font-medium text-black mb-3'
          >
            Password
          </label>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
              <Lock className='h-5 w-5 text-neutral-500' />
            </div>
            <input
              id='password'
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className='w-full pl-10 pr-12 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors bg-white'
              placeholder='Enter your password'
              required
            />
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-500 transition-colors'
            >
              {showPassword ? (
                <EyeOff className='h-5 w-5' />
              ) : (
                <Eye className='h-5 w-5' />
              )}
            </button>
          </div>
        </div>

        <button
          type='submit'
          disabled={isLoading}
          className='w-full bg-brand-500 text-white py-3 px-4 rounded-xl hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium'
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>

        <div className='text-center'>
          <button
            type='button'
            onClick={onSwitchToForgotPassword}
            className='text-base text-brand-600 hover:text-brand-600 hover:underline hover:underline-offset-4 transition-colors'
          >
            Forgot your password?
          </button>
        </div>
      </form>
    </div>
  );
}
