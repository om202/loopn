'use client';

import React, { useEffect, useState } from 'react';
import { useRealtime, useRealtimeStats } from '@/contexts/RealtimeContext';

// Simple test component to verify our realtime setup works
export default function RealtimeTest() {
  const { subscribeToMessages, getStats } = useRealtime();
  const [stats, setStats] = useState<any>(null);
  const [messageCount, setMessageCount] = useState(0);

  // Test subscription to a dummy conversation
  useEffect(() => {
    const testConversationId = 'test-conversation-123';

    const unsubscribe = subscribeToMessages(testConversationId, data => {
      console.log('🔥 RealtimeTest: Received message data:', data);
      setMessageCount(prev => prev + 1);
    });

    return unsubscribe;
  }, [subscribeToMessages]);

  // Update stats every 2 seconds
  useEffect(() => {
    const updateStats = () => {
      setStats(getStats());
    };

    updateStats(); // Initial update
    const interval = setInterval(updateStats, 2000);

    return () => clearInterval(interval);
  }, [getStats]);

  return (
    <div className='fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg max-w-sm'>
      <h3 className='text-lg font-bold mb-2'>🔥 Realtime Test</h3>

      <div className='space-y-2'>
        <div>
          <strong>Messages Received:</strong> {messageCount}
        </div>

        {stats && (
          <div>
            <strong>Active Subscriptions:</strong> {stats.activeSubscriptions}
            <br />
            <strong>Total Callbacks:</strong> {stats.totalCallbacks}
            <br />
            <strong>Connection:</strong> {stats.connectionStatus}
          </div>
        )}

        {stats?.subscriptionKeys.length > 0 && (
          <div>
            <strong>Active Keys:</strong>
            <ul className='text-xs'>
              {stats.subscriptionKeys.map((key: string) => (
                <li key={key}>• {key}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
