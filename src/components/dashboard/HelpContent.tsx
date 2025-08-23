'use client';

import React from 'react';
import {
  MessageCircle,
  Users,
  Search,
  Bell,
  Clock,
  X,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface HelpContentProps {
  onOpenBugReport?: () => void;
}

export default function HelpContent({
  onOpenBugReport,
}: HelpContentProps = {}) {
  return (
    <div className='h-full mx-auto w-full pl-0 sm:pl-2'>
      {/* Getting Started */}
      <div className='mb-6'>
        <h3 className='text-lg font-semibold text-black mb-4'>
          Getting Started
        </h3>
        <div className='space-y-3'>
          <div className='bg-white rounded-lg p-4 border border-gray-200'>
            <h4 className='font-medium text-black text-base mb-2'>
              I'm not getting any matches
            </h4>
            <p className='text-base text-black mb-3'>
              This usually happens when your profile is incomplete.
            </p>
            <div className='space-y-2'>
              <div className='flex items-start gap-2'>
                <CheckCircle className='w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0' />
                <span className='text-base text-black'>
                  Go to Account → Complete your profile with skills and
                  interests
                </span>
              </div>
              <div className='flex items-start gap-2'>
                <CheckCircle className='w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0' />
                <span className='text-base text-black'>
                  Add a clear profile picture
                </span>
              </div>
              <div className='flex items-start gap-2'>
                <CheckCircle className='w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0' />
                <span className='text-base text-black'>
                  Write a brief "About" section
                </span>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg p-4 border border-gray-200'>
            <h4 className='font-medium text-black text-base mb-2'>
              How do I start a conversation?
            </h4>
            <p className='text-base text-black mb-3'>
              You can start trial chats without connecting first.
            </p>
            <div className='space-y-2'>
              <div className='flex items-start gap-2'>
                <span className='text-brand-600 font-medium text-base mt-0.5 flex-shrink-0'>
                  1.
                </span>
                <span className='text-base text-black'>
                  Find someone in Suggested or Search
                </span>
              </div>
              <div className='flex items-start gap-2'>
                <span className='text-brand-600 font-medium text-base mt-0.5 flex-shrink-0'>
                  2.
                </span>
                <span className='text-base text-black'>
                  Click "Start Trial" button
                </span>
              </div>
              <div className='flex items-start gap-2'>
                <span className='text-brand-600 font-medium text-base mt-0.5 flex-shrink-0'>
                  3.
                </span>
                <span className='text-base text-black'>
                  You have 7 days to chat and decide if you want to connect
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Help */}
      <div className='mb-6'>
        <h3 className='text-lg font-semibold text-black mb-4'>
          Understanding the Dashboard
        </h3>
        <div className='space-y-3'>
          <div className='bg-white rounded-lg p-4 border border-gray-200'>
            <div className='flex items-center gap-3 mb-2'>
              <Sparkles className='w-4 h-4 text-brand-600' />
              <h4 className='font-medium text-black text-base'>Discover</h4>
            </div>
            <p className='text-base text-black'>
              People the AI thinks you might want to connect with based on your
              profile
            </p>
          </div>

          <div className='bg-white rounded-lg p-4 border border-gray-200'>
            <div className='flex items-center gap-3 mb-2'>
              <Search className='w-4 h-4 text-brand-600' />
              <h4 className='font-medium text-black text-base'>Search</h4>
            </div>
            <p className='text-base text-black'>
              Find specific people by name, company, or skills
            </p>
          </div>

          <div className='bg-white rounded-lg p-4 border border-gray-200'>
            <div className='flex items-center gap-3 mb-2'>
              <MessageCircle className='w-4 h-4 text-brand-600' />
              <h4 className='font-medium text-black text-base'>Chats</h4>
            </div>
            <p className='text-base text-black'>
              All your ongoing conversations - both trial chats and established
              connections
            </p>
          </div>

          <div className='bg-white rounded-lg p-4 border border-gray-200'>
            <div className='flex items-center gap-3 mb-2'>
              <Users className='w-4 h-4 text-brand-600' />
              <h4 className='font-medium text-black text-base'>Connections</h4>
            </div>
            <p className='text-base text-black'>
              People you've successfully connected with (no time limit on chats)
            </p>
          </div>

          <div className='bg-white rounded-lg p-4 border border-gray-200'>
            <div className='flex items-center gap-3 mb-2'>
              <Bell className='w-4 h-4 text-brand-600' />
              <h4 className='font-medium text-black text-base'>
                Notifications
              </h4>
            </div>
            <p className='text-base text-black'>
              Chat requests from others and system updates
            </p>
          </div>
        </div>
      </div>

      {/* Troubleshooting */}
      <div className='mb-6'>
        <h3 className='text-lg font-semibold text-black mb-4'>Common Issues</h3>
        <div className='space-y-3'>
          <div className='bg-white rounded-lg p-4 border border-gray-200'>
            <div className='flex items-start gap-3'>
              <AlertCircle className='w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0' />
              <div>
                <h4 className='font-medium text-black text-base mb-1'>
                  My trial chat expired
                </h4>
                <p className='text-base text-black mb-2'>
                  Trial chats last 7 days. If it expires:
                </p>
                <ul className='text-base text-black space-y-1'>
                  <li>• You can no longer send messages</li>
                  <li>• You can still read previous messages</li>
                  <li>
                    • You can send a connection request to continue chatting
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg p-4 border border-gray-200'>
            <div className='flex items-start gap-3'>
              <AlertCircle className='w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0' />
              <div>
                <h4 className='font-medium text-black text-base mb-1'>
                  Someone isn't responding
                </h4>
                <p className='text-base text-black'>
                  This is normal in professional networking:
                </p>
                <ul className='text-base text-black space-y-1 mt-2'>
                  <li>• People might be busy or not check frequently</li>
                  <li>• Try other matches instead of waiting</li>
                  <li>• Focus on building multiple connections</li>
                </ul>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg p-4 border border-gray-200'>
            <div className='flex items-start gap-3'>
              <Clock className='w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0' />
              <div>
                <h4 className='font-medium text-black text-base mb-1'>
                  What does the timer mean?
                </h4>
                <p className='text-base text-black'>
                  Shows time remaining in your trial chat period. After it
                  expires, you'll need to connect to continue messaging.
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg p-4 border border-gray-200'>
            <div className='flex items-start gap-3'>
              <X className='w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0' />
              <div>
                <h4 className='font-medium text-black text-base mb-1'>
                  How do I end a chat?
                </h4>
                <p className='text-base text-black mb-2'>In any chat window:</p>
                <ul className='text-base text-black space-y-1'>
                  <li>• Click the menu button (three dots)</li>
                  <li>• Select "End Chat"</li>
                  <li>• The conversation will be archived</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Support */}
      <div className='bg-white rounded-lg p-4 border border-gray-200'>
        <h3 className='text-lg font-semibold text-black mb-2'>
          Still Need Help?
        </h3>
        <p className='text-base text-black mb-4'>
          If you can't find the answer here, reach out to our support team.
        </p>
        <div className='flex flex-col sm:flex-row gap-3'>
          <button
            onClick={() =>
              window.open(
                'mailto:exonary.build@gmail.com?subject=Support Request - Loopn',
                '_blank'
              )
            }
            className='px-4 py-2 bg-brand-500 text-white rounded-lg text-base font-medium hover:bg-brand-600 transition-colors'
          >
            Contact Support
          </button>
          <button
            onClick={onOpenBugReport}
            className='px-4 py-2 bg-white text-black border border-gray-300 rounded-lg text-base font-medium hover:bg-gray-100 transition-colors'
          >
            Report Bug / Suggest
          </button>
        </div>
      </div>
    </div>
  );
}
