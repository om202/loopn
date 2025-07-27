'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';

import ProtectedRoute from '../../components/protected-route';

export default function DashboardPage() {
  const { signOut, user } = useAuthenticator((context) => [
    context.signOut,
    context.user,
  ]);

  return (
    <ProtectedRoute>
      <div className='min-h-screen flex flex-col items-center justify-center'>
        <h1 className='text-4xl font-bold text-gray-900 mb-8'>
          This is dashboard
        </h1>
        <p className='text-gray-600 mb-8'>
          Welcome, {user?.signInDetails?.loginId}!
        </p>
        <button
          onClick={signOut}
          className='bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition-colors'
        >
          Sign Out
        </button>
      </div>
    </ProtectedRoute>
  );
} 