'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, User } from 'lucide-react';

interface SignUpFormProps {
  onSwitchToSignIn: () => void;
  onSignUpSuccess: (email: string) => void;
}

export default function SignUpForm({
  onSwitchToSignIn,
  onSignUpSuccess,
}: SignUpFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [givenName, setGivenName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const { handleSignUp, isLoading, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!email || !password) {
      return;
    }

    if (password !== confirmPassword) {
      return;
    }

    await handleSignUp(email, password, givenName, familyName);

    // If successful, go to confirmation
    if (!error) {
      onSignUpSuccess(email);
    }
  };

  return (
    <div className='w-full'>
      <div className='text-center mb-6'>
        <h2 className='text-xl lg:text-2xl font-bold text-slate-900 mb-2'>
          Create your account
        </h2>
        <p className='text-slate-600 text-sm lg:text-base'>
          Join Loopn to start connecting with others
        </p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-5'>
        {error && (
          <div className='p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl'>
            {error}
          </div>
        )}

        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label
              htmlFor='givenName'
              className='block text-sm font-medium text-slate-700 mb-3'
            >
              First name
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <User className='h-5 w-5 text-slate-400' />
              </div>
              <input
                id='givenName'
                type='text'
                value={givenName}
                onChange={e => setGivenName(e.target.value)}
                className='w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white'
                placeholder='First'
              />
            </div>
          </div>

          <div>
            <label
              htmlFor='familyName'
              className='block text-sm font-medium text-slate-700 mb-3'
            >
              Last name
            </label>
            <input
              id='familyName'
              type='text'
              value={familyName}
              onChange={e => setFamilyName(e.target.value)}
              className='w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white'
              placeholder='Last'
            />
          </div>
        </div>

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
              placeholder='Create a password'
              required
            />
          </div>
          <p className='text-xs text-slate-500 mt-2'>
            Must be at least 8 characters with uppercase, lowercase, numbers, and symbols
          </p>
        </div>

        <div>
          <label
            htmlFor='confirmPassword'
            className='block text-sm font-medium text-slate-700 mb-3'
          >
            Confirm password
          </label>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
              <Lock className='h-5 w-5 text-slate-400' />
            </div>
            <input
              id='confirmPassword'
              type='password'
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-colors bg-white ${
                confirmPassword && password !== confirmPassword
                  ? 'border-red-200 focus:ring-red-500'
                  : 'border-slate-200 focus:ring-blue-500'
              }`}
              placeholder='Confirm your password'
              required
            />
          </div>
          {confirmPassword && password !== confirmPassword && (
            <p className='text-xs text-red-500 mt-2'>Passwords do not match</p>
          )}
        </div>

        <button
          type='submit'
          disabled={
            isLoading ||
            !email ||
            !password ||
            !confirmPassword ||
            password !== confirmPassword
          }
          className='w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium'
        >
          {isLoading ? 'Creating account...' : 'Create Account'}
        </button>

        <div className='text-center pt-2 border-t border-slate-100'>
          <span className='text-sm text-slate-600'>Already have an account? </span>
          <button
            type='button'
            onClick={onSwitchToSignIn}
            className='text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors'
          >
            Sign in
          </button>
        </div>
      </form>
    </div>
  );
}