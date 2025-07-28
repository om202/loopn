'use client';

import Navbar from '../../components/Navbar';
import OnlineUsers from '../../components/OnlineUsers';
import ProtectedRoute from '../../components/protected-route';

export default function DashboardPage() {
  const handleChatRequestSent = () => {
    console.log('Chat request sent');
  };

  return (
    <ProtectedRoute>
      <div className='min-h-screen bg-gray-50'>
        <Navbar />
        <div className='max-w-6xl mx-auto px-6 py-6'>
          <OnlineUsers onChatRequestSent={handleChatRequestSent} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
