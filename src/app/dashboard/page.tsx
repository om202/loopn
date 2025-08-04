'use client';

import Navbar from '../../components/Navbar';
import OnlineUsers from '../../components/OnlineUsers';
import ProtectedRoute from '../../components/protected-route';

export default function DashboardPage() {
  const handleChatRequestSent = () => {
    console.info('Chat request sent');
  };

  return (
    <ProtectedRoute>
      <div className='min-h-screen bg-gray-50'>
        <Navbar />

        {/* Main Content Area */}
        <div className='w-full px-2 sm:px-3 lg:px-6 py-2 sm:py-3 lg:py-4'>
          <OnlineUsers onChatRequestSent={handleChatRequestSent} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
