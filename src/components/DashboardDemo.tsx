'use client';

import {
  MessageCircle,
  CheckCircle2,
  Users,
  Compass,
  HelpCircle,
  Bell,
  Search,
  User,
  MoreHorizontal,
  Briefcase,
  GraduationCap,
  Award,
  Target,
  Shield,
  Globe,
} from 'lucide-react';
import Image from 'next/image';
import React, { useState } from 'react';

// Dummy data
const dummyUsers = [
  {
    id: '1',
    name: 'Zara Thompson',
    role: 'AI Researcher',
    company: 'DeepMind',
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
    company: 'IBM Research',
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
    company: 'SpaceX',
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
    company: 'Moderna',
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
    company: 'Stripe',
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
    content: 'wants to chat with you',
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
    company: 'Google',
    image: '/dummy-users/dummy-user2.jpg',
    isOnline: true,
    connectionDate: '2 weeks ago',
    mutualConnections: 12,
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    role: 'Product Manager',
    company: 'Meta',
    image: '/dummy-users/dummy-user3.jpg',
    isOnline: false,
    connectionDate: '1 month ago',
    mutualConnections: 8,
  },
  {
    id: '3',
    name: 'Lisa Wang',
    role: 'UX Designer',
    company: 'Airbnb',
    image: '/dummy-users/dummy-user4.jpg',
    isOnline: true,
    connectionDate: '3 weeks ago',
    mutualConnections: 15,
  },
];

const currentUser = {
  name: 'Jordan Blake',
  role: 'Blockchain Developer',
  company: 'Coinbase',
  email: 'jordan.blake@example.com',
  image: '/dummy-users/dummy-user5.jpg',
  skills: ['Solidity', 'Web3', 'DeFi', 'Smart Contracts'],
  interests: ['Cryptocurrency', 'Decentralization', 'Financial Technology'],
  experience: '5 years',
  education: 'MS Computer Science, Stanford University',
  about:
    'Passionate blockchain developer focused on building the future of decentralized finance. I love working on innovative DeFi protocols and smart contract security.',
};

type SectionType =
  | 'discover'
  | 'connections'
  | 'chats'
  | 'notifications'
  | 'help'
  | 'account'
  | 'search';

