'use client';

import {
  MessageSquare,
  Compass,
  Search,
  User,
  MoreHorizontal,
  Briefcase,
  GraduationCap,
  Award,
  Target,
  UserRoundSearch,
  Bookmark,
} from 'lucide-react';
import Image from 'next/image';
import React, { useState } from 'react';
import UserAvatar from './UserAvatar';

// Dummy data
const dummyUsers = [
  {
    id: '1',
    name: 'Zara Thompson',
    role: 'AI Researcher',
    company: 'TechFlow Labs',
    image: '/dummy-users/dummy-user6.jpg',
    isOnline: true,
    skills: ['Computer Vision', 'Robotics', 'Machine Learning'],
    lastMessage: 'Thanks for the research paper!',
    lastMessageTime: '2m ago',
    unreadCount: 0,
    status: 'Available for collaboration',
  },
  {
    id: '2',
    name: 'Kai Anderson',
    role: 'Quantum Computing Engineer',
    company: 'Quantum Dynamics',
    image: '/dummy-users/dummy-user7.jpg',
    isOnline: true,
    skills: ['Algorithms', 'Hardware', 'Quantum Physics'],
    lastMessage: 'The quantum algorithm looks promising',
    lastMessageTime: '15m ago',
    unreadCount: 2,
    status: 'Working on quantum supremacy',
  },
  {
    id: '3',
    name: 'Ganesh Thapa',
    role: 'Space Systems Engineer',
    company: 'Stellar Dynamics',
    image: '/dummy-users/dummy-user8.jpg',
    isOnline: false,
    skills: ['Satellites', 'Mission Planning', 'Aerospace'],
    lastMessage: "Let's discuss the Mars mission",
    lastMessageTime: '1h ago',
    unreadCount: 1,
    status: 'Building the future of space travel',
  },
  {
    id: '4',
    name: 'Haoyu Lee',
    role: 'Biotech Engineer',
    company: 'BioInnovate Corp',
    image: '/dummy-users/dummy-usr9.jpg',
    isOnline: true,
    skills: ['Gene Therapy', 'Lab Automation', 'Bioinformatics'],
    lastMessage: 'The CRISPR results are in!',
    lastMessageTime: '3h ago',
    unreadCount: 0,
    status: 'Advancing personalized medicine',
  },
  {
    id: '5',
    name: 'Alex Chen',
    role: 'Full-Stack Developer',
    company: 'PayFlow Systems',
    image: '/dummy-users/dummy-user2.jpg',
    isOnline: true,
    skills: ['React', 'Node.js', 'GraphQL'],
    lastMessage: 'Check out this new API design',
    lastMessageTime: '5h ago',
    unreadCount: 0,
    status: 'Building scalable payment systems',
  },
];

const dummyNotifications = [
  {
    id: '1',
    type: 'chat_request',
    title: 'Sarah Johnson',
    content: 'wants to connect with you',
    timestamp: '5 minutes ago',
    isRead: false,
    avatar: '/dummy-users/dummy-user2.jpg',
  },
  {
    id: '2',
    type: 'connection',
    title: 'Michael Chen',
    content: 'accepted your connection request',
    timestamp: '1 hour ago',
    isRead: false,
    avatar: '/dummy-users/dummy-user3.jpg',
  },
  {
    id: '3',
    type: 'message',
    title: 'Emily Rodriguez',
    content: 'sent you a message',
    timestamp: '2 hours ago',
    isRead: true,
    avatar: '/dummy-users/dummy-user4.jpg',
  },
];

const dummyConnections = [
  {
    id: '1',
    name: 'Dr. Sarah Kim',
    role: 'Data Scientist',
    company: 'DataVision Inc',
    image: '/dummy-users/dummy-user2.jpg',
    isOnline: true,
    connectionDate: '2 weeks ago',
    mutualConnections: 12,
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    role: 'Product Manager',
    company: 'ConnectTech',
    image: '/dummy-users/dummy-user3.jpg',
    isOnline: false,
    connectionDate: '1 month ago',
    mutualConnections: 8,
  },
  {
    id: '3',
    name: 'Lisa Wang',
    role: 'UX Designer',
    company: 'DesignHub',
    image: '/dummy-users/dummy-user4.jpg',
    isOnline: true,
    connectionDate: '3 weeks ago',
    mutualConnections: 15,
  },
];

const dummySavedUsers = [
  {
    id: '7',
    name: 'Dr. Elena Vasquez',
    role: 'AI Research Scientist',
    company: 'Google DeepMind',
    image: '/dummy-users/dummy-user6.jpg',
    isOnline: true,
    skills: ['Deep Learning', 'Computer Vision', 'NLP'],
    status: 'Advancing AI safety research',
    savedDate: '1 week ago',
  },
  {
    id: '8',
    name: 'James Chen',
    role: 'Senior Software Architect',
    company: 'Meta',
    image: '/dummy-users/dummy-user7.jpg',
    isOnline: false,
    skills: ['System Design', 'Microservices', 'Cloud Architecture'],
    status: 'Building scalable distributed systems',
    savedDate: '3 days ago',
  },
];

