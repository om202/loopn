'use client';

import Navbar from '../../components/Navbar';
import OnlineUsers from '../../components/OnlineUsers';
import ProtectedRoute from '../../components/protected-route';

export default function DashboardPage() {
  const handleChatRequestSent = () => {
    console.info('Chat request sent');
  };

  return (
    <ProtectedRoute requireOnboarding={true}>
      <div className='h-screen sm:bg-zinc-100 flex flex-col overflow-hidden'>
        <Navbar />

        {/* Main Content Area */}
        <div className='flex-1 w-full px-1 sm:px-3 lg:px-6 py-1 sm:py-3 lg:py-4 min-h-0 space-y-2 sm:space-y-4'>
          {/* Online Users */}
          <OnlineUsers onChatRequestSent={handleChatRequestSent} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
