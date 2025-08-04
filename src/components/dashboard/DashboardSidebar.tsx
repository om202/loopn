'use client';

import { MessageCircle, Timer, Users } from 'lucide-react';

type SidebarSection = 'all' | 'connections' | 'chat-trial';

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
      id: 'all' as const,
      icon: MessageCircle,
      label: 'Chats',
      count: onlineUsersCount + connectionsCount + chatTrialsCount,
    },
    {
      id: 'connections' as const,
      icon: Users,
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
    <>
      {/* Desktop Sidebar */}
      <div className='hidden lg:block w-80 flex-shrink-0'>
        <div className='bg-white rounded-2xl border border-slate-200 p-6 h-full flex flex-col'>
          <nav className='space-y-2 flex-1 overflow-y-auto'>
            {sidebarItems.map(({ id, icon: Icon, label, count }) => (
              <button
                key={id}
                onClick={() => onSectionChange(id)}
                className={`relative w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-xl text-left border transition-all duration-200 ${
                  activeSection === id
                    ? 'bg-blue-50 text-blue-700 border-transparent'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Icon className='w-5 h-5 flex-shrink-0' />
                <span className='font-medium text-base'>{label}</span>
                <span className='ml-auto text-base text-slate-600 font-medium mr-2'>
                  {count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <div className='lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-100 px-4 py-2'>
        <nav className='flex justify-around items-center max-w-sm mx-auto'>
          {sidebarItems.map(({ id, icon: Icon, label, count }) => (
            <button
              key={id}
              onClick={() => onSectionChange(id)}
              className={`relative flex flex-col items-center justify-center gap-1 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                activeSection === id
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
              title={label}
            >
              <Icon className='w-5 h-5 flex-shrink-0' />
              <span className='text-xs font-medium'>{label}</span>

              {/* Count indicator for mobile */}
              {count > 0 && (
                <span className='absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center min-w-[16px] font-semibold'>
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