export default function DashboardDemo() {
  const [activeSection, setActiveSection] = useState<SectionType>('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(dummyUsers.slice(0, 3));
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

  // Render different sections
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'discover':
        return renderDiscoverSection();
      case 'connections':
        return renderConnectionsSection();
      case 'chats':
        return renderChatsSection();
      case 'notifications':
        return renderNotificationsSection();
      case 'help':
        return renderHelpSection();
      case 'account':
        return renderAccountSection();
      case 'search':
        return renderSearchSection();
      default:
        return renderDiscoverSection();
    }
  };

  const renderDiscoverSection = () => (
    <div className='flex-1 overflow-y-auto'>
      <div className='space-y-0'>
        {dummyUsers.map((user, index) => (
          <div
            key={user.id}
            className='px-3 py-2 group transition-all duration-200 cursor-pointer bg-white hover:bg-zinc-50 hover:rounded-2xl border border-transparent border-b-zinc-100 opacity-0 animate-[slideUpFade_0.6s_ease-out_forwards]'
            style={{ animationDelay: `${0.5 + index * 0.5}s` }}
          >
            <div className='flex items-center gap-3'>
              <div className='flex-shrink-0'>
                <div className='relative'>
                  <Image
                    src={user.image}
                    alt={user.name}
                    width={48}
                    height={48}
                    className='w-12 h-12 rounded-full object-cover'
                  />
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${user.isOnline ? 'bg-green-400' : 'bg-gray-400'} border-2 border-white rounded-full`}
                  ></div>
                </div>
              </div>

              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2 mb-1'>
                  <div className='text-zinc-900 truncate no-email-detection font-medium'>
                    {user.name}
                  </div>
                </div>
                <div className='text-[15px] text-zinc-500 mb-1.5 truncate'>
                  {user.role} at {user.company}
                </div>
                <div className='flex flex-wrap gap-1'>
                  {user.skills.slice(0, 2).map((skill, idx) => (
                    <span
                      key={idx}
                      className='bg-brand-50 text-brand-700 text-xs px-2 py-0.5 rounded-full font-medium'
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className='flex-shrink-0 flex items-center gap-1.5'>
                <button className='px-2 py-1.5 text-base font-medium rounded-xl border transition-colors flex items-center justify-center flex-shrink-0 w-[40px] h-[40px] md:w-auto md:h-auto md:gap-1.5 md:min-w-[44px] bg-brand-50 text-brand-500 border-brand-100 hover:bg-brand-100 hover:border-brand-200'>
                  <CheckCircle2 className='w-4 h-4 text-brand-500 flex-shrink-0' />
                  <span className='hidden md:inline text-base font-medium'>
                    Connect
                  </span>
                </button>

                <button className='md:flex p-1.5 text-base font-medium rounded-full border transition-colors items-center justify-center w-[32px] h-[32px] bg-white border-zinc-100 hover:bg-zinc-100'>
                  <MoreHorizontal className='w-5 h-5 text-zinc-500' />
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
            className='px-3 py-3 bg-white hover:bg-zinc-50 rounded-xl border border-zinc-200 transition-all duration-200 cursor-pointer'
          >
            <div className='flex items-center gap-3'>
              <div className='flex-shrink-0'>
                <div className='relative'>
                  <Image
                    src={connection.image}
                    alt={connection.name}
                    width={48}
                    height={48}
                    className='w-12 h-12 rounded-full object-cover'
                  />
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${connection.isOnline ? 'bg-green-400' : 'bg-gray-400'} border-2 border-white rounded-full`}
                  ></div>
                </div>
              </div>

              <div className='flex-1 min-w-0'>
                <div className='text-zinc-900 font-medium mb-1'>
                  {connection.name}
                </div>
                <div className='text-sm text-zinc-500 mb-1'>
                  {connection.role} at {connection.company}
                </div>
                <div className='text-xs text-zinc-400'>
                  Connected {connection.connectionDate} •{' '}
                  {connection.mutualConnections} mutual connections
                </div>
              </div>

              <div className='flex-shrink-0 flex items-center gap-2'>
                <button className='p-2 text-brand-500 hover:bg-brand-50 rounded-lg transition-colors'>
                  <MessageCircle className='w-5 h-5' />
                </button>
                <button className='p-2 text-zinc-500 hover:bg-zinc-100 rounded-lg transition-colors'>
                  <MoreHorizontal className='w-5 h-5' />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderChatsSection = () => (
    <div className='flex-1 overflow-y-auto'>
      <div className='space-y-1'>
        {dummyUsers
          .filter(user => user.lastMessage)
          .map(user => (
            <div
              key={user.id}
              className='px-3 py-3 hover:bg-zinc-50 rounded-xl transition-all duration-200 cursor-pointer'
            >
              <div className='flex items-center gap-3'>
                <div className='flex-shrink-0'>
                  <div className='relative'>
                    <Image
                      src={user.image}
                      alt={user.name}
                      width={48}
                      height={48}
                      className='w-12 h-12 rounded-full object-cover'
                    />
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${user.isOnline ? 'bg-green-400' : 'bg-gray-400'} border-2 border-white rounded-full`}
                    ></div>
                  </div>
                </div>

                <div className='flex-1 min-w-0'>
                  <div className='flex items-center justify-between mb-1'>
                    <div className='text-zinc-900 font-medium truncate'>
                      {user.name}
                    </div>
                    <div className='text-xs text-zinc-500'>
                      {user.lastMessageTime}
                    </div>
                  </div>
                  <div className='text-sm text-zinc-500 truncate'>
                    {user.lastMessage}
                  </div>
                </div>

                {user.unreadCount > 0 && (
                  <div className='flex-shrink-0'>
                    <div className='w-5 h-5 bg-brand-500 text-white text-xs font-bold rounded-full flex items-center justify-center'>
                      {user.unreadCount}
                    </div>
                  </div>
                )}
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
            className={`px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer ${notification.isRead ? 'bg-white border-zinc-200' : 'bg-brand-50 border-brand-200'}`}
          >
            <div className='flex items-center gap-3'>
              <div className='flex-shrink-0'>
                <Image
                  src={notification.avatar}
                  alt={notification.title}
                  width={40}
                  height={40}
                  className='w-10 h-10 rounded-full object-cover'
                />
              </div>

              <div className='flex-1 min-w-0'>
                <div className='text-sm font-medium text-zinc-900 mb-1'>
                  <span className='font-semibold'>{notification.title}</span>{' '}
                  {notification.content}
                </div>
                <div className='text-xs text-zinc-500'>
                  {notification.timestamp}
                </div>
              </div>

              {notification.type === 'chat_request' && (
                <div className='flex-shrink-0 flex items-center gap-2'>
                  <button className='px-3 py-1.5 bg-brand-500 text-white text-xs font-medium rounded-lg hover:bg-brand-600 transition-colors'>
                    Accept
                  </button>
                  <button className='px-3 py-1.5 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-lg hover:bg-zinc-200 transition-colors'>
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

  const renderHelpSection = () => (
    <div className='flex-1 overflow-y-auto'>
      <div className='space-y-6'>
        <div className='text-center py-8'>
          <div className='w-16 h-16 mx-auto mb-4 bg-brand-100 rounded-full flex items-center justify-center'>
            <HelpCircle className='w-8 h-8 text-brand-500' />
          </div>
          <h3 className='text-lg font-medium text-zinc-900 mb-2'>
            Help & Support
          </h3>
          <p className='text-zinc-500'>Get help with using Loopn</p>
        </div>

        <div className='space-y-3'>
          <div className='p-4 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
                <Globe className='w-5 h-5 text-blue-600' />
              </div>
              <div>
                <div className='font-medium text-zinc-900'>Getting Started</div>
                <div className='text-sm text-zinc-500'>
                  Learn the basics of Loopn
                </div>
              </div>
            </div>
          </div>

          <div className='p-4 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center'>
                <MessageCircle className='w-5 h-5 text-green-600' />
              </div>
              <div>
                <div className='font-medium text-zinc-900'>Chat Features</div>
                <div className='text-sm text-zinc-500'>
                  How to use messaging and connections
                </div>
              </div>
            </div>
          </div>

          <div className='p-4 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center'>
                <Shield className='w-5 h-5 text-purple-600' />
              </div>
              <div>
                <div className='font-medium text-zinc-900'>
                  Privacy & Safety
                </div>
                <div className='text-sm text-zinc-500'>
                  Keep your account secure
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAccountSection = () => (
    <div className='flex-1 overflow-y-auto'>
      <div className='space-y-6'>
        {/* Profile Header */}
        <div className='flex items-center gap-4'>
          <div className='relative'>
            <Image
              src={currentUser.image}
              alt={currentUser.name}
              width={80}
              height={80}
              className='w-20 h-20 rounded-full object-cover'
            />
            <div className='absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 border-3 border-white rounded-full'></div>
          </div>
          <div>
            <h3 className='text-xl font-semibold text-zinc-900'>
              {currentUser.name}
            </h3>
            <p className='text-zinc-500'>
              {currentUser.role} at {currentUser.company}
            </p>
            <p className='text-sm text-zinc-400'>{currentUser.email}</p>
          </div>
        </div>

        {/* Profile Details */}
        <div className='space-y-4'>
          <div className='p-4 bg-white border border-zinc-200 rounded-xl'>
            <div className='flex items-center gap-2 mb-3'>
              <Briefcase className='w-4 h-4 text-zinc-500' />
              <span className='text-sm font-medium text-zinc-500'>
                Experience
              </span>
            </div>
            <p className='text-zinc-900'>{currentUser.experience}</p>
          </div>

          <div className='p-4 bg-white border border-zinc-200 rounded-xl'>
            <div className='flex items-center gap-2 mb-3'>
              <GraduationCap className='w-4 h-4 text-zinc-500' />
              <span className='text-sm font-medium text-zinc-500'>
                Education
              </span>
            </div>
            <p className='text-zinc-900'>{currentUser.education}</p>
          </div>

          <div className='p-4 bg-white border border-zinc-200 rounded-xl'>
            <div className='flex items-center gap-2 mb-3'>
              <Award className='w-4 h-4 text-zinc-500' />
              <span className='text-sm font-medium text-zinc-500'>Skills</span>
            </div>
            <div className='flex flex-wrap gap-2'>
              {currentUser.skills.map((skill, index) => (
                <span
                  key={index}
                  className='px-3 py-1 bg-brand-50 text-brand-700 text-sm rounded-full font-medium'
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className='p-4 bg-white border border-zinc-200 rounded-xl'>
            <div className='flex items-center gap-2 mb-3'>
              <Target className='w-4 h-4 text-zinc-500' />
              <span className='text-sm font-medium text-zinc-500'>
                Interests
              </span>
            </div>
            <div className='flex flex-wrap gap-2'>
              {currentUser.interests.map((interest, index) => (
                <span
                  key={index}
                  className='px-3 py-1 bg-zinc-100 text-zinc-700 text-sm rounded-full font-medium'
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>

          <div className='p-4 bg-white border border-zinc-200 rounded-xl'>
            <div className='flex items-center gap-2 mb-3'>
              <User className='w-4 h-4 text-zinc-500' />
              <span className='text-sm font-medium text-zinc-500'>About</span>
            </div>
            <p className='text-zinc-900 leading-relaxed'>{currentUser.about}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSearchSection = () => (
    <div className='flex-1 overflow-y-auto'>
      {searchResults.length === 0 ? (
        <div className='flex flex-col items-center justify-center h-full text-center p-8'>
          <div className='w-16 h-16 mx-auto mb-4 bg-zinc-100 rounded-full flex items-center justify-center'>
            <Search className='w-8 h-8 text-zinc-500' />
          </div>
          <h3 className='text-lg font-medium text-zinc-900 mb-2'>
            No results found
          </h3>
          <p className='text-zinc-500'>Try searching for something else</p>
        </div>
      ) : (
        <div className='space-y-3'>
          {searchResults.map(user => (
            <div
              key={user.id}
              className='px-3 py-3 bg-white hover:bg-zinc-50 rounded-xl border border-zinc-200 transition-all duration-200 cursor-pointer'
            >
              <div className='flex items-center gap-3'>
                <div className='flex-shrink-0'>
                  <div className='relative'>
                    <Image
                      src={user.image}
                      alt={user.name}
                      width={48}
                      height={48}
                      className='w-12 h-12 rounded-full object-cover'
                    />
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${user.isOnline ? 'bg-green-400' : 'bg-gray-400'} border-2 border-white rounded-full`}
                    ></div>
                  </div>
                </div>

                <div className='flex-1 min-w-0'>
                  <div className='text-zinc-900 font-medium mb-1'>
                    {user.name}
                  </div>
                  <div className='text-sm text-zinc-500 mb-2'>
                    {user.role} at {user.company}
                  </div>
                  <div className='flex flex-wrap gap-1'>
                    {user.skills.slice(0, 3).map((skill, idx) => (
                      <span
                        key={idx}
                        className='bg-brand-50 text-brand-700 text-xs px-2 py-0.5 rounded-full font-medium'
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className='flex-shrink-0'>
                  <button className='px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors'>
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
    <div className='bg-white md:rounded-2xl shadow-xl border border-zinc-200 md:max-w-7xl md:mx-auto overflow-hidden w-full'>
      {/* Dashboard Layout - Desktop and Tablet */}
      <div className='hidden md:flex h-[650px]'>
        {/* Left Sidebar */}
        <div className='w-64 bg-white rounded-2xl border border-zinc-200 flex flex-col'>
          {/* Logo at top */}
          <div className='px-4 py-6 border-b border-zinc-100'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <Image
                  src='/loopn.svg'
                  alt='Loopn'
                  width={32}
                  height={32}
                  priority
                />
                <div className='flex items-center gap-2'>
                  <h1 className='text-2xl font-bold text-zinc-900'>Loopn</h1>
                  <span className='bg-brand-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full tracking-wide uppercase'>
                    beta
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation items */}
          <nav className='flex-1 overflow-y-auto py-4'>
            <div className='px-2 space-y-1'>
              {/* Discover */}
              <button
                onClick={() => setActiveSection('discover')}
                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left group border transition-colors duration-150 ${
                  activeSection === 'discover'
                    ? 'bg-brand-50 text-brand-700 border-brand-200'
                    : 'text-zinc-900 hover:bg-zinc-50 hover:text-zinc-900 border-transparent'
                }`}
              >
                <div className='w-5 h-5 flex-shrink-0 flex items-center justify-center'>
                  <Compass className='w-5 h-5' />
                </div>
                <span className='font-medium text-base flex-1 flex items-center gap-3'>
                  Discover
                </span>
              </button>

              {/* Connections */}
              <button
                onClick={() => setActiveSection('connections')}
                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left group border transition-colors duration-150 ${
                  activeSection === 'connections'
                    ? 'bg-brand-50 text-brand-700 border-brand-200'
                    : 'text-zinc-900 hover:bg-zinc-50 hover:text-zinc-900 border-transparent'
                }`}
              >
                <div className='w-5 h-5 flex-shrink-0 flex items-center justify-center'>
                  <Users className='w-5 h-5' />
                </div>
                <span className='font-medium text-base flex-1 flex items-center gap-3'>
                  Connections
                  <span className='text-xs font-bold flex items-center justify-center h-5 w-5 rounded-full text-center bg-zinc-100 text-zinc-600'>
                    {dummyConnections.length}
                  </span>
                </span>
              </button>

              {/* Chats */}
              <button
                onClick={() => setActiveSection('chats')}
                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left group border transition-colors duration-150 ${
                  activeSection === 'chats'
                    ? 'bg-brand-50 text-brand-700 border-brand-200'
                    : 'text-zinc-900 hover:bg-zinc-50 hover:text-zinc-900 border-transparent'
                }`}
              >
                <div className='w-5 h-5 flex-shrink-0 flex items-center justify-center'>
                  <MessageCircle className='w-5 h-5' />
                </div>
                <span className='font-medium text-base flex-1 flex items-center gap-3'>
                  Chats
                  <span className='text-xs font-bold flex items-center justify-center h-5 w-5 rounded-full text-center bg-brand-50 text-brand-500'>
                    {dummyUsers
                      .filter(u => u.unreadCount > 0)
                      .reduce((sum, u) => sum + u.unreadCount, 0)}
                  </span>
                </span>
              </button>

              {/* Notifications */}
              <button
                onClick={() => setActiveSection('notifications')}
                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left group border transition-colors duration-150 ${
                  activeSection === 'notifications'
                    ? 'bg-brand-50 text-brand-700 border-brand-200'
                    : 'text-zinc-900 hover:bg-zinc-50 hover:text-zinc-900 border-transparent'
                }`}
              >
                <div className='w-5 h-5 flex-shrink-0 flex items-center justify-center'>
                  <Bell className='w-5 h-5' />
                </div>
                <span className='font-medium text-base flex-1 flex items-center gap-3'>
                  Notifications
                  <span className='text-xs font-bold flex items-center justify-center h-6 w-6 rounded-full text-center bg-brand-50 text-brand-500 border border-brand-100'>
                    {dummyNotifications.filter(n => !n.isRead).length}
                  </span>
                </span>
              </button>
            </div>
          </nav>

          {/* Help and Account buttons at bottom */}
          <div className='border-t border-zinc-100 p-2 space-y-1'>
            {/* Help Button */}
            <div className='flex items-center gap-2'>
              <button
                onClick={() => setActiveSection('help')}
                className={`relative flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-left group border transition-colors duration-150 ${
                  activeSection === 'help'
                    ? 'bg-brand-50 text-brand-700 border-brand-200'
                    : 'text-zinc-900 hover:bg-zinc-50 hover:text-zinc-900 border-transparent'
                }`}
              >
                <div className='w-5 h-5 flex-shrink-0 flex items-center justify-center'>
                  <HelpCircle className='w-5 h-5' />
                </div>
                <span className='font-medium text-base flex-1'>
                  Help & Support
                </span>
              </button>

              <button className='p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-colors border border-transparent hover:border-zinc-200'>
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z'
                  />
                </svg>
              </button>
            </div>

            {/* Account Button */}
            <button
              onClick={() => setActiveSection('account')}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left group border transition-colors duration-150 ${
                activeSection === 'account'
                  ? 'bg-brand-50 text-brand-700 border-brand-200'
                  : 'text-zinc-900 hover:bg-zinc-50 hover:text-zinc-900 border-transparent'
              }`}
            >
              <div className='w-5 h-5 flex-shrink-0 flex items-center justify-center'>
                <div className='relative'>
                  <Image
                    src='/dummy-users/dummy-user5.jpg'
                    alt='Your Profile'
                    width={20}
                    height={20}
                    className='w-5 h-5 rounded-full object-cover'
                  />
                  <div className='absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 border border-white rounded-full'></div>
                </div>
              </div>
              <span className='font-medium text-base flex-1 truncate'>
                Jordan Blake
              </span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className='flex-1 bg-white rounded-2xl border border-zinc-200 p-2 sm:p-4 lg:p-6 overflow-hidden flex flex-col min-h-0 ml-4'>
          {/* Search User - Always visible at top */}
          <div className='flex-shrink-0 mb-2 sm:mb-2'>
            <div className='max-w-md mx-auto relative'>
              <div className='relative'>
                <svg
                  className='absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M13 10V3L4 14h7v7l9-11h-7z'
                  />
                </svg>
                <input
                  type='text'
                  placeholder='Search or ask Loopn'
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  style={{
                    fontSize: '16px',
                    WebkitAppearance: 'none',
                    MozAppearance: 'textfield',
                  }}
                  className='w-full pl-10 pr-16 py-3 rounded-full border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand-200 focus:bg-white bg-zinc-100 hover:bg-brand-50 transition-colors placeholder-zinc-500'
                />
                <button
                  type='button'
                  onClick={() => handleSearch(searchQuery)}
                  className='absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full hover:bg-gray-50 flex items-center justify-center transition-colors duration-150 shadow-sm border border-gray-200'
                >
                  <svg
                    className='w-4 h-4 text-brand-500'
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
            {activeSection === 'discover' && (
              <>
                <h2 className='text-xl font-bold text-zinc-900 mb-1'>
                  Smart Matches for You
                </h2>
                <p className='text-sm text-zinc-600'>
                  AI-curated professionals based on your interests and goals
                </p>
              </>
            )}
            {activeSection === 'connections' && (
              <>
                <h2 className='text-xl font-bold text-zinc-900 mb-1'>
                  Your Connections
                </h2>
                <p className='text-sm text-zinc-600'>
                  People you're connected with
                </p>
              </>
            )}
            {activeSection === 'chats' && (
              <>
                <h2 className='text-xl font-bold text-zinc-900 mb-1'>
                  Recent Chats
                </h2>
                <p className='text-sm text-zinc-600'>
                  Your ongoing conversations
                </p>
              </>
            )}
            {activeSection === 'notifications' && (
              <>
                <h2 className='text-xl font-bold text-zinc-900 mb-1'>
                  Notifications
                </h2>
                <p className='text-sm text-zinc-600'>
                  Stay updated with your network
                </p>
              </>
            )}
            {activeSection === 'help' && (
              <>
                <h2 className='text-xl font-bold text-zinc-900 mb-1'>
                  Help & Support
                </h2>
                <p className='text-sm text-zinc-600'>
                  Get help with using Loopn
                </p>
              </>
            )}
            {activeSection === 'account' && (
              <>
                <h2 className='text-xl font-bold text-zinc-900 mb-1'>
                  Your Profile
                </h2>
                <p className='text-sm text-zinc-600'>
                  Manage your account and profile
                </p>
              </>
            )}
            {activeSection === 'search' && (
              <>
                <h2 className='text-xl font-bold text-zinc-900 mb-1'>
                  Search Results
                </h2>
                <p className='text-sm text-zinc-600'>
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
        <div className='p-4 border-b border-zinc-200 bg-white'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='relative'>
                <Image
                  src='/dummy-users/dummy-user5.jpg'
                  alt='Your Profile'
                  width={40}
                  height={40}
                  className='w-10 h-10 rounded-full object-cover'
                />
                <div className='absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full'></div>
              </div>
              <div className='flex-1 min-w-0'>
                <h3 className='text-sm font-semibold text-zinc-900 truncate'>
                  Jordan Blake
                </h3>
                <p className='text-xs text-zinc-600 truncate'>
                  Blockchain Developer
                </p>
              </div>
            </div>
            <div className='flex items-center gap-3'>
              <button
                onClick={() => setActiveSection('notifications')}
                className='relative'
              >
                <Bell className='w-5 h-5 text-zinc-600' />
                {dummyNotifications.filter(n => !n.isRead).length > 0 && (
                  <div className='absolute -top-1 -right-1 w-3 h-3 bg-brand-500 rounded-full flex items-center justify-center'>
                    <span className='text-white text-xs font-bold'>
                      {dummyNotifications.filter(n => !n.isRead).length}
                    </span>
                  </div>
                )}
              </button>
              <button onClick={() => setActiveSection('search')}>
                <Search className='w-5 h-5 text-zinc-600' />
              </button>
              <button onClick={() => setActiveSection('chats')}>
                <MessageCircle className='w-5 h-5 text-zinc-600' />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className='flex bg-zinc-50 border-b border-zinc-200'>
          <button
            onClick={() => setActiveSection('discover')}
            className={`flex-1 px-3 py-3 text-center text-sm font-medium ${
              activeSection === 'discover'
                ? 'text-brand-600 bg-white border-b-2 border-brand-500'
                : 'text-zinc-600'
            }`}
          >
            Discover
          </button>
          <button
            onClick={() => setActiveSection('connections')}
            className={`flex-1 px-3 py-3 text-center text-sm font-medium ${
              activeSection === 'connections'
                ? 'text-brand-600 bg-white border-b-2 border-brand-500'
                : 'text-zinc-600'
            }`}
          >
            Connections
          </button>
          <button
            onClick={() => setActiveSection('notifications')}
            className={`flex-1 px-3 py-3 text-center text-sm font-medium relative ${
              activeSection === 'notifications'
                ? 'text-brand-600 bg-white border-b-2 border-brand-500'
                : 'text-zinc-600'
            }`}
          >
            Notifications
            {dummyNotifications.filter(n => !n.isRead).length > 0 && (
              <div className='absolute -top-1 -right-1 w-4 h-4 bg-brand-500 rounded-full flex items-center justify-center'>
                <span className='text-white text-xs font-bold'>
                  {dummyNotifications.filter(n => !n.isRead).length}
                </span>
              </div>
            )}
          </button>
          <button
            onClick={() => setActiveSection('chats')}
            className={`flex-1 px-3 py-3 text-center text-sm font-medium ${
              activeSection === 'chats'
                ? 'text-brand-600 bg-white border-b-2 border-brand-500'
                : 'text-zinc-600'
            }`}
          >
            Chats
          </button>
        </div>

        {/* Mobile Content */}
        <div className='p-4 bg-zinc-50 min-h-[500px]'>
          {/* Mobile Search */}
          {activeSection === 'search' && (
            <div className='mb-4'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                <input
                  type='text'
                  placeholder='Search professionals...'
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  className='w-full pl-10 pr-4 py-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand-200 bg-white'
                />
              </div>
            </div>
          )}

          {/* Mobile Section Headers */}
          <div className='mb-4'>
            {activeSection === 'discover' && (
              <>
                <h2 className='text-lg font-bold text-zinc-900 mb-1'>
                  Smart Matches for You
                </h2>
                <p className='text-sm text-zinc-600'>
                  AI-curated professionals based on your interests
                </p>
              </>
            )}
            {activeSection === 'connections' && (
              <>
                <h2 className='text-lg font-bold text-zinc-900 mb-1'>
                  Your Connections
                </h2>
                <p className='text-sm text-zinc-600'>
                  People you're connected with
                </p>
              </>
            )}
            {activeSection === 'chats' && (
              <>
                <h2 className='text-lg font-bold text-zinc-900 mb-1'>
                  Recent Chats
                </h2>
                <p className='text-sm text-zinc-600'>
                  Your ongoing conversations
                </p>
              </>
            )}
            {activeSection === 'notifications' && (
              <>
                <h2 className='text-lg font-bold text-zinc-900 mb-1'>
                  Notifications
                </h2>
                <p className='text-sm text-zinc-600'>
                  Stay updated with your network
                </p>
              </>
            )}
            {activeSection === 'search' && (
              <>
                <h2 className='text-lg font-bold text-zinc-900 mb-1'>
                  Search Results
                </h2>
                <p className='text-sm text-zinc-600'>
                  {searchQuery
                    ? `Found ${searchResults.length} results for "${searchQuery}"`
                    : 'Search for professionals'}
                </p>
              </>
            )}
          </div>

          {/* Mobile Content Sections */}
          {activeSection === 'discover' && (
            <div className='space-y-3'>
              {dummyUsers.slice(0, 4).map((user, index) => (
                <div
                  key={user.id}
                  className='rounded-xl border px-3 py-3 group transition-all duration-200 cursor-pointer bg-white border-zinc-200 hover:bg-zinc-50 opacity-0 animate-[slideUpFade_0.6s_ease-out_forwards]'
                  style={{ animationDelay: `${0.5 + index * 0.5}s` }}
                >
                  <div className='flex items-center gap-3'>
                    <div className='flex-shrink-0'>
                      <div className='relative'>
                        <Image
                          src={user.image}
                          alt={user.name}
                          width={48}
                          height={48}
                          className='w-12 h-12 rounded-full object-cover border border-brand-500'
                        />
                        <div
                          className={`absolute -bottom-0 -right-0 w-3 h-3 ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'} rounded-full border-2 border-white box-content`}
                        ></div>
                      </div>
                    </div>

                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-1'>
                        <div className='text-zinc-900 truncate no-email-detection font-medium text-sm'>
                          {user.name}
                        </div>
                        {user.isOnline && (
                          <div className='w-2 h-2 bg-brand-500 rounded-full animate-pulse'></div>
                        )}
                      </div>
                      <div className='text-xs mb-2 text-zinc-600'>
                        {user.role}
                      </div>
                      <div className='flex flex-wrap gap-1'>
                        {user.skills.slice(0, 2).map((skill, idx) => (
                          <span
                            key={idx}
                            className='bg-brand-50 text-brand-700 text-xs px-2 py-0.5 rounded-full font-medium'
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className='flex-shrink-0'>
                      <button className='px-3 py-2 text-xs font-medium rounded-lg border transition-colors bg-white text-brand-500 border-zinc-200 hover:bg-brand-100 hover:border-zinc-200 flex items-center gap-1.5'>
                        <CheckCircle2 className='w-3 h-3 text-brand-500 flex-shrink-0' />
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
                  className='rounded-xl border px-3 py-3 bg-white border-zinc-200 hover:bg-zinc-50 transition-all duration-200 cursor-pointer'
                >
                  <div className='flex items-center gap-3'>
                    <div className='flex-shrink-0'>
                      <div className='relative'>
                        <Image
                          src={connection.image}
                          alt={connection.name}
                          width={48}
                          height={48}
                          className='w-12 h-12 rounded-full object-cover'
                        />
                        <div
                          className={`absolute -bottom-0 -right-0 w-3 h-3 ${connection.isOnline ? 'bg-green-500' : 'bg-gray-400'} rounded-full border-2 border-white box-content`}
                        ></div>
                      </div>
                    </div>

                    <div className='flex-1 min-w-0'>
                      <div className='text-zinc-900 font-medium text-sm mb-1'>
                        {connection.name}
                      </div>
                      <div className='text-xs text-zinc-600 mb-1'>
                        {connection.role}
                      </div>
                      <div className='text-xs text-zinc-400'>
                        Connected {connection.connectionDate}
                      </div>
                    </div>

                    <div className='flex-shrink-0'>
                      <button className='p-2 text-brand-500 hover:bg-brand-50 rounded-lg transition-colors'>
                        <MessageCircle className='w-4 h-4' />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'chats' && (
            <div className='space-y-2'>
              {dummyUsers
                .filter(user => user.lastMessage)
                .map(user => (
                  <div
                    key={user.id}
                    className='px-3 py-3 bg-white hover:bg-zinc-50 rounded-xl transition-all duration-200 cursor-pointer'
                  >
                    <div className='flex items-center gap-3'>
                      <div className='flex-shrink-0'>
                        <div className='relative'>
                          <Image
                            src={user.image}
                            alt={user.name}
                            width={40}
                            height={40}
                            className='w-10 h-10 rounded-full object-cover'
                          />
                          <div
                            className={`absolute -bottom-0 -right-0 w-3 h-3 ${user.isOnline ? 'bg-green-400' : 'bg-gray-400'} rounded-full border-2 border-white`}
                          ></div>
                        </div>
                      </div>

                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center justify-between mb-1'>
                          <div className='text-zinc-900 font-medium text-sm truncate'>
                            {user.name}
                          </div>
                          <div className='text-xs text-zinc-500'>
                            {user.lastMessageTime}
                          </div>
                        </div>
                        <div className='text-xs text-zinc-500 truncate'>
                          {user.lastMessage}
                        </div>
                      </div>

                      {user.unreadCount > 0 && (
                        <div className='flex-shrink-0'>
                          <div className='w-4 h-4 bg-brand-500 text-white text-xs font-bold rounded-full flex items-center justify-center'>
                            {user.unreadCount}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className='space-y-3'>
              {dummyNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`px-3 py-3 rounded-xl border transition-all duration-200 cursor-pointer ${notification.isRead ? 'bg-white border-zinc-200' : 'bg-brand-50 border-brand-200'}`}
                >
                  <div className='flex items-center gap-3'>
                    <div className='flex-shrink-0'>
                      <Image
                        src={notification.avatar}
                        alt={notification.title}
                        width={36}
                        height={36}
                        className='w-9 h-9 rounded-full object-cover'
                      />
                    </div>

                    <div className='flex-1 min-w-0'>
                      <div className='text-sm font-medium text-zinc-900 mb-1'>
                        <span className='font-semibold'>
                          {notification.title}
                        </span>{' '}
                        {notification.content}
                      </div>
                      <div className='text-xs text-zinc-500'>
                        {notification.timestamp}
                      </div>
                    </div>

                    {notification.type === 'chat_request' && (
                      <div className='flex-shrink-0 flex flex-col gap-1'>
                        <button className='px-2 py-1 bg-brand-500 text-white text-xs font-medium rounded hover:bg-brand-600 transition-colors'>
                          Accept
                        </button>
                        <button className='px-2 py-1 bg-zinc-100 text-zinc-700 text-xs font-medium rounded hover:bg-zinc-200 transition-colors'>
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
                  <div className='w-16 h-16 mx-auto mb-4 bg-zinc-100 rounded-full flex items-center justify-center'>
                    <Search className='w-8 h-8 text-zinc-500' />
                  </div>
                  <h3 className='text-lg font-medium text-zinc-900 mb-2'>
                    {searchQuery
                      ? 'No results found'
                      : 'Search for professionals'}
                  </h3>
                  <p className='text-zinc-500'>
                    {searchQuery
                      ? 'Try searching for something else'
                      : 'Enter a name, role, or skill to get started'}
                  </p>
                </div>
              ) : (
                searchResults.map(user => (
                  <div
                    key={user.id}
                    className='rounded-xl border px-3 py-3 bg-white border-zinc-200 hover:bg-zinc-50 transition-all duration-200 cursor-pointer'
                  >
                    <div className='flex items-center gap-3'>
                      <div className='flex-shrink-0'>
                        <div className='relative'>
                          <Image
                            src={user.image}
                            alt={user.name}
                            width={48}
                            height={48}
                            className='w-12 h-12 rounded-full object-cover'
                          />
                          <div
                            className={`absolute -bottom-0 -right-0 w-3 h-3 ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'} rounded-full border-2 border-white box-content`}
                          ></div>
                        </div>
                      </div>

                      <div className='flex-1 min-w-0'>
                        <div className='text-zinc-900 font-medium text-sm mb-1'>
                          {user.name}
                        </div>
                        <div className='text-xs text-zinc-600 mb-2'>
                          {user.role} at {user.company}
                        </div>
                        <div className='flex flex-wrap gap-1'>
                          {user.skills.slice(0, 2).map((skill, idx) => (
                            <span
                              key={idx}
                              className='bg-brand-50 text-brand-700 text-xs px-2 py-0.5 rounded-full font-medium'
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className='flex-shrink-0'>
                        <button className='px-3 py-2 bg-brand-500 text-white text-xs font-medium rounded-lg hover:bg-brand-600 transition-colors'>
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
