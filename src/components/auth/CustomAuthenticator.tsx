'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';
import ConfirmSignUpForm from './ConfirmSignUpForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import ResetPasswordForm from './ResetPasswordForm';

type AuthView =
  | 'signIn'
  | 'signUp'
  | 'confirmSignUp'
  | 'forgotPassword'
  | 'resetPassword';

interface AuthState {
  view: AuthView;
  email?: string;
}

interface CustomAuthenticatorProps {
  initialView?: AuthView;
}

export default function CustomAuthenticator({
  initialView = 'signIn',
}: CustomAuthenticatorProps) {
  const [authState, setAuthState] = useState<AuthState>({ view: initialView });

  const AuthHeader = () => (
    <div className='text-center mb-8'>
      <Link href='/home' className='inline-block'>
        <div className='flex items-center justify-center space-x-3 mb-6 cursor-pointer hover:opacity-80 transition-opacity'>
          <Image src='/loopn.svg' alt='Loopn' width={48} height={48} priority />
          <h1 className='text-3xl font-bold text-black'>Loopn</h1>
        </div>
      </Link>
      <p className='text-black text-base'>
        {authState.view === 'signIn' && 'Please sign in to continue'}
        {authState.view === 'signUp' && 'Create your account to get started'}
        {authState.view === 'confirmSignUp' && 'Confirm your email address'}
        {authState.view === 'forgotPassword' && 'Reset your password'}
        {authState.view === 'resetPassword' && 'Enter your new password'}
      </p>
    </div>
  );

  const renderCurrentView = () => {
    switch (authState.view) {
      case 'signIn':
        return (
          <SignInForm
            onSwitchToSignUp={() => setAuthState({ view: 'signUp' })}
            onSwitchToForgotPassword={() =>
              setAuthState({ view: 'forgotPassword' })
            }
          />
        );

      case 'signUp':
        return (
          <SignUpForm
            onSwitchToSignIn={() => setAuthState({ view: 'signIn' })}
            onSignUpSuccess={email =>
              setAuthState({ view: 'confirmSignUp', email })
            }
          />
        );

      case 'confirmSignUp':
        return (
          <ConfirmSignUpForm
            email={authState.email || ''}
            onConfirmSuccess={() => setAuthState({ view: 'signIn' })}
            onSwitchToSignIn={() => setAuthState({ view: 'signIn' })}
          />
        );

      case 'forgotPassword':
        return (
          <ForgotPasswordForm
            onSwitchToSignIn={() => setAuthState({ view: 'signIn' })}
            onResetCodeSent={email =>
              setAuthState({ view: 'resetPassword', email })
            }
          />
        );

      case 'resetPassword':
        return (
          <ResetPasswordForm
            email={authState.email || ''}
            onResetSuccess={() => setAuthState({ view: 'signIn' })}
            onSwitchToSignIn={() => setAuthState({ view: 'signIn' })}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className='min-h-screen bg-slate-100 flex items-center justify-center px-4 py-8'>
      <div className='w-full max-w-md'>
        {/* Main Auth Card */}
        <div className='bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-lg'>
          <AuthHeader />
          {renderCurrentView()}
        </div>
      </div>
    </div>
  );
}
