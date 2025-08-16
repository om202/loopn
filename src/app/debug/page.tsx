'use client';

import { useEffect, useState } from 'react';
import { useOnlineUsers } from '../../hooks/useOnlineUsers';
import { useSubscriptionStore } from '../../stores/subscription-store';
import ProtectedRoute from '../../components/protected-route';
import { ZustandDemo } from '../../components/ZustandDemo';
import {
  Activity,
  Database,
  Users,
  Zap,
  Clock,
  CheckCircle,
} from 'lucide-react';

/**
 * Debug Dashboard - Shows Zustand state management improvements
 * This demonstrates the benefits of centralized subscriptions
 */
export default function DebugPage() {
  const { onlineUsers, isLoading, error } = useOnlineUsers({ enabled: true });
  const {
    getStats,
    userProfiles,
    incomingChatRequests,
    sentChatRequests,
    notifications,
    conversations,
  } = useSubscriptionStore();
  const [startTime] = useState(Date.now());
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const stats = getStats();
  const uptime = Math.floor((currentTime - startTime) / 1000);

  return (
    <ProtectedRoute requireOnboarding={true}>
      <div className='min-h-screen bg-white p-4'>
        <div className='max-w-4xl mx-auto space-y-4'>
          {/* Header */}
          <div className='border rounded-lg p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-xl font-medium text-gray-900 flex items-center gap-2'>
                  <Database className='w-5 h-5 text-gray-600' />
                  Debug Dashboard
                </h1>
                <p className='text-gray-500 text-base mt-1'>
                  State management monitoring
                </p>
              </div>
              <div className='text-right'>
                <div className='text-base text-gray-500'>Uptime</div>
                <div className='text-lg font-mono text-gray-700'>
                  {Math.floor(uptime / 60)}:
                  {(uptime % 60).toString().padStart(2, '0')}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
            {/* Active Subscriptions */}
            <div className='border rounded-lg p-3'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-base text-gray-500'>Subscriptions</p>
                  <p className='text-lg font-medium text-gray-900'>
                    {stats.activeSubscriptions}
                  </p>
                </div>
                <Activity className='w-4 h-4 text-gray-400' />
              </div>
            </div>

            {/* Total Callbacks */}
            <div className='border rounded-lg p-3'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-base text-gray-500'>Callbacks</p>
                  <p className='text-lg font-medium text-gray-900'>
                    {stats.totalCallbacks}
                  </p>
                </div>
                <Zap className='w-4 h-4 text-gray-400' />
              </div>
            </div>

            {/* Online Users */}
            <div className='border rounded-lg p-3'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-base text-gray-500'>Online</p>
                  <p className='text-lg font-medium text-gray-900'>
                    {isLoading ? '...' : onlineUsers.length}
                  </p>
                </div>
                <Users className='w-4 h-4 text-gray-400' />
              </div>
            </div>

            {/* Cached Profiles */}
            <div className='border rounded-lg p-3'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-base text-gray-500'>Cached</p>
                  <p className='text-lg font-medium text-gray-900'>
                    {userProfiles.size}
                  </p>
                </div>
                <Clock className='w-4 h-4 text-gray-400' />
              </div>
            </div>
          </div>

          {/* Detailed Analytics */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            {/* Subscription Details */}
            <div className='border rounded-lg p-4'>
              <h3 className='text-base font-medium text-gray-900 mb-3 flex items-center gap-2'>
                <Database className='w-4 h-4 text-gray-600' />
                Subscription Analytics
              </h3>

              <div className='space-y-3'>
                <div>
                  <label className='text-base font-medium text-gray-600'>
                    Active Subscription Keys
                  </label>
                  <div className='mt-1 p-2 border rounded text-base font-mono text-gray-700'>
                    {stats.subscriptionKeys.length > 0 ? (
                      <ul className='space-y-1'>
                        {stats.subscriptionKeys.map(key => (
                          <li key={key} className='flex items-center gap-2'>
                            <CheckCircle className='w-3 h-3 text-gray-500' />
                            <span>{key}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className='text-gray-500'>
                        No active subscriptions
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className='text-base font-medium text-gray-600'>
                    Subscription Efficiency
                  </label>
                  <div className='mt-1 p-2 border rounded text-base'>
                    <div className='text-gray-700'>
                      <strong>Before:</strong> {stats.totalCallbacks} separate
                      subscriptions
                    </div>
                    <div className='text-gray-700 mt-1'>
                      <strong>After:</strong> {stats.activeSubscriptions} shared
                      subscription
                      {stats.activeSubscriptions !== 1 ? 's' : ''}
                    </div>
                    <div className='text-gray-600 mt-1'>
                      {stats.totalCallbacks > stats.activeSubscriptions
                        ? `${Math.round(((stats.totalCallbacks - stats.activeSubscriptions) / stats.totalCallbacks) * 100)}% reduction in subscriptions`
                        : 'Optimal efficiency achieved'}
                    </div>
                  </div>
                </div>

                <div>
                  <label className='text-base font-medium text-gray-600'>
                    Profile Cache Efficiency
                  </label>
                  <div className='mt-1 p-2 border rounded text-base'>
                    <div className='text-gray-700'>
                      <strong>Cached Profiles:</strong> {userProfiles.size}{' '}
                      users
                    </div>
                    <div className='text-gray-700 mt-1'>
                      <strong>API Calls Saved:</strong> Eliminates duplicate
                      getUserProfile calls
                    </div>
                    <div className='text-gray-600 mt-1'>
                      {userProfiles.size > 0
                        ? `${userProfiles.size} profiles cached - no duplicate API calls when switching sections`
                        : 'Profiles will be cached as you browse users'}
                    </div>
                  </div>
                </div>

                <div>
                  <label className='text-base font-medium text-gray-600'>
                    Chat Request Subscriptions
                  </label>
                  <div className='mt-1 p-2 border rounded text-base'>
                    <div className='text-gray-700'>
                      <strong>Incoming:</strong> {incomingChatRequests.length}{' '}
                      pending
                    </div>
                    <div className='text-gray-700 mt-1'>
                      <strong>Sent:</strong> {sentChatRequests.length} pending
                    </div>
                    <div className='text-gray-600 mt-1'>
                      Single subscription shared across: ChatRequests,
                      Notifications, OnlineUsers, DashboardSidebar
                    </div>
                  </div>
                </div>

                <div>
                  <label className='text-base font-medium text-gray-600'>
                    Presence Optimization
                  </label>
                  <div className='mt-1 p-2 border rounded text-base'>
                    <div className='text-gray-700'>
                      <strong>Global Presence:</strong> Single subscription for
                      all users
                    </div>
                    <div className='text-gray-700 mt-1'>
                      <strong>Individual Presence:</strong> Eliminated (uses
                      global data)
                    </div>
                    <div className='text-gray-600 mt-1'>
                      ChatWindow now uses centralized presence data instead of
                      individual subscriptions
                    </div>
                  </div>
                </div>

                <div>
                  <label className='text-base font-medium text-gray-600'>
                    Notification Optimization
                  </label>
                  <div className='mt-1 p-2 border rounded text-base'>
                    <div className='text-gray-700'>
                      <strong>Before:</strong> NotificationsContent +
                      DashboardSidebar = 2 subscriptions
                    </div>
                    <div className='text-gray-700 mt-1'>
                      <strong>After:</strong> Single shared notification
                      subscription
                    </div>
                    <div className='text-gray-600 mt-1'>
                      {notifications.length} notifications cached, count
                      auto-calculated
                    </div>
                  </div>
                </div>

                <div>
                  <label className='text-base font-medium text-gray-600'>
                    Conversation Optimization
                  </label>
                  <div className='mt-1 p-2 border rounded text-base'>
                    <div className='text-gray-700'>
                      <strong>Before:</strong> OnlineUsers + chat/[chatId] = 2
                      separate subscriptions
                    </div>
                    <div className='text-gray-700 mt-1'>
                      <strong>After:</strong> Single shared conversation
                      subscription
                    </div>
                    <div className='text-gray-600 mt-1'>
                      {conversations.size} conversations cached, real-time
                      updates shared
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Online Users Details */}
            <div className='border rounded-lg p-4'>
              <h3 className='text-base font-medium text-gray-900 mb-3 flex items-center gap-2'>
                <Users className='w-4 h-4 text-gray-600' />
                Online Users Data
              </h3>

              {error && (
                <div className='mb-3 p-2 border border-gray-300 rounded text-base'>
                  <p className='text-gray-700'>Error: {error}</p>
                </div>
              )}

              <div className='space-y-2'>
                {isLoading ? (
                  <div className='text-center py-4'>
                    <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto'></div>
                    <p className='text-base text-gray-500 mt-2'>
                      Loading online users...
                    </p>
                  </div>
                ) : onlineUsers.length > 0 ? (
                  <div className='space-y-2'>
                    {onlineUsers.map(user => (
                      <div
                        key={user.userId}
                        className='p-2 border rounded text-base'
                      >
                        <div className='flex items-center justify-between'>
                          <div>
                            <p className='font-medium text-gray-900'>
                              User {user.userId.slice(-4)}
                            </p>
                            <p className='text-gray-500'>
                              Status: {user.status} • Online:{' '}
                              {user.isOnline ? 'Yes' : 'No'}
                            </p>
                          </div>
                          <div className='text-right'>
                            <div
                              className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-gray-600' : 'bg-gray-300'}`}
                            ></div>
                            <p className='text-gray-500 mt-1'>
                              {user.lastSeen
                                ? new Date(user.lastSeen).toLocaleTimeString()
                                : 'Never'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-center py-4 text-gray-500'>
                    <Users className='w-8 h-8 mx-auto text-gray-300 mb-2' />
                    <p className='text-base'>No users online</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Original Demo Component */}
          <div className='border rounded-lg p-4'>
            <h3 className='text-base font-medium text-gray-900 mb-3'>
              Original Demo Component
            </h3>
            <ZustandDemo />
          </div>

          {/* Benefits Section */}
          <div className='border rounded-lg p-4'>
            <h3 className='text-base font-medium text-gray-900 mb-3'>
              Zustand Benefits Achieved
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <h4 className='text-base font-medium text-gray-700'>
                  Performance Improvements
                </h4>
                <ul className='text-base text-gray-600 space-y-1'>
                  <li>• Eliminated duplicate GraphQL subscriptions</li>
                  <li>• Reference counting prevents memory leaks</li>
                  <li>• Centralized state reduces re-renders</li>
                  <li>• Automatic cleanup on component unmount</li>
                </ul>
              </div>
              <div className='space-y-2'>
                <h4 className='text-base font-medium text-gray-700'>
                  Developer Experience
                </h4>
                <ul className='text-base text-gray-600 space-y-1'>
                  <li>• Single source of truth for all data</li>
                  <li>• Easy debugging with centralized logs</li>
                  <li>• Consistent state across components</li>
                  <li>• Simplified subscription management</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
