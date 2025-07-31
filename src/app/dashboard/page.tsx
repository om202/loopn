'use client';

import Navbar from '../../components/Navbar';
import OnlineUsers from '../../components/OnlineUsers';
import ProtectedRoute from '../../components/protected-route';

export default function DashboardPage() {
  const handleChatRequestSent = () => {
    console.warn('Chat request sent');
  };

  return (
    <ProtectedRoute>
      <div className='min-h-screen bg-gray-50'>
        <Navbar />

        {/* Main Content Area */}
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'>
          <OnlineUsers onChatRequestSent={handleChatRequestSent} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
