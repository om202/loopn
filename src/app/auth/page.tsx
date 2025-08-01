'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import Image from 'next/image';

function AuthHeader() {
  return (
    <div className='text-center mb-16'>
      <div className='flex items-center justify-center space-x-3 mb-6'>
        <Image src='/loopn.svg' alt='Loopn' width={40} height={40} priority />
        <h1 className='text-2xl font-bold text-gray-900'>Loopn</h1>
      </div>
      <p className='text-gray-600'>
        Sign in to your account or create a new one
      </p>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center px-4'>
      <div className='w-full max-w-md'>
        <Authenticator
          loginMechanisms={['email']}
          components={{
            Header: AuthHeader,
          }}
        >
          {({ user }) => {
            // Redirect to dashboard if authenticated
            if (user) {
              window.location.href = '/dashboard';
            }
            return <div />;
          }}
        </Authenticator>
      </div>
    </div>
  );
}
