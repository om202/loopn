'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, Check, X, Eye, EyeOff } from 'lucide-react';

interface SignUpFormProps {
  onSwitchToSignIn: () => void;
  onSignUpSuccess: (email: string) => void;
}

// Password requirement component
function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div
      className={`flex items-center gap-2 text-sm ${met ? 'text-b_green-600' : 'text-gray-500'}`}
    >
      {met ? (
        <Check className='w-3 h-3 text-b_green-600' />
      ) : (
        <X className='w-3 h-3 text-gray-500' />
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
  const { handleSignUp, isLoading, error, clearError, authStatus } = useAuth();

  // Password validation state
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      console.warn('Email and password are required');
      return;
    }

    if (!isPasswordValid) {
      console.warn('Password does not meet requirements');
      return;
    }

    if (password !== confirmPassword) {
      console.warn('Passwords do not match');
      return;
    }

    await handleSignUp(email, password);

    // If successful and not auto-signed in, go to confirmation
    // (If user was auto-confirmed, handleSignUp will auto-sign them in)
    if (!error && authStatus !== 'authenticated') {
      onSignUpSuccess(email);
    }
    // If user is now authenticated, they were auto-confirmed and signed in
  };

  return (
    <div className='w-full'>
      {/* Sign in prompt at the top */}
      <div className='text-center mb-6 p-4 bg-gray-100 rounded-xl border border-gray-200'>
        <span className='text-sm text-gray-500 mr-3 font-medium'>
          Already have an account?
        </span>
        <button
          type='button'
          onClick={() => {
            clearError();
            onSwitchToSignIn();
          }}
          className='text-sm text-brand-600 hover:text-brand-600 transition-colors'
        >
          Sign in
        </button>
      </div>

      <form onSubmit={handleSubmit} className='space-y-5'>
        {error && (
          <div className='p-4 text-sm text-b_red-500 bg-b_red-100 border border-b_red-200 rounded-xl'>
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor='email'
            className='block text-sm font-medium text-gray-900 mb-3'
          >
            Email address
          </label>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
              <Mail className='h-5 w-5 text-gray-500' />
            </div>
            <input
              id='email'
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              className='w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors bg-white'
              placeholder='Enter your email'
              required
            />
          </div>
        </div>

        <div>
          <label
            htmlFor='password'
            className='block text-sm font-medium text-gray-900 mb-3'
          >
            Password
          </label>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
              <Lock className='h-5 w-5 text-gray-500' />
            </div>
            <input
              id='password'
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-colors bg-white ${
                password.length > 0
                  ? isPasswordValid
                    ? 'border-b_green-200 focus:ring-b_green-500'
                    : 'border-b_red-200 focus:ring-b_red-500'
                  : 'border-gray-200 focus:ring-brand-500'
              }`}
              placeholder='Create a password'
              required
            />
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-500 transition-colors'
            >
              {showPassword ? (
                <EyeOff className='h-5 w-5' />
              ) : (
                <Eye className='h-5 w-5' />
              )}
            </button>
          </div>

          {/* Real-time password validation */}
          {showPasswordHints && (
            <div className='mt-3 p-3 bg-gray-100 rounded-lg border border-gray-200'>
              <p className='text-sm font-medium text-gray-900 mb-2'>
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
            className='block text-sm font-medium text-gray-900 mb-3'
          >
            Confirm password
          </label>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
              <Lock className='h-5 w-5 text-gray-500' />
            </div>
            <input
              id='confirmPassword'
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-colors bg-white ${
                confirmPassword && password !== confirmPassword
                  ? 'border-b_red-200 focus:ring-b_red-500'
                  : 'border-gray-200 focus:ring-brand-500'
              }`}
              placeholder='Confirm your password'
              required
            />
            <button
              type='button'
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-500 transition-colors'
            >
              {showConfirmPassword ? (
                <EyeOff className='h-5 w-5' />
              ) : (
                <Eye className='h-5 w-5' />
              )}
            </button>
          </div>
          {confirmPassword && password !== confirmPassword && (
            <p className='text-sm text-b_red-500 mt-2'>
              Passwords do not match
            </p>
          )}
        </div>

        <button
          type='submit'
          disabled={isLoading}
          className='w-full bg-brand-500 text-white py-3 px-4 rounded-xl hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium'
        >
          {isLoading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}
