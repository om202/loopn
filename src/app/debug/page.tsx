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
  MessageCircle,
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
      <div className='min-h-screen bg-gray-50 p-4'>
        <div className='max-w-7xl mx-auto space-y-6'>
          {/* Header */}
          <div className='bg-white rounded-lg shadow-sm border p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-3xl font-bold text-gray-900 flex items-center gap-3'>
                  <Database className='w-8 h-8 text-blue-600' />
                  Zustand Debug Dashboard
                </h1>
                <p className='text-gray-600 mt-2'>
                  Real-time monitoring of centralized state management
                </p>
              </div>
              <div className='text-right'>
                <div className='text-sm text-gray-500'>Uptime</div>
                <div className='text-2xl font-mono font-bold text-green-600'>
                  {Math.floor(uptime / 60)}:
                  {(uptime % 60).toString().padStart(2, '0')}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {/* Active Subscriptions */}
            <div className='bg-white rounded-lg shadow-sm border p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>
                    Active Subscriptions
                  </p>
                  <p className='text-3xl font-bold text-blue-600'>
                    {stats.activeSubscriptions}
                  </p>
                </div>
                <Activity className='w-8 h-8 text-blue-600' />
              </div>
              <div className='mt-2'>
                <span className='text-xs text-green-600 font-medium'>
                  ✅ Centralized & Efficient
                </span>
              </div>
            </div>

            {/* Total Callbacks */}
            <div className='bg-white rounded-lg shadow-sm border p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>
                    Total Callbacks
                  </p>
                  <p className='text-3xl font-bold text-purple-600'>
                    {stats.totalCallbacks}
                  </p>
                </div>
                <Zap className='w-8 h-8 text-purple-600' />
              </div>
              <div className='mt-2'>
                <span className='text-xs text-purple-600 font-medium'>
                  Components sharing data
                </span>
              </div>
            </div>

            {/* Online Users */}
            <div className='bg-white rounded-lg shadow-sm border p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>
                    Online Users
                  </p>
                  <p className='text-3xl font-bold text-green-600'>
                    {isLoading ? '...' : onlineUsers.length}
                  </p>
                </div>
                <Users className='w-8 h-8 text-green-600' />
              </div>
              <div className='mt-2'>
                <span className='text-xs text-green-600 font-medium'>
                  Real-time updates
                </span>
              </div>
            </div>

            {/* Cached Profiles */}
            <div className='bg-white rounded-lg shadow-sm border p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>
                    Cached Profiles
                  </p>
                  <p className='text-3xl font-bold text-orange-600'>
                    {userProfiles.size}
                  </p>
                </div>
                <Clock className='w-8 h-8 text-orange-600' />
              </div>
              <div className='mt-2'>
                <span className='text-xs text-orange-600 font-medium'>
                  No duplicate API calls
                </span>
              </div>
            </div>

            {/* Chat Requests */}
            <div className='bg-white rounded-lg shadow-sm border p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>
                    Chat Requests
                  </p>
                  <p className='text-3xl font-bold text-purple-600'>
                    {incomingChatRequests.length + sentChatRequests.length}
                  </p>
                </div>
                <MessageCircle className='w-8 h-8 text-purple-600' />
              </div>
              <div className='mt-2'>
                <span className='text-xs text-purple-600 font-medium'>
                  {incomingChatRequests.length} incoming,{' '}
                  {sentChatRequests.length} sent
                </span>
              </div>
            </div>

            {/* Notifications */}
            <div className='bg-white rounded-lg shadow-sm border p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>
                    Notifications
                  </p>
                  <p className='text-3xl font-bold text-indigo-600'>
                    {notifications.length}
                  </p>
                </div>
                <CheckCircle className='w-8 h-8 text-indigo-600' />
              </div>
              <div className='mt-2'>
                <span className='text-xs text-indigo-600 font-medium'>
                  Centralized subscription
                </span>
              </div>
            </div>

            {/* Conversations */}
            <div className='bg-white rounded-lg shadow-sm border p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>
                    Conversations
                  </p>
                  <p className='text-3xl font-bold text-emerald-600'>
                    {conversations.size}
                  </p>
                </div>
                <MessageCircle className='w-8 h-8 text-emerald-600' />
              </div>
              <div className='mt-2'>
                <span className='text-xs text-emerald-600 font-medium'>
                  Shared subscription
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Analytics */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Subscription Details */}
            <div className='bg-white rounded-lg shadow-sm border p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                <Database className='w-5 h-5' />
                Subscription Analytics
              </h3>

              <div className='space-y-4'>
                <div>
                  <label className='text-sm font-medium text-gray-600'>
                    Active Subscription Keys
                  </label>
                  <div className='mt-1 p-3 bg-gray-50 rounded-md font-mono text-sm'>
                    {stats.subscriptionKeys.length > 0 ? (
                      <ul className='space-y-1'>
                        {stats.subscriptionKeys.map(key => (
                          <li key={key} className='flex items-center gap-2'>
                            <CheckCircle className='w-4 h-4 text-green-500' />
                            <span className='text-blue-600'>{key}</span>
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
                  <label className='text-sm font-medium text-gray-600'>
                    Subscription Efficiency
                  </label>
                  <div className='mt-1 p-3 bg-green-50 rounded-md'>
                    <div className='text-sm text-green-800'>
                      <strong>Before Zustand:</strong> {stats.totalCallbacks}{' '}
                      separate subscriptions ❌
                    </div>
                    <div className='text-sm text-green-800 mt-1'>
                      <strong>After Zustand:</strong>{' '}
                      {stats.activeSubscriptions} shared subscription
                      {stats.activeSubscriptions !== 1 ? 's' : ''} ✅
                    </div>
                    <div className='text-xs text-green-600 mt-2 font-medium'>
                      {stats.totalCallbacks > stats.activeSubscriptions
                        ? `${Math.round(((stats.totalCallbacks - stats.activeSubscriptions) / stats.totalCallbacks) * 100)}% reduction in subscriptions!`
                        : 'Optimal efficiency achieved!'}
                    </div>
                  </div>
                </div>

                <div>
                  <label className='text-sm font-medium text-gray-600'>
                    Profile Cache Efficiency
                  </label>
                  <div className='mt-1 p-3 bg-blue-50 rounded-md'>
                    <div className='text-sm text-blue-800'>
                      <strong>Cached Profiles:</strong> {userProfiles.size}{' '}
                      users
                    </div>
                    <div className='text-sm text-blue-800 mt-1'>
                      <strong>API Calls Saved:</strong> Eliminates duplicate
                      getUserProfile calls
                    </div>
                    <div className='text-xs text-blue-600 mt-2 font-medium'>
                      {userProfiles.size > 0
                        ? `${userProfiles.size} profiles cached - no duplicate API calls when switching sections!`
                        : 'Profiles will be cached as you browse users'}
                    </div>
                  </div>
                </div>

                <div>
                  <label className='text-sm font-medium text-gray-600'>
                    Chat Request Subscriptions
                  </label>
                  <div className='mt-1 p-3 bg-purple-50 rounded-md'>
                    <div className='text-sm text-purple-800'>
                      <strong>Incoming Requests:</strong>{' '}
                      {incomingChatRequests.length} pending
                    </div>
                    <div className='text-sm text-purple-800 mt-1'>
                      <strong>Sent Requests:</strong> {sentChatRequests.length}{' '}
                      pending
                    </div>
                    <div className='text-xs text-purple-600 mt-2 font-medium'>
                      Single subscription shared across: ChatRequests,
                      Notifications, OnlineUsers, DashboardSidebar
                    </div>
                  </div>
                </div>

                <div>
                  <label className='text-sm font-medium text-gray-600'>
                    Presence Optimization
                  </label>
                  <div className='mt-1 p-3 bg-green-50 rounded-md'>
                    <div className='text-sm text-green-800'>
                      <strong>Global Presence:</strong> Single subscription for
                      all users
                    </div>
                    <div className='text-sm text-green-800 mt-1'>
                      <strong>Individual Presence:</strong> Eliminated (uses
                      global data)
                    </div>
                    <div className='text-xs text-green-600 mt-2 font-medium'>
                      ChatWindow now uses centralized presence data instead of
                      individual subscriptions
                    </div>
                  </div>
                </div>

                <div>
                  <label className='text-sm font-medium text-gray-600'>
                    Notification Optimization
                  </label>
                  <div className='mt-1 p-3 bg-blue-50 rounded-md'>
                    <div className='text-sm text-blue-800'>
                      <strong>Before:</strong> NotificationsContent +
                      DashboardSidebar = 2 subscriptions ❌
                    </div>
                    <div className='text-sm text-blue-800 mt-1'>
                      <strong>After:</strong> Single shared notification
                      subscription ✅
                    </div>
                    <div className='text-xs text-blue-600 mt-2 font-medium'>
                      {notifications.length} notifications cached, count
                      auto-calculated
                    </div>
                  </div>
                </div>

                <div>
                  <label className='text-sm font-medium text-gray-600'>
                    Conversation Optimization
                  </label>
                  <div className='mt-1 p-3 bg-emerald-50 rounded-md'>
                    <div className='text-sm text-emerald-800'>
                      <strong>Before:</strong> OnlineUsers + chat/[chatId] = 2
                      separate subscriptions ❌
                    </div>
                    <div className='text-sm text-emerald-800 mt-1'>
                      <strong>After:</strong> Single shared conversation
                      subscription ✅
                    </div>
                    <div className='text-xs text-emerald-600 mt-2 font-medium'>
                      {conversations.size} conversations cached, real-time
                      updates shared
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Online Users Details */}
            <div className='bg-white rounded-lg shadow-sm border p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                <Users className='w-5 h-5' />
                Online Users Data
              </h3>

              {error && (
                <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-md'>
                  <p className='text-red-800 text-sm'>Error: {error}</p>
                </div>
              )}

              <div className='space-y-3'>
                {isLoading ? (
                  <div className='text-center py-4'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
                    <p className='text-sm text-gray-500 mt-2'>
                      Loading online users...
                    </p>
                  </div>
                ) : onlineUsers.length > 0 ? (
                  <div className='space-y-2'>
                    {onlineUsers.map(user => (
                      <div
                        key={user.userId}
                        className='p-3 bg-gray-50 rounded-md'
                      >
                        <div className='flex items-center justify-between'>
                          <div>
                            <p className='font-medium text-gray-900'>
                              User {user.userId.slice(-4)}
                            </p>
                            <p className='text-xs text-gray-500'>
                              Status: {user.status} • Online:{' '}
                              {user.isOnline ? 'Yes' : 'No'}
                            </p>
                          </div>
                          <div className='text-right'>
                            <div
                              className={`w-3 h-3 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
                            ></div>
                            <p className='text-xs text-gray-500 mt-1'>
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
                    <Users className='w-12 h-12 mx-auto text-gray-300 mb-2' />
                    <p>No users online</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Original Demo Component */}
          <div className='bg-white rounded-lg shadow-sm border p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              Original Demo Component
            </h3>
            <ZustandDemo />
          </div>

          {/* Benefits Section */}
          <div className='bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              🎯 Zustand Benefits Achieved
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <h4 className='font-medium text-gray-800'>
                  Performance Improvements
                </h4>
                <ul className='text-sm text-gray-600 space-y-1'>
                  <li>✅ Eliminated duplicate GraphQL subscriptions</li>
                  <li>✅ Reference counting prevents memory leaks</li>
                  <li>✅ Centralized state reduces re-renders</li>
                  <li>✅ Automatic cleanup on component unmount</li>
                </ul>
              </div>
              <div className='space-y-2'>
                <h4 className='font-medium text-gray-800'>
                  Developer Experience
                </h4>
                <ul className='text-sm text-gray-600 space-y-1'>
                  <li>✅ Single source of truth for all data</li>
                  <li>✅ Easy debugging with centralized logs</li>
                  <li>✅ Consistent state across components</li>
                  <li>✅ Simplified subscription management</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
