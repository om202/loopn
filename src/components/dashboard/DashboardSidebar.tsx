'use client';

import { Globe, MessageCircle, Timer } from 'lucide-react';

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
  const sidebarItems = [
    {
      id: 'online' as const,
      icon: Globe,
      label: 'Online Now',
      count: onlineUsersCount,
    },
    {
      id: 'connections' as const,
      icon: MessageCircle,
      label: 'Connections',
      count: connectionsCount,
    },
    {
      id: 'chat-trial' as const,
      icon: Timer,
      label: 'Chat Trials',
      count: chatTrialsCount,
    },
  ];

  return (
    <div className='w-20 lg:w-80 flex-shrink-0'>
      <div className='bg-white rounded-2xl border border-gray-200 p-3 lg:p-6 h-full'>
        {/* Title - hidden on small screens, visible on large screens */}
        <h2 className='hidden lg:block text-lg font-semibold text-gray-900 mb-4'>
          Dashboard
        </h2>

        <nav className='space-y-2'>
          {sidebarItems.map(({ id, icon: Icon, label, count }) => (
            <button
              key={id}
              onClick={() => onSectionChange(id)}
              className={`relative w-full flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2.5 rounded-xl text-left border transition-all duration-200 ${
                activeSection === id
                  ? 'bg-blue-50 text-blue-700 border-transparent'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
              title={label} // Tooltip for icon-only view
            >
              <Icon className='w-5 h-5 flex-shrink-0' />
              
              {/* Text and count - hidden on small screens, visible on large screens */}
              <span className='hidden lg:block font-medium text-base'>
                {label}
              </span>
              <span className='hidden lg:block ml-auto text-base text-gray-600 font-medium mr-2'>
                {count}
              </span>
              
              {/* Small count indicator for mobile - only show if count > 0 */}
              {count > 0 && (
                <span className='lg:hidden absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center min-w-[20px]'>
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
