'use client';

import Navbar from '../../components/Navbar';
import OnlineUsers from '../../components/OnlineUsers';
import ProtectedRoute from '../../components/protected-route';
import RealtimeTest from '../../components/RealtimeTest';

export default function DashboardPage() {
  const handleChatRequestSent = () => {
    console.warn('Chat request sent');
  };

  return (
    <ProtectedRoute>
      <div className='min-h-screen bg-gray-50'>
        <Navbar />

        {/* Main Content Area */}
        <div className='w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4'>
          <OnlineUsers onChatRequestSent={handleChatRequestSent} />
        </div>

        {/* Test Component - Remove after testing */}
        <RealtimeTest />
      </div>
    </ProtectedRoute>
  );
}
