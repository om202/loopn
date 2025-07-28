'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';

import OnlineUsers from '../../components/OnlineUsers';
import ProtectedRoute from '../../components/protected-route';

export default function DashboardPage() {
  const { signOut, user } = useAuthenticator(context => [
    context.signOut,
    context.user,
  ]);

  const handleChatRequestSent = () => {
    console.warn('Chat request sent');
  };

  return (
    <ProtectedRoute>
      <div className='min-h-screen bg-gray-50 p-4'>
        <div className='max-w-7xl mx-auto'>
          {/* Header */}
          <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>
                  Welcome to Loopn
                </h1>
                <p className='text-gray-600 mt-1'>
                  Connect with professionals • {user?.signInDetails?.loginId}
                </p>
              </div>
              <button
                onClick={signOut}
                className='bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors'
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* OnlineUsers Component */}
          <div className='max-w-md mx-auto'>
            <OnlineUsers onChatRequestSent={handleChatRequestSent} />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
