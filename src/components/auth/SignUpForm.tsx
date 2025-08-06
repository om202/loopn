'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, User, Check, X } from 'lucide-react';

interface SignUpFormProps {
  onSwitchToSignIn: () => void;
  onSignUpSuccess: (email: string) => void;
}

// Password requirement component
function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div
      className={`flex items-center gap-2 text-xs ${met ? 'text-green-600' : 'text-slate-500'}`}
    >
      {met ? (
        <Check className='w-3 h-3 text-green-600' />
      ) : (
        <X className='w-3 h-3 text-slate-400' />
      )}
      <span>{text}</span>
    </div>
  );
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

  // Password validation state
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Real-time password validation
  const passwordValidation = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);
  const showPasswordHints = passwordFocused && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!email || !password) {
      return;
    }

    if (!isPasswordValid) {
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
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-colors bg-white ${
                password.length > 0
                  ? isPasswordValid
                    ? 'border-green-200 focus:ring-green-500'
                    : 'border-red-200 focus:ring-red-500'
                  : 'border-slate-200 focus:ring-blue-500'
              }`}
              placeholder='Create a password'
              required
            />
          </div>

          {/* Real-time password validation */}
          {showPasswordHints && (
            <div className='mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200'>
              <p className='text-sm font-medium text-slate-700 mb-2'>
                Password requirements:
              </p>
              <div className='space-y-1'>
                <PasswordRequirement
                  met={passwordValidation.minLength}
                  text='At least 8 characters'
                />
                <PasswordRequirement
                  met={passwordValidation.hasUppercase}
                  text='One uppercase letter'
                />
                <PasswordRequirement
                  met={passwordValidation.hasLowercase}
                  text='One lowercase letter'
                />
                <PasswordRequirement
                  met={passwordValidation.hasNumber}
                  text='One number'
                />
                <PasswordRequirement
                  met={passwordValidation.hasSymbol}
                  text='One special character'
                />
              </div>
            </div>
          )}
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
            !isPasswordValid ||
            password !== confirmPassword
          }
          className='w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium'
        >
          {isLoading ? 'Creating account...' : 'Create Account'}
        </button>

        <div className='text-center pt-2 border-t border-slate-100'>
          <span className='text-sm text-slate-600'>
            Already have an account?{' '}
          </span>
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
