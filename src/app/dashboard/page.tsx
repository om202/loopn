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
      <div className='h-screen sm:bg-neutral-100 flex flex-col overflow-hidden'>
        {/* Main Content Area with LinkedIn-style max width */}
        <div className='flex-1 w-full flex justify-center px-0 py-0 lg:px-4 lg:py-4 min-h-0'>
          <div className='w-full mx-auto space-y-4'>
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
