'use client';

import OnlineUsers from '../../components/OnlineUsers';
import ProtectedRoute from '../../components/protected-route';

export default function DashboardPage() {
  const handleChatRequestSent = () => {
    console.info('Chat request sent');
  };

  const handleProfessionalRequest = (_request: string) => {
    // TODO: Implement AI professional matching logic
  };

  return (
    <ProtectedRoute requireOnboarding={true}>
      <div className='h-screen sm:bg-gray-100 flex flex-col overflow-hidden'>
        {/* Main Content Area with LinkedIn-style max width */}
        <div className='flex-1 w-full flex justify-center px-1 sm:px-3 lg:px-6 py-1 sm:py-3 lg:py-4 min-h-0'>
          <div className='w-full space-y-2 sm:space-y-4'>
            {/* Online Users */}
            <OnlineUsers
              onChatRequestSent={handleChatRequestSent}
              onProfessionalRequest={handleProfessionalRequest}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
