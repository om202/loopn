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
      <div className='hidden lg:block w-68 flex-shrink-0'>
        <div className='bg-white rounded-2xl border border-zinc-200 p-6 h-full flex flex-col'>
          <nav className='space-y-2 flex-1 overflow-y-auto'>
            {sidebarItems.map(({ id, icon: Icon, label, count }) => (
              <button
                key={id}
                onClick={() => onSectionChange(id)}
                className={`relative w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-xl text-left border transition-all duration-200 ${
                  activeSection === id
                    ? 'bg-brand-100 text-brand-700 border-transparent'
                    : 'bg-white text-zinc-900 border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                <Icon className='w-5 h-5 flex-shrink-0' />
                <span className='font-medium text-base'>{label}</span>
                <span className='ml-auto text-base text-zinc-900 font-medium mr-2'>
                  {count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <div className='lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-zinc-200 px-4 py-3'>
        <nav className='flex justify-center items-stretch'>
          <div className='flex bg-zinc-50 rounded-2xl p-1 gap-1 max-w-xs w-full'>
            {sidebarItems.map(({ id, icon: Icon, label, count }) => (
              <button
                key={id}
                onClick={() => onSectionChange(id)}
                className={`relative flex-1 flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-xl transition-all duration-200 min-h-[56px] ${
                  activeSection === id
                    ? 'text-brand-500 bg-white shadow-lg'
                    : 'text-zinc-500 hover:text-zinc-700 hover:bg-white/50'
                }`}
                title={label}
              >
                <Icon className='w-5 h-5 flex-shrink-0' />
                <span className='text-sm font-medium leading-none'>
                  {label}
                </span>

                {/* Count indicator for mobile */}
                {count > 0 && (
                  <span className='absolute -top-1 -right-1 bg-brand-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center min-w-[20px] font-semibold shadow-lg'>
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}
