'use client';

import {
  Globe,
  MessageCircle,
  Timer,
} from 'lucide-react';

type SidebarSection = 'online' | 'connections' | 'chat-trial';

interface DashboardSidebarProps {
  activeSection: SidebarSection;
  onSectionChange: (section: SidebarSection) => void;
  onlineUsersCount: number;
  connectionsCount: number;
  chatTrialsCount: number;
}

export default function DashboardSidebar({
  activeSection,
  onSectionChange,
  onlineUsersCount,
  connectionsCount,
  chatTrialsCount,
}: DashboardSidebarProps) {
  return (
    <div className='w-80 flex-shrink-0'>
      <div className='bg-white rounded-2xl border border-gray-200 p-6 h-full'>
        <h2 className='text-lg font-semibold text-gray-900 mb-4'>
          Dashboard
        </h2>

        <nav className='space-y-2'>
          <button
            onClick={() => onSectionChange('online')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left border ${
              activeSection === 'online'
                ? 'bg-blue-50 text-blue-700 border-transparent'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Globe className='w-5 h-5' />
            <span className='font-medium text-base'>Online Now</span>
            <span className='ml-auto text-base text-gray-600 font-medium mr-2'>
              {onlineUsersCount}
            </span>
          </button>

          <button
            onClick={() => onSectionChange('connections')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left border ${
              activeSection === 'connections'
                ? 'bg-blue-50 text-blue-700 border-transparent'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <MessageCircle className='w-5 h-5' />
            <span className='font-medium text-base'>Connections</span>
            <span className='ml-auto text-base text-gray-600 font-medium mr-2'>
              {connectionsCount}
            </span>
          </button>

          <button
            onClick={() => onSectionChange('chat-trial')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left border ${
              activeSection === 'chat-trial'
                ? 'bg-blue-50 text-blue-700 border-transparent'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Timer className='w-5 h-5' />
            <span className='font-medium text-base'>Chat Trials</span>
            <span className='ml-auto text-base text-gray-600 font-medium mr-2'>
              {chatTrialsCount}
            </span>
          </button>
        </nav>
      </div>
    </div>
  );
}