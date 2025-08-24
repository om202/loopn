'use client';

import { useOnlineUsers } from '../hooks/useOnlineUsers';
import { useSubscriptionStore } from '../stores/subscription-store';

/**
 * Demo component to show Zustand centralized state management
 * This component can be used anywhere and will share the same subscription
 */
export function ZustandDemo() {
  const { onlineUsers, isLoading, error } = useOnlineUsers({ enabled: true });
  const { getStats } = useSubscriptionStore();

  const stats = getStats();

  return (
    <div className='p-4 border rounded-lg bg-slate-50'>
      <h3 className='text-lg font-semibold mb-2'>Zustand Demo</h3>

      <div className='space-y-2 text-base'>
        <div>
          <strong>Online Users:</strong>{' '}
          {isLoading ? 'Loading...' : onlineUsers.length}
        </div>

        {error && (
          <div className='text-b_red-600'>
            <strong>Error:</strong> {error}
          </div>
        )}

        <div>
          <strong>Active Subscriptions:</strong> {stats.activeSubscriptions}
        </div>

        <div>
          <strong>Subscription Keys:</strong>{' '}
          {stats.subscriptionKeys.join(', ') || 'None'}
        </div>

        <div>
          <strong>Total Callbacks:</strong> {stats.totalCallbacks}
        </div>

        <div className='mt-3 p-2 bg-blue-50 rounded text-base'>
          <strong>Benefits:</strong>
          <ul className='list-disc list-inside mt-1'>
            <li>Single subscription shared across components</li>
            <li>Reference counting prevents duplicates</li>
            <li>Centralized state management</li>
            <li>Real-time updates everywhere</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