const currentUser = {
  name: 'Jordan Blake',
  role: 'Blockchain Developer',
  company: 'CryptoTech Solutions',
  email: 'jordan.blake@example.com',
  image: '/dummy-users/dummy-user5.jpg',
  skills: ['Solidity', 'Web3', 'DeFi', 'Smart Contracts'],
  interests: ['Cryptocurrency', 'Decentralization', 'Financial Technology'],
  experience: '5 years',
  education: 'MS Computer Science',
  about:
    'Passionate blockchain developer focused on building the future of decentralized finance. I love working on innovative DeFi protocols and smart contract security.',
};

type SectionType =
  | 'suggested'
  | 'connections'
  | 'saved'
  | 'notifications'
  | 'account'
  | 'search';

// Custom Connect Icon using circles from logo
const ConnectIcon = ({ className }: { className?: string }) => (
  <svg
    width='20'
    height='20'
    viewBox='30 30 160 160'
    className={className}
    fill='none'
    stroke='currentColor'
    strokeWidth='13'
  >
    <circle cx='75' cy='110' r='35' />
    <circle cx='145' cy='110' r='35' />
  </svg>
);

// Custom Notification Bell Icon
const NotificationBellIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
    />
  </svg>
);

export default function DashboardDemo() {
  const [activeSection, setActiveSection] = useState<SectionType>('suggested');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(dummyUsers.slice(0, 3));
  const [savedUserIds, setSavedUserIds] = useState<Set<string>>(
    new Set(['7', '8'])
  );

  // No need to convert paths anymore - UserAvatar handles local paths directly

  const handleToggleSave = (userId: string) => {
    setSavedUserIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };
  // Handle search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      // Filter users based on search query
      const filtered = dummyUsers.filter(
        user =>
          user.name.toLowerCase().includes(query.toLowerCase()) ||
          user.role.toLowerCase().includes(query.toLowerCase()) ||
          user.company.toLowerCase().includes(query.toLowerCase()) ||
          user.skills.some(skill =>
            skill.toLowerCase().includes(query.toLowerCase())
          )
      );
      setSearchResults(filtered);
      setActiveSection('search');
    }
  };

  // Sidebar items configuration
  const sidebarItems = [
    {
      id: 'suggested' as const,
      icon: Compass,
      label: 'Discover',
      count: dummyUsers.length,
    },
    {
      id: 'connections' as const,
      icon: 'ConnectIcon',
      label: 'Connections',
      count: dummyConnections.length,
    },
    {
      id: 'saved' as const,
      icon: Bookmark,
      label: 'Saved',
      count: savedUserIds.size,
    },
    {
      id: 'notifications' as const,
      icon: 'NotificationBell',
      label: 'Notifications',
      count: dummyNotifications.filter(n => !n.isRead).length,
    },
  ];

  // Render different sections
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'suggested':
        return renderSuggestedSection();
      case 'connections':
        return renderConnectionsSection();
      case 'saved':
        return renderSavedSection();
      case 'notifications':
        return renderNotificationsSection();
      case 'account':
        return renderAccountSection();
      case 'search':
        return renderSearchSection();
      default:
        return renderSuggestedSection();
    }
  };

  const renderSuggestedSection = () => (
    <div className='flex-1 overflow-y-auto'>
      <div className='space-y-0'>
        {dummyUsers.map((user, index) => {
          const isSaved = savedUserIds.has(user.id);
          return (
            <div
              key={user.id}
              className='px-2 py-2 sm:px-3 sm:py-3 group transition-all duration-200 cursor-pointer shadow-xs bg-white hover:bg-neutral-50 rounded-lg border border-neutral-100 hover:border-brand-200 opacity-0 animate-[slideUpFade_0.6s_ease-out_forwards]'
              style={{ animationDelay: `${0.5 + index * 0.5}s` }}
            >
              <div className='flex items-center gap-3'>
                <div className='flex-shrink-0 flex items-center justify-center'>
                  <UserAvatar
                    email={
                      user.name.toLowerCase().replace(' ', '') + '@example.com'
                    }
                    userId={user.id}
                    profilePictureUrl={user.image}
                    hasProfilePicture={true}
                    size='md'
                    showStatus={user.isOnline}
                    status={user.isOnline ? 'ONLINE' : 'OFFLINE'}
                    shape='square'
                    useLocal={true}
                  />
                </div>

                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 mb-1'>
                    <div className='text-neutral-900 text-base truncate no-email-detection font-medium'>
                      {user.name}
                    </div>
                  </div>
                  <div className='text-sm text-neutral-500 font-medium truncate'>
                    {user.role}
                    {user.company && (
                      <span className='text-neutral-400'> at {user.company}</span>
                    )}
                  </div>
                </div>

                <div className='flex-shrink-0 flex items-center gap-2'>
                  <button
                    onClick={() => handleToggleSave(user.id)}
                    className='p-2 rounded-lg transition-colors flex-shrink-0 text-neutral-500 hover:bg-neutral-50'
                    title={isSaved ? 'Remove from saved' : 'Save'}
                  >
                    <Bookmark
                      className={`w-4 h-4 ${isSaved ? 'fill-neutral-400' : 'stroke-neutral-500'}`}
                      strokeWidth={1.5}
                    />
                  </button>

                  <button className='px-2 py-2 rounded-lg text-base font-medium transition-colors flex items-center justify-center gap-2 flex-shrink-0 bg-brand-500 hover:bg-brand-600 text-white'>
                    <ConnectIcon className='w-4 h-4 text-white' />
                    <span className='text-base font-medium text-white'>
                      Connect
                    </span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderSavedSection = () => (
    <div className='flex-1 overflow-y-auto'>
      <div className='space-y-0'>
        {dummySavedUsers.map((user, index) => (
          <div
            key={user.id}
            className='px-3 py-2 group transition-all duration-200 cursor-pointer bg-white hover:bg-neutral-100 hover:rounded-2xl border border-transparent border-b-neutral-100 opacity-0 animate-[slideUpFade_0.6s_ease-out_forwards]'
            style={{ animationDelay: `${0.5 + index * 0.5}s` }}
          >
            <div className='flex items-center gap-1'>
              <div className='flex-shrink-0'>
                <UserAvatar
                  email={
                    user.name.toLowerCase().replace(' ', '') + '@example.com'
                  }
                  userId={user.id}
                  profilePictureUrl={user.image}
                  hasProfilePicture={true}
                  size='md'
                  showStatus={user.isOnline}
                  status={user.isOnline ? 'ONLINE' : 'OFFLINE'}
                  shape='square'
                  useLocal={true}
                />
              </div>

              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2 mb-1'>
                  <div className='text-neutral-900 truncate no-email-detection font-medium'>
                    {user.name}
                  </div>
                </div>
                <div className='text-[15px] text-neutral-500 mb-1.5 truncate'>
                  {user.role}
                </div>
              </div>

              <div className='flex-shrink-0 flex items-center gap-1.5'>
                <button
                  onClick={() => handleToggleSave(user.id)}
                  className='p-1.5 text-neutral-500 hover:text-brand-600 hover:bg-neutral-50 rounded-lg transition-colors'
                  title='Remove from saved'
                >
                  <Bookmark className='w-4 h-4 fill-neutral-400' />
                </button>

                <button className='px-2 py-1.5 text-base font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 flex-shrink-0 bg-brand-500 hover:bg-brand-600 text-white'>
                  <ConnectIcon className='w-4 h-4 text-white flex-shrink-0' />
                  <span className='hidden md:inline text-base font-medium'>
                    Connect
                  </span>
                </button>

                <button className='p-1.5 text-base font-medium rounded-lg transition-colors flex items-center justify-center w-[32px] h-[32px] bg-white border border-neutral-200 hover:bg-neutral-50'>
                  <MoreHorizontal className='w-4 h-4 text-neutral-500' />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderConnectionsSection = () => (
    <div className='flex-1 overflow-y-auto'>
      <div className='space-y-3'>
        {dummyConnections.map(connection => (
          <div
            key={connection.id}
            className='px-3 py-3 bg-white hover:bg-neutral-100 rounded-xl border border-neutral-200 transition-all duration-200 cursor-pointer'
          >
            <div className='flex items-center gap-2'>
              <div className='flex-shrink-0'>
                <UserAvatar
                  email={
                    connection.name.toLowerCase().replace(' ', '') +
                    '@example.com'
                  }
                  userId={connection.id}
                  profilePictureUrl={connection.image}
                  hasProfilePicture={true}
                  size='md'
                  showStatus={connection.isOnline}
                  status={connection.isOnline ? 'ONLINE' : 'OFFLINE'}
                  shape='square'
                  useLocal={true}
                />
              </div>

              <div className='flex-1 min-w-0'>
                <div className='text-neutral-900 font-medium mb-1'>
                  {connection.name}
                </div>
                <div className='text-sm text-neutral-500 mb-1'>
                  {connection.role}
                </div>
              </div>

              <div className='flex-shrink-0 flex items-center gap-2'>
                <button className='p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors'>
                  <MessageSquare className='w-4 h-4' />
                </button>
                <button className='p-2 text-neutral-500 hover:bg-neutral-50 rounded-lg transition-colors'>
                  <MoreHorizontal className='w-4 h-4' />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className='flex-1 overflow-y-auto'>
      <div className='space-y-3'>
        {dummyNotifications.map(notification => (
          <div
            key={notification.id}
            className={`px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer ${notification.isRead ? 'bg-white border-neutral-200' : 'bg-brand-50 border-brand-200'}`}
          >
            <div className='flex items-center gap-2'>
              <div className='flex-shrink-0'>
                <UserAvatar
                  email={
                    notification.title.toLowerCase().replace(' ', '') +
                    '@example.com'
                  }
                  userId={notification.id}
                  profilePictureUrl={notification.avatar}
                  hasProfilePicture={true}
                  size='sm'
                  showStatus={false}
                  shape='square'
                  useLocal={true}
                />
              </div>

              <div className='flex-1 min-w-0'>
                <div className='text-base font-medium text-neutral-900 mb-1'>
                  <span className=''>{notification.title}</span>{' '}
                  {notification.content}
                </div>
                <div className='text-sm text-neutral-500'>
                  {notification.timestamp}
                </div>
              </div>

              {notification.type === 'chat_request' && (
                <div className='flex-shrink-0 flex items-center gap-2'>
                  <button className='px-3 py-2 bg-brand-500 text-white text-base font-medium rounded-lg hover:bg-brand-600 transition-colors'>
                    Accept
                  </button>
                  <button className='px-3 py-2 bg-neutral-100 text-neutral-600 text-base font-medium rounded-lg hover:bg-neutral-200 transition-colors'>
                    Decline
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAccountSection = () => (
    <div className='h-full flex flex-col'>
      {/* Profile Section */}
      <div className='mx-auto w-full'>
        <div className='flex flex-col items-start mb-8'>
          <UserAvatar
            email={currentUser.email}
            userId='current-user'
            profilePictureUrl={currentUser.image}
            hasProfilePicture={true}
            size='xl'
            showStatus={true}
            status='ONLINE'
            shape='square'
            useLocal={true}
            className='mb-5'
          />
          <div className='flex items-start justify-between w-full'>
            <div>
              <h3 className='font-semibold text-neutral-900 text-lg mb-1'>
                {currentUser.name}
              </h3>
              <p className='text-base text-neutral-500 font-medium'>
                {currentUser.email}
              </p>
            </div>
            <div className='flex items-center gap-2 ml-4'>
              {/* Download Resume Button */}
              <button
                className='p-2 text-neutral-500 hover:text-brand-600 transition-colors rounded-lg hover:bg-neutral-100'
                title='Download my resume as PDF'
              >
                <svg
                  className='w-5 h-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className='mt-5 space-y-4'>
          <div className='p-4 bg-white border border-neutral-200 rounded-xl'>
            <div className='flex items-center gap-2 mb-3'>
              <Briefcase className='w-4 h-4 text-neutral-500' />
              <span className='text-sm font-medium text-neutral-500'>
                Experience
              </span>
            </div>
            <p className='text-neutral-900'>{currentUser.experience}</p>
          </div>

          <div className='p-4 bg-white border border-neutral-200 rounded-xl'>
            <div className='flex items-center gap-2 mb-3'>
              <GraduationCap className='w-4 h-4 text-neutral-500' />
              <span className='text-sm font-medium text-neutral-500'>
                Education
              </span>
            </div>
            <p className='text-neutral-900'>{currentUser.education}</p>
          </div>

          <div className='p-4 bg-white border border-neutral-200 rounded-xl'>
            <div className='flex items-center gap-2 mb-3'>
              <Award className='w-4 h-4 text-neutral-500' />
              <span className='text-sm font-medium text-neutral-500'>Skills</span>
            </div>
            <div className='flex flex-wrap gap-2'>
              {currentUser.skills.map((skill, index) => (
                <span
                  key={index}
                  className='px-3 py-1 bg-brand-50 text-brand-600 text-sm rounded-full font-medium'
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className='p-4 bg-white border border-neutral-200 rounded-xl'>
            <div className='flex items-center gap-2 mb-3'>
              <Target className='w-4 h-4 text-neutral-500' />
              <span className='text-sm font-medium text-neutral-500'>
                Interests
              </span>
            </div>
            <div className='flex flex-wrap gap-2'>
              {currentUser.interests.map((interest, index) => (
                <span
                  key={index}
                  className='px-3 py-1 bg-neutral-100 text-neutral-500 text-sm rounded-full font-medium'
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>

          <div className='p-4 bg-white border border-neutral-200 rounded-xl'>
            <div className='flex items-center gap-2 mb-3'>
              <User className='w-4 h-4 text-neutral-500' />
              <span className='text-sm font-medium text-neutral-500'>About</span>
            </div>
            <p className='text-neutral-900 leading-relaxed'>{currentUser.about}</p>
          </div>
        </div>
      </div>

      {/* Bottom spacing */}
      <div className='pb-8'></div>
    </div>
  );

  const renderSearchSection = () => (
    <div className='flex-1 overflow-y-auto'>
      {searchResults.length === 0 ? (
        <div className='flex flex-col items-center justify-center h-full text-center p-8'>
          <div className='w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center'>
            <Search className='w-8 h-8 text-neutral-500' />
          </div>
          <h3 className='text-lg font-medium text-neutral-900 mb-2'>
            No results found
          </h3>
          <p className='text-neutral-500'>Try searching for something else</p>
        </div>
      ) : (
        <div className='space-y-3'>
          {searchResults.map(user => (
            <div
              key={user.id}
              className='px-3 py-3 bg-white hover:bg-neutral-100 rounded-xl border border-neutral-200 transition-all duration-200 cursor-pointer'
            >
              <div className='flex items-center gap-2'>
                <div className='flex-shrink-0'>
                  <UserAvatar
                    email={
                      user.name.toLowerCase().replace(' ', '') + '@example.com'
                    }
                    userId={user.id}
                    profilePictureUrl={user.image}
                    hasProfilePicture={true}
                    size='md'
                    showStatus={user.isOnline}
                    status={user.isOnline ? 'ONLINE' : 'OFFLINE'}
                    shape='square'
                    useLocal={true}
                  />
                </div>

                <div className='flex-1 min-w-0'>
                  <div className='text-neutral-900 font-medium mb-1'>{user.name}</div>
                  <div className='text-sm text-neutral-500 mb-2'>{user.role}</div>
                  <div className='flex flex-wrap gap-1'>
                    {user.skills.slice(0, 3).map((skill, idx) => (
                      <span
                        key={idx}
                        className='bg-brand-50 text-brand-600 text-sm px-2 py-0.5 rounded-full font-medium'
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className='flex-shrink-0'>
                  <button className='px-4 py-2 bg-brand-500 text-white text-base font-medium rounded-lg hover:bg-brand-600 transition-colors'>
                    Connect
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className='bg-white md:rounded-2xl shadow-lg border border-neutral-200 md:max-w-7xl md:mx-auto overflow-hidden w-full p-4'>
      {/* Dashboard Layout - Desktop and Tablet */}
      <div className='hidden md:flex h-[650px]'>
        {/* Left Sidebar */}
        <div className='w-64 bg-white rounded-2xl border border-neutral-200 flex flex-col'>
          {/* Logo at top */}
          <div className='px-4 py-6 border-b border-neutral-200'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Image
                  src='/loopn.svg'
                  alt='Loopn'
                  width={32}
                  height={32}
                  priority
                />
                <div className='flex items-center gap-2'>
                  <h1 className='text-2xl font-bold text-neutral-900'>Loopn</h1>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation items */}
          <nav className='flex-1 overflow-y-auto py-3'>
            <div className='px-3 space-y-2'>
              {sidebarItems.map(({ id, icon, label, count }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`relative w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left group transition-colors ${
                    activeSection === id
                      ? 'text-brand-600 bg-brand-50 font-medium'
                      : 'text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  <div className='w-5 h-5 flex-shrink-0 flex items-center justify-center'>
                    {icon === 'NotificationBell' ? (
                      <NotificationBellIcon className='w-5 h-5' />
                    ) : icon === 'ConnectIcon' ? (
                      <ConnectIcon className='w-5 h-5' />
                    ) : (
                      React.createElement(icon, {
                        className: 'w-5 h-5',
                      })
                    )}
                  </div>
                  <span className='flex-1 flex items-center justify-between min-w-0'>
                    <span className='truncate'>{label}</span>
                    {count > 0 && id === 'notifications' && (
                      <span className='text-xs font-bold flex items-center justify-center h-5 w-5 rounded-full bg-b_red-600 text-white'>
                        {count > 99 ? '99+' : count}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </nav>

          {/* Account buttons at bottom */}
          <div className='border-t border-neutral-200 p-2 space-y-1'>
            {/* Account Button */}
            <button
              onClick={() => setActiveSection('account')}
              className={`relative w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left group border transition-colors duration-150 ${
                activeSection === 'account'
                  ? 'bg-brand-50 text-brand-600 border-brand-200'
                  : 'text-neutral-900 hover:bg-neutral-100 hover:text-neutral-900 border-transparent'
              }`}
            >
              <div className='w-5 h-5 flex-shrink-0 flex items-center justify-center'>
                <UserAvatar
                  email={currentUser.email}
                  userId='current-user-sidebar'
                  profilePictureUrl='/dummy-users/dummy-user5.jpg'
                  hasProfilePicture={true}
                  size='xs'
                  showStatus={true}
                  status='ONLINE'
                  shape='square'
                  useLocal={true}
                />
              </div>
              <span className='font-medium text-base flex-1 truncate'>
                Jordan Blake
              </span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className='flex-1 bg-white rounded-2xl border border-neutral-200 p-6 overflow-hidden flex flex-col min-h-0 ml-4'>
          {/* Search User - Always visible at top */}
          <div className='flex-shrink-0 mb-2 sm:mb-2'>
            <div className='max-w-xl mx-auto relative'>
              <div className='relative'>
                <UserRoundSearch className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 z-10' />
                <input
                  type='text'
                  placeholder='Search'
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  style={{
                    fontSize: '16px',
                    WebkitAppearance: 'none',
                    MozAppearance: 'textfield',
                  }}
                  className='w-full pl-9 pr-16 py-3 rounded-full border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-brand-200 focus:bg-white bg-neutral-100 hover:bg-white transition-colors placeholder-neutral-1000'
                />
                <button
                  type='button'
                  onClick={() => handleSearch(searchQuery)}
                  className='absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full hover:bg-neutral-50 flex items-center justify-center transition-colors duration-150 shadow-sm'
                >
                  <svg
                    className='w-5 h-5 text-brand-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Section Header */}
          <div className='flex-shrink-0 mb-4 sm:mb-5 lg:mb-6'>
            {activeSection === 'suggested' && (
              <>
                <h2 className='text-2xl font-bold text-neutral-900 mb-1'>Discover</h2>
                <p className='text-base text-neutral-500'>
                  AI-curated professionals based on your interests
                </p>
              </>
            )}
            {activeSection === 'connections' && (
              <>
                <h2 className='text-2xl font-bold text-neutral-900 mb-1'>
                  Connections
                </h2>
                <p className='text-base text-neutral-500'>
                  People you're connected with
                </p>
              </>
            )}
            {activeSection === 'saved' && (
              <>
                <h2 className='text-2xl font-bold text-neutral-900 mb-1'>Saved</h2>
                <p className='text-base text-neutral-500'>
                  Professionals you've saved for later
                </p>
              </>
            )}
            {activeSection === 'notifications' && (
              <>
                <h2 className='text-2xl font-bold text-neutral-900 mb-1'>
                  Notifications
                </h2>
                <p className='text-base text-neutral-500'>
                  Stay updated with your network
                </p>
              </>
            )}

            {activeSection === 'account' && (
              <>
                <h2 className='text-xl font-bold text-neutral-900 mb-1'>
                  Your Profile
                </h2>
                <p className='text-sm text-neutral-500'>
                  Manage your account and profile
                </p>
              </>
            )}
            {activeSection === 'search' && (
              <>
                <h2 className='text-xl font-bold text-neutral-900 mb-1'>
                  Search Results
                </h2>
                <p className='text-sm text-neutral-500'>
                  Found {searchResults.length} results for "{searchQuery}"
                </p>
              </>
            )}
          </div>

          {/* Dynamic Content */}
          {renderSectionContent()}
        </div>
      </div>

      {/* Mobile Dashboard Layout */}
      <div className='md:hidden'>
        {/* Mobile Header */}
        <div className='p-4 border-b border-neutral-200 bg-white'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <UserAvatar
                email={currentUser.email}
                userId='current-user-mobile'
                profilePictureUrl='/dummy-users/dummy-user5.jpg'
                hasProfilePicture={true}
                size='sm'
                showStatus={true}
                status='ONLINE'
                shape='square'
                useLocal={true}
              />
              <div className='flex-1 min-w-0'>
                <h3 className='text-sm font-semibold text-neutral-900 truncate'>
                  Jordan Blake
                </h3>
                <p className='text-sm text-neutral-500 truncate'>
                  Blockchain Developer
                </p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <button
                onClick={() => setActiveSection('notifications')}
                className='relative'
              >
                <NotificationBellIcon className='w-5 h-5 text-neutral-500' />
                {dummyNotifications.filter(n => !n.isRead).length > 0 && (
                  <div className='absolute -top-1 -right-1 w-4 h-4 bg-b_red-600 rounded-full flex items-center justify-center'>
                    <span className='text-white text-[8px] font-bold leading-none'>
                      {dummyNotifications.filter(n => !n.isRead).length > 99
                        ? '99+'
                        : dummyNotifications.filter(n => !n.isRead).length}
                    </span>
                  </div>
                )}
              </button>
              <button onClick={() => setActiveSection('search')}>
                <Search className='w-5 h-5 text-neutral-500' />
              </button>
              <button onClick={() => setActiveSection('saved')}>
                <Bookmark className='w-5 h-5 text-neutral-500' />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className='flex bg-neutral-100 border-b border-neutral-200'>
          <button
            onClick={() => setActiveSection('suggested')}
            className={`flex-1 px-3 py-3 text-center text-sm font-medium ${
              activeSection === 'suggested'
                ? 'text-brand-600 bg-white border-b-2 border-brand-500'
                : 'text-neutral-500'
            }`}
          >
            Discover
          </button>
          <button
            onClick={() => setActiveSection('connections')}
            className={`flex-1 px-3 py-3 text-center text-sm font-medium ${
              activeSection === 'connections'
                ? 'text-brand-600 bg-white border-b-2 border-brand-500'
                : 'text-neutral-500'
            }`}
          >
            Connections
          </button>
          <button
            onClick={() => setActiveSection('saved')}
            className={`flex-1 px-3 py-3 text-center text-sm font-medium ${
              activeSection === 'saved'
                ? 'text-brand-600 bg-white border-b-2 border-brand-500'
                : 'text-neutral-500'
            }`}
          >
            Saved
          </button>
          <button
            onClick={() => setActiveSection('notifications')}
            className={`flex-1 px-3 py-3 text-center text-sm font-medium relative ${
              activeSection === 'notifications'
                ? 'text-brand-600 bg-white border-b-2 border-brand-500'
                : 'text-neutral-500'
            }`}
          >
            Notifications
            {dummyNotifications.filter(n => !n.isRead).length > 0 && (
              <div className='absolute -top-1 -right-1 w-4 h-4 bg-b_red-600 rounded-full flex items-center justify-center'>
                <span className='text-white text-[8px] font-bold leading-none'>
                  {dummyNotifications.filter(n => !n.isRead).length > 99
                    ? '99+'
                    : dummyNotifications.filter(n => !n.isRead).length}
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Mobile Content */}
        <div className='p-4 bg-neutral-100 min-h-[500px]'>
          {/* Mobile Search */}
          {activeSection === 'search' && (
            <div className='mb-4'>
              <div className='relative'>
                <UserRoundSearch className='absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500' />
                <input
                  type='text'
                  placeholder='Search professionals...'
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  className='w-full pl-9 pr-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-brand-200 bg-white'
                />
              </div>
            </div>
          )}

          {/* Mobile Section Headers */}
          <div className='mb-4'>
            {activeSection === 'suggested' && (
              <>
                <h2 className='text-lg font-bold text-neutral-900 mb-1'>
                  Smart Matches for You
                </h2>
                <p className='text-sm text-neutral-500'>
                  AI-curated professionals based on your interests
                </p>
              </>
            )}
            {activeSection === 'connections' && (
              <>
                <h2 className='text-lg font-bold text-neutral-900 mb-1'>
                  Your Connections
                </h2>
                <p className='text-sm text-neutral-500'>
                  People you're connected with
                </p>
              </>
            )}
            {activeSection === 'saved' && (
              <>
                <h2 className='text-lg font-bold text-neutral-900 mb-1'>
                  Saved Professionals
                </h2>
                <p className='text-sm text-neutral-500'>
                  Professionals you've saved for later
                </p>
              </>
            )}
            {activeSection === 'notifications' && (
              <>
                <h2 className='text-lg font-bold text-neutral-900 mb-1'>
                  Notifications
                </h2>
                <p className='text-sm text-neutral-500'>
                  Stay updated with your network
                </p>
              </>
            )}
            {activeSection === 'search' && (
              <>
                <h2 className='text-lg font-bold text-neutral-900 mb-1'>
                  Search Results
                </h2>
                <p className='text-sm text-neutral-500'>
                  {searchQuery
                    ? `Found ${searchResults.length} results for "${searchQuery}"`
                    : 'Search for professionals'}
                </p>
              </>
            )}
          </div>

          {/* Mobile Content Sections */}
          {activeSection === 'suggested' && (
            <div className='space-y-3'>
              {dummyUsers.slice(0, 4).map((user, index) => (
                <div
                  key={user.id}
                  className='rounded-xl border px-3 py-3 group transition-all duration-200 cursor-pointer bg-white border-neutral-200 hover:bg-neutral-100 opacity-0 animate-[slideUpFade_0.6s_ease-out_forwards]'
                  style={{ animationDelay: `${0.5 + index * 0.5}s` }}
                >
                  <div className='flex items-center gap-2'>
                    <div className='flex-shrink-0'>
                      <UserAvatar
                        email={
                          user.name.toLowerCase().replace(' ', '') +
                          '@example.com'
                        }
                        userId={user.id}
                        profilePictureUrl={user.image}
                        hasProfilePicture={true}
                        size='md'
                        showStatus={user.isOnline}
                        status={user.isOnline ? 'ONLINE' : 'OFFLINE'}
                        shape='square'
                        useLocal={true}
                      />
                    </div>

                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-1'>
                        <div className='text-neutral-900 truncate no-email-detection font-medium text-sm'>
                          {user.name}
                        </div>
                        {user.isOnline && (
                          <div className='w-2 h-2 bg-brand-500 rounded-full animate-pulse'></div>
                        )}
                      </div>
                      <div className='text-sm mb-2 text-neutral-500'>
                        {user.role}
                      </div>
                    </div>

                    <div className='flex-shrink-0'>
                      <button className='px-3 py-2 text-base font-medium rounded-lg transition-colors bg-brand-500 hover:bg-brand-600 text-white flex items-center gap-1.5'>
                        <ConnectIcon className='w-4 h-4 text-white flex-shrink-0' />
                        Connect
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'connections' && (
            <div className='space-y-3'>
              {dummyConnections.map(connection => (
                <div
                  key={connection.id}
                  className='rounded-xl border px-3 py-3 bg-white border-neutral-200 hover:bg-neutral-100 transition-all duration-200 cursor-pointer'
                >
                  <div className='flex items-center gap-2'>
                    <div className='flex-shrink-0'>
                      <UserAvatar
                        email={
                          connection.name.toLowerCase().replace(' ', '') +
                          '@example.com'
                        }
                        userId={connection.id}
                        profilePictureUrl={connection.image}
                        hasProfilePicture={true}
                        size='md'
                        showStatus={connection.isOnline}
                        status={connection.isOnline ? 'ONLINE' : 'OFFLINE'}
                        shape='square'
                        useLocal={true}
                      />
                    </div>

                    <div className='flex-1 min-w-0'>
                      <div className='text-neutral-900 font-medium text-sm mb-1'>
                        {connection.name}
                      </div>
                      <div className='text-sm text-neutral-500 mb-1'>
                        {connection.role}
                      </div>
                    </div>

                    <div className='flex-shrink-0'>
                      <button className='p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors'>
                        <MessageSquare className='w-4 h-4' />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'saved' && (
            <div className='space-y-3'>
              {dummySavedUsers.map(user => {
                return (
                  <div
                    key={user.id}
                    className='rounded-xl border px-3 py-3 bg-white border-neutral-200 hover:bg-neutral-100 transition-all duration-200 cursor-pointer'
                  >
                    <div className='flex items-center gap-2'>
                      <div className='flex-shrink-0'>
                        <UserAvatar
                          email={
                            user.name.toLowerCase().replace(' ', '') +
                            '@example.com'
                          }
                          userId={user.id}
                          profilePictureUrl={user.image}
                          hasProfilePicture={true}
                          size='md'
                          showStatus={user.isOnline}
                          status={user.isOnline ? 'ONLINE' : 'OFFLINE'}
                          shape='square'
                          useLocal={true}
                        />
                      </div>

                      <div className='flex-1 min-w-0'>
                        <div className='text-neutral-900 font-medium text-sm mb-1'>
                          {user.name}
                        </div>
                        <div className='text-sm text-neutral-500 mb-2'>
                          {user.role}
                        </div>
                      </div>

                      <div className='flex-shrink-0 flex items-center gap-2'>
                        <button
                          onClick={() => handleToggleSave(user.id)}
                          className='p-1.5 text-neutral-500 hover:text-brand-600 hover:bg-neutral-50 rounded-lg transition-colors'
                          title='Remove from saved'
                        >
                          <Bookmark className='w-4 h-4 fill-neutral-400' />
                        </button>
                        <button className='px-3 py-2 bg-brand-500 text-white text-base font-medium rounded-lg hover:bg-brand-600 transition-colors'>
                          Connect
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className='space-y-3'>
              {dummyNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`px-3 py-3 rounded-xl border transition-all duration-200 cursor-pointer ${notification.isRead ? 'bg-white border-neutral-200' : 'bg-brand-50 border-brand-200'}`}
                >
                  <div className='flex items-center gap-2'>
                    <div className='flex-shrink-0'>
                      <UserAvatar
                        email={
                          notification.title.toLowerCase().replace(' ', '') +
                          '@example.com'
                        }
                        userId={notification.id + '-mobile'}
                        profilePictureUrl={notification.avatar}
                        hasProfilePicture={true}
                        size='sm'
                        showStatus={false}
                        shape='square'
                        useLocal={true}
                      />
                    </div>

                    <div className='flex-1 min-w-0'>
                      <div className='text-sm font-medium text-neutral-900 mb-1'>
                        <span className='font-semibold'>
                          {notification.title}
                        </span>{' '}
                        {notification.content}
                      </div>
                      <div className='text-sm text-neutral-500'>
                        {notification.timestamp}
                      </div>
                    </div>

                    {notification.type === 'chat_request' && (
                      <div className='flex-shrink-0 flex flex-col gap-1'>
                        <button className='px-2 py-1.5 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors'>
                          Accept
                        </button>
                        <button className='px-2 py-1.5 bg-neutral-100 text-neutral-600 text-sm font-medium rounded-lg hover:bg-neutral-200 transition-colors'>
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'search' && (
            <div className='space-y-3'>
              {searchResults.length === 0 ? (
                <div className='text-center py-8'>
                  <div className='w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center'>
                    <Search className='w-8 h-8 text-neutral-500' />
                  </div>
                  <h3 className='text-lg font-medium text-neutral-900 mb-2'>
                    {searchQuery
                      ? 'No results found'
                      : 'Search for professionals'}
                  </h3>
                  <p className='text-neutral-500'>
                    {searchQuery
                      ? 'Try searching for something else'
                      : 'Enter a name, role, or skill to get started'}
                  </p>
                </div>
              ) : (
                searchResults.map(user => (
                  <div
                    key={user.id}
                    className='rounded-xl border px-3 py-3 bg-white border-neutral-200 hover:bg-neutral-100 transition-all duration-200 cursor-pointer'
                  >
                    <div className='flex items-center gap-2'>
                      <div className='flex-shrink-0'>
                        <UserAvatar
                          email={
                            user.name.toLowerCase().replace(' ', '') +
                            '@example.com'
                          }
                          userId={user.id}
                          profilePictureUrl={user.image}
                          hasProfilePicture={true}
                          size='md'
                          showStatus={user.isOnline}
                          status={user.isOnline ? 'ONLINE' : 'OFFLINE'}
                          shape='square'
                          useLocal={true}
                        />
                      </div>

                      <div className='flex-1 min-w-0'>
                        <div className='text-neutral-900 font-medium text-sm mb-1'>
                          {user.name}
                        </div>
                        <div className='text-sm text-neutral-500 mb-2'>
                          {user.role}
                        </div>
                      </div>

                      <div className='flex-shrink-0'>
                        <button className='px-3 py-2 bg-brand-500 text-white text-base font-medium rounded-lg hover:bg-brand-600 transition-colors'>
                          Connect
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
