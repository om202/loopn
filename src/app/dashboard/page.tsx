'use client';

import OnlineUsers from '../../components/OnlineUsers';
import ProtectedRoute from '../../components/protected-route';
import Navbar from '../../components/Navbar';

export default function DashboardPage() {
  const handleChatRequestSent = () => {
    console.log('Chat request sent');
  };

  return (
    <ProtectedRoute>
      <div className='min-h-screen bg-gray-50'>
        {/* Navigation */}
        <Navbar />

        {/* Main Content */}
        <div className='max-w-6xl mx-auto px-6 py-8'>
          <div className='mb-8'>
            <h2 className='text-2xl font-bold text-gray-900 mb-2'>
              Professional Network
            </h2>
            <p className='text-gray-600'>
              Connect with professionals who are online and ready to network
            </p>
          </div>

          {/* OnlineUsers Component */}
          <div className='max-w-lg'>
            <OnlineUsers onChatRequestSent={handleChatRequestSent} />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
