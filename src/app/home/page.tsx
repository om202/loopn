'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { MessageSquare, ArrowRight, Smile, ChevronDown } from 'lucide-react';

// Custom Connect Icon using circles from logo
const ConnectIcon = ({ className }: { className?: string }) => (
  <svg
    width='20'
    height='20'
    viewBox='30 30 160 160'
    className={className}
    fill='currentColor'
  >
    <circle cx='75' cy='110' r='35' />
    <circle cx='145' cy='110' r='35' />
  </svg>
);
import Image from 'next/image';
import Link from 'next/link';

// Optimized animations for better performance
const customStyles = `
  @keyframes slideUpFade {
    0% {
      opacity: 0;
      transform: translate3d(0, 30px, 0);
    }
    100% {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }
  
  @keyframes fadeInUp {
    0% {
      opacity: 0;
      transform: translate3d(0, 20px, 0);
    }
    100% {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }
  
  @keyframes floatUp {
    0%, 100% {
      transform: translate3d(0, 0, 0);
    }
    50% {
      transform: translate3d(0, -10px, 0);
    }
  }
  
  .animate-float {
    animation: floatUp 6s ease-in-out infinite;
    will-change: transform;
  }
  
  .animate-float-delayed {
    animation: floatUp 6s ease-in-out infinite 2s;
    will-change: transform;
  }
  
  .animate-fadeInUp {
    animation: fadeInUp 0.6s ease-out forwards;
  }
`;

export default function HomePage() {
  const { user, authStatus } = useAuthenticator(context => [
    context.user,
    context.authStatus,
  ]);

  // FAQ state management
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const isAuthenticated = authStatus === 'authenticated' && user;
  const authLink = isAuthenticated ? '/dashboard' : '/auth';
  const signUpLink = isAuthenticated ? '/dashboard' : '/auth?view=signup';
  const ctaText = isAuthenticated ? 'Go to Dashboard' : 'Join Loopn';

  // Chat animation state
  const [visibleMessages, setVisibleMessages] = useState(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat animation
  useEffect(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setVisibleMessages(prev => {
          if (prev < 5) {
            // Scroll to bottom when new message appears
            setTimeout(() => {
              if (chatContainerRef.current) {
                const container = chatContainerRef.current;
                container.scrollTo({
                  top: container.scrollHeight,
                  behavior: 'smooth',
                });
              }
            }, 150);
            return prev + 1;
          } else {
            clearInterval(interval);
            return prev;
          }
        });
      }, 1200); // Show new message every 1.2 seconds

      return () => clearInterval(interval);
    }, 300); // Start after 300ms

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className='min-h-screen bg-white'>
      {/* Add custom styles */}
      <style>{customStyles}</style>

      {/* Hero Section */}
      <section className='bg-white py-12 lg:py-16 relative overflow-hidden'>
        {/* Background Elements */}
        <div className='absolute inset-0 -z-10'>
          <div className='absolute top-20 left-10 w-72 h-72 bg-brand-50/30 rounded-full blur-3xl animate-float' />
          <div className='absolute bottom-20 right-10 w-80 h-80 bg-brand-50/50 rounded-full blur-3xl animate-float-delayed' />
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid lg:grid-cols-2 gap-8 lg:gap-12 items-center'>
            {/* Left column - Content */}
            <div className='text-center lg:text-left'>
              {/* Logo */}
              <div className='flex items-center justify-center lg:justify-start gap-3 mb-8'>
                <Image
                  src='/loopn.svg'
                  alt='Loopn'
                  width={40}
                  height={40}
                  priority
                />
                <h2 className='text-3xl font-bold text-brand-600'>Loopn</h2>
              </div>

              <h1 className='text-4xl sm:text-5xl font-semibold text-neutral-900 mt-6 sm:mt-8 mb-8 sm:mb-10 leading-tight'>
                Professional Networking,{' '}
                <span className='text-brand-600'>Simplified.</span>
              </h1>

              <h2 className='mb-8 sm:mb-10 max-w-lg mx-auto lg:mx-0'>
                <div className='text-base sm:text-lg text-neutral-700 font-semibold flex items-center justify-center lg:justify-start gap-3 flex-wrap'>
                  <span>Join Loopn</span>
                  <ArrowRight
                    className='w-5 h-5 text-neutral-700 flex-shrink-0'
                    strokeWidth={3.5}
                  />
                  <span>Get Matched</span>
                  <ArrowRight
                    className='w-5 h-5 text-neutral-700 flex-shrink-0'
                    strokeWidth={3.5}
                  />
                  <span>Start Connecting</span>
                </div>
              </h2>

              <p className='text-base sm:text-lg text-neutral-700 mb-8 sm:mb-10 max-w-lg mx-auto lg:mx-0 leading-relaxed'>
                Stop wasting time. Our AI-powered matching algorithm analyzes
                your profile to connect you with the right professionals,
                instantly.
              </p>

              {/* CTA Buttons */}
              <div className='flex flex-row gap-3 sm:gap-6 justify-center lg:justify-start'>
                <Link href={isAuthenticated ? authLink : signUpLink}>
                  <button
                    className='inline-flex items-center gap-3 bg-brand-500 text-white px-6 py-3 sm:px-10 sm:py-4 rounded-xl !font-medium min-h-[50px]'
                    style={{ fontSize: '18px' }}
                  >
                    {ctaText}
                    <ArrowRight className='w-5 h-5' strokeWidth={2.5} />
                  </button>
                </Link>
                <Link href={authLink}>
                  <button
                    className='text-neutral-700 !font-medium flex items-center justify-center px-3 py-3 sm:px-4 sm:py-4 min-h-[50px] hover:underline hover:underline-offset-4 hover:decoration-2 flex-shrink-0'
                    style={{ fontSize: '18px' }}
                  >
                    Sign In
                  </button>
                </Link>
              </div>
            </div>

            {/* Right column - Demo */}
            <div className='relative mt-8 lg:mt-0'>
              {/* Modern Chat Interface - matching real chat UI design */}
              <div className='bg-white rounded-2xl border border-neutral-200 w-full max-w-sm lg:max-w-md mx-auto lg:ml-auto lg:mr-0 overflow-hidden shadow-md'>
                {/* Chat Header */}
                <div className='flex-shrink-0 bg-white border-b border-neutral-200 px-4 py-3'>
                  <div className='flex items-center gap-3'>
                    {/* Back Button */}
                    <button
                      disabled
                      className='p-2 -ml-2 text-neutral-400 rounded-full cursor-not-allowed'
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
                          strokeWidth={2.5}
                          d='M15 19l-7-7 7-7'
                        />
                      </svg>
                    </button>

                    {/* User Info */}
                    <div className='relative'>
                      <Image
                        src='/dummy-users/dummy-user2.jpg'
                        alt='Sarah Chen'
                        width={40}
                        height={40}
                        className='w-10 h-10 rounded-full object-cover'
                      />
                      <div className='absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-b_green-400 border-2 border-white rounded-full'></div>
                    </div>

                    <div className='flex-1 min-w-0'>
                      <h1 className='text-base font-semibold text-neutral-900 truncate'>
                        Sarah Chen
                      </h1>
                      <div className='text-sm text-neutral-500 truncate'>
                        UX Designer
                      </div>
                    </div>

                    {/* Connect Button */}
                    <button className='px-2 py-2 rounded-lg text-base font-medium flex items-center justify-center gap-2 flex-shrink-0 bg-brand-500 text-white'>
                      <ConnectIcon className='w-5 h-5 text-white' />
                      <span className='text-base font-medium text-white'>
                        Connect
                      </span>
                    </button>
                  </div>
                </div>

                {/* Chat Messages */}
                <div
                  ref={chatContainerRef}
                  className='bg-white px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 h-80 overflow-y-auto relative'
                  style={{
                    scrollBehavior: 'smooth',
                    userSelect: 'none',
                  }}
                  onWheel={e => e.preventDefault()}
                  onTouchMove={e => e.preventDefault()}
                >
                  {/* Message 1 - Other user */}
                  {visibleMessages >= 1 && (
                    <div className='flex gap-3 animate-fadeInUp'>
                      <Image
                        src='/dummy-users/dummy-user2.jpg'
                        alt='Sarah'
                        width={32}
                        height={32}
                        className='w-8 h-8 rounded-full object-cover flex-shrink-0'
                      />
                      <div className='flex-1 max-w-xs'>
                        <div className='bg-neutral-100 text-neutral-900 px-4 py-3 rounded-2xl rounded-tl-md'>
                          <p className='text-base leading-relaxed'>
                            Hi! I saw you're also in UX design. Working on any
                            fintech projects?
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Message 2 - You */}
                  {visibleMessages >= 2 && (
                    <div className='flex justify-end animate-fadeInUp'>
                      <div className='max-w-xs'>
                        <div className='bg-brand-500 text-white px-4 py-3 rounded-2xl rounded-tr-md relative'>
                          <p className='text-base leading-relaxed pr-6'>
                            Yes! Just finished a banking app redesign. You?
                          </p>
                          <div className='absolute bottom-1 right-2'>
                            <Image
                              src='/double_tick.svg'
                              alt='read'
                              width={16}
                              height={16}
                              className='opacity-70 filter brightness-0 invert'
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Message 3 - Other user */}
                  {visibleMessages >= 3 && (
                    <div className='flex gap-3 animate-fadeInUp'>
                      <Image
                        src='/dummy-users/dummy-user2.jpg'
                        alt='Sarah'
                        width={32}
                        height={32}
                        className='w-8 h-8 rounded-full object-cover flex-shrink-0'
                      />
                      <div className='flex-1 max-w-xs'>
                        <div className='bg-neutral-100 text-neutral-900 px-4 py-3 rounded-2xl rounded-tl-md'>
                          <p className='text-base leading-relaxed'>
                            Perfect! I'm designing a crypto wallet. Mind if I
                            pick your brain sometime?
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Message 4 - You */}
                  {visibleMessages >= 4 && (
                    <div className='flex justify-end animate-fadeInUp'>
                      <div className='max-w-xs'>
                        <div className='bg-brand-500 text-white px-4 py-3 rounded-2xl rounded-tr-md relative'>
                          <p className='text-base leading-relaxed pr-6'>
                            Absolutely! I love discussing design challenges
                          </p>
                          <div className='absolute bottom-1 right-2'>
                            <Image
                              src='/double_tick.svg'
                              alt='delivered'
                              width={16}
                              height={16}
                              className='opacity-70 filter brightness-0 invert'
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Message 5 - Other user - Final message */}
                  {visibleMessages >= 5 && (
                    <div className='flex gap-3 animate-fadeInUp'>
                      <Image
                        src='/dummy-users/dummy-user2.jpg'
                        alt='Sarah'
                        width={32}
                        height={32}
                        className='w-8 h-8 rounded-full object-cover flex-shrink-0'
                      />
                      <div className='flex-1 max-w-xs'>
                        <div className='bg-neutral-100 text-neutral-900 px-4 py-3 rounded-2xl rounded-tl-md'>
                          <p className='text-base leading-relaxed'>
                            Awesome! I'll message you more about it tomorrow 🚀
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className='bg-white border-t border-neutral-200 p-3 sm:p-4'>
                  <div className='flex gap-3 items-end'>
                    <div className='flex-1 relative'>
                      <input
                        type='text'
                        placeholder='Type your message...'
                        readOnly
                        className='w-full px-4 py-3 pr-12 border border-neutral-200 rounded-full bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm placeholder-neutral-500 cursor-pointer'
                        style={{ fontSize: '16px' }}
                        onKeyDown={e => e.preventDefault()}
                        onKeyPress={e => e.preventDefault()}
                      />
                      <button
                        type='button'
                        className='absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 rounded-full hover:text-neutral-700 cursor-pointer'
                      >
                        <Smile className='w-5 h-5' strokeWidth={2.5} />
                      </button>
                    </div>
                    <button className='flex-shrink-0 w-12 h-12 bg-brand-500 text-white rounded-full flex items-center justify-center hover:bg-brand-600 cursor-pointer'>
                      <Image
                        src='/send_icon.svg'
                        alt='Send'
                        width={18}
                        height={18}
                        className='brightness-0 invert translate-x-0.5'
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='py-8 sm:py-12 bg-neutral-50 relative border-t border-neutral-200'>
        {/* Background decoration */}
        <div className='absolute inset-0 -z-10'>
          <div className='absolute top-1/4 left-0 w-72 h-72 bg-neutral-100/80 rounded-full blur-3xl' />
          <div className='absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-50/60 rounded-full blur-3xl' />
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Section Header */}
          <div className='text-center max-w-3xl mx-auto mb-12'>
            <h2 className='text-2xl sm:text-3xl font-semibold text-neutral-900 mb-3 leading-tight'>
              Network with Focus
            </h2>
            <p className='text-lg text-neutral-700 leading-relaxed font-medium'>
              Connect with professionals who truly matter, without the noise and
              spam of other platforms.
            </p>
          </div>

          {/* Dashboard Image */}
          <div className='flex justify-center'>
            <div className='w-full max-w-2xl lg:max-w-4xl mx-auto'>
              <Image
                src='/screen1.png'
                alt='Loopn Dashboard'
                width={600}
                height={800}
                className='w-full h-auto rounded-2xl border border-neutral-200 shadow-md'
                quality={100}
                priority
                unoptimized={true}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Message in Real Time Section */}
      <section className='py-8 sm:py-12 bg-white relative border-t border-neutral-200'>
        {/* Background decoration */}
        <div className='absolute inset-0 -z-10'>
          <div className='absolute top-1/4 left-0 w-72 h-72 bg-neutral-100/80 rounded-full blur-3xl' />
          <div className='absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-50/60 rounded-full blur-3xl' />
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Section Header */}
          <div className='text-center max-w-3xl mx-auto mb-12'>
            <h2 className='text-2xl sm:text-3xl font-semibold text-neutral-900 mb-3 leading-tight'>
              Full Messaging
            </h2>
            <p className='text-lg text-neutral-700 leading-relaxed font-medium'>
              Chat directly with your connections through seamless, real-time
              messaging.
            </p>
          </div>

          {/* Messaging Image */}
          <div className='flex justify-center'>
            <div className='w-full max-w-2xl lg:max-w-4xl mx-auto'>
              <Image
                src='/screen3.png'
                alt='Loopn Real-Time Messaging'
                width={600}
                height={800}
                className='w-full h-auto rounded-2xl border border-neutral-200 shadow-md'
                quality={100}
                priority
                unoptimized={true}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Full Resume Section */}
      <section className='py-8 sm:py-12 bg-neutral-50 relative border-t border-neutral-200'>
        {/* Background decoration */}
        <div className='absolute inset-0 -z-10'>
          <div className='absolute top-1/3 right-0 w-96 h-96 bg-brand-50/60 rounded-full blur-3xl' />
          <div className='absolute bottom-1/3 left-0 w-80 h-80 bg-neutral-100/80 rounded-full blur-3xl' />
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Section Header */}
          <div className='text-center max-w-3xl mx-auto mb-12'>
            <h2 className='text-2xl sm:text-3xl font-semibold text-neutral-900 mb-3 leading-tight'>
              Detailed Profiles
            </h2>
            <p className='text-lg text-neutral-700 leading-relaxed font-medium'>
              Make informed decisions. View the complete work history and skills
              of every professional.
            </p>
          </div>

          {/* Resume Image */}
          <div className='flex justify-center'>
            <div className='w-full max-w-lg lg:max-w-2xl mx-auto'>
              <Image
                src='/screen2.png'
                alt='Loopn Full Resume'
                width={600}
                height={800}
                className='w-full h-auto rounded-2xl border border-neutral-200 shadow-md'
                quality={100}
                priority
                unoptimized={true}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why Professionals Choose Loopn & How It Works */}
      <section
        id='how-it-works'
        className='py-8 sm:py-12 bg-white relative border-t border-neutral-200'
      >
        {/* Background decoration */}
        <div className='absolute inset-0 -z-10'>
          <div className='absolute top-1/6 left-0 w-96 h-96 bg-brand-50/60 rounded-full blur-3xl' />
          <div className='absolute bottom-1/6 right-0 w-80 h-80 bg-neutral-100/80 rounded-full blur-3xl' />
          <div className='absolute top-2/3 right-1/4 w-72 h-72 bg-brand-50/40 rounded-full blur-3xl' />
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Section Header */}
          <div className='text-center max-w-3xl mx-auto mb-12'>
            <h2 className='text-2xl sm:text-3xl font-semibold text-neutral-900 mb-3 leading-tight'>
              How It Works
            </h2>
            <p className='text-lg text-neutral-700 leading-relaxed font-medium'>
              Three powerful steps that transform how you build professional
              relationships.
            </p>
          </div>

          {/* Combined Steps */}
          <div className='grid lg:grid-cols-3 gap-8 sm:gap-12 relative'>
            {/* Step 1 - AI Resume Intelligence + Upload */}
            <div className='relative group'>
              <div className='bg-white rounded-2xl p-8 border border-neutral-200 relative h-full'>
                {/* Content */}
                <div>
                  <h3 className='text-xl font-semibold text-neutral-900 mb-3'>
                    Upload Your Resume
                  </h3>
                  <p className='text-neutral-700 mb-6 leading-relaxed text-base font-medium'>
                    Let our AI build your professional profile in seconds. We
                    instantly analyze your experience to find ideal career
                    opportunities and connections.
                  </p>
                  <ul className='space-y-3 text-left'>
                    <li className='flex items-center gap-3 text-neutral-700'>
                      <ArrowRight
                        className='w-4 h-4 text-brand-600 flex-shrink-0'
                        strokeWidth={2.5}
                      />
                      <span className='font-medium text-base'>
                        Instant Profile Analysis
                      </span>
                    </li>
                    <li className='flex items-center gap-3 text-neutral-700'>
                      <ArrowRight
                        className='w-4 h-4 text-brand-600 flex-shrink-0'
                        strokeWidth={2.5}
                      />
                      <span className='font-medium text-base'>
                        Intelligent Compatibility Matching
                      </span>
                    </li>
                    <li className='flex items-center gap-3 text-neutral-700'>
                      <ArrowRight
                        className='w-4 h-4 text-brand-600 flex-shrink-0'
                        strokeWidth={2.5}
                      />
                      <span className='font-medium text-base'>
                        Relevant Industry Connections
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 2 - Real-Time Discovery + Live Matches */}
            <div className='relative group'>
              <div className='bg-white rounded-2xl p-8 border border-neutral-200 relative h-full'>
                {/* Content */}
                <div>
                  <h3 className='text-xl font-semibold text-neutral-900 mb-3'>
                    Discover Live Matches
                  </h3>
                  <p className='text-neutral-700 mb-6 leading-relaxed text-base font-medium'>
                    See a curated list of professionals who are online right
                    now. Connect with the right people at the perfect moment.
                  </p>
                  <ul className='space-y-3 text-left'>
                    <li className='flex items-center gap-3 text-neutral-700'>
                      <ArrowRight
                        className='w-4 h-4 text-brand-600 flex-shrink-0'
                        strokeWidth={2.5}
                      />
                      <span className='font-medium text-base'>
                        View Your Personalized Live Matches
                      </span>
                    </li>
                    <li className='flex items-center gap-3 text-neutral-700'>
                      <ArrowRight
                        className='w-4 h-4 text-brand-600 flex-shrink-0'
                        strokeWidth={2.5}
                      />
                      <span className='font-medium text-base'>
                        Send Instant Connection Requests
                      </span>
                    </li>
                    <li className='flex items-center gap-3 text-neutral-700'>
                      <ArrowRight
                        className='w-4 h-4 text-brand-600 flex-shrink-0'
                        strokeWidth={2.5}
                      />
                      <span className='font-medium text-base'>
                        Chat with Professionals in Real-Time
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 3 - Professional Focus + Build Relationships */}
            <div className='relative group'>
              <div className='bg-white rounded-2xl p-8 border border-neutral-200 relative h-full'>
                {/* Content */}
                <div>
                  <h3 className='text-xl font-semibold text-neutral-900 mb-3'>
                    Build Lasting Relationships
                  </h3>
                  <p className='text-neutral-700 mb-6 leading-relaxed text-base font-medium'>
                    Focus on quality over quantity. We foster a community
                    dedicated to building meaningful, career-focused
                    relationships.
                  </p>
                  <ul className='space-y-3 text-left'>
                    <li className='flex items-center gap-3 text-neutral-700'>
                      <ArrowRight
                        className='w-4 h-4 text-brand-600 flex-shrink-0'
                        strokeWidth={2.5}
                      />
                      <span className='font-medium text-base'>
                        A Community of Vetted Professionals
                      </span>
                    </li>
                    <li className='flex items-center gap-3 text-neutral-700'>
                      <ArrowRight
                        className='w-4 h-4 text-brand-600 flex-shrink-0'
                        strokeWidth={2.5}
                      />
                      <span className='font-medium text-base'>
                        Spam-Free, Focused Conversations
                      </span>
                    </li>
                    <li className='flex items-center gap-3 text-neutral-700'>
                      <ArrowRight
                        className='w-4 h-4 text-brand-600 flex-shrink-0'
                        strokeWidth={2.5}
                      />
                      <span className='font-medium text-base'>
                        Career-Advancing Connections
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className='py-8 sm:py-12 bg-neutral-50 relative border-t border-neutral-200'>
        {/* Background decoration */}
        <div className='absolute inset-0 -z-10'>
          <div className='absolute top-1/4 right-0 w-96 h-96 bg-brand-50/40 rounded-full blur-3xl' />
          <div className='absolute bottom-1/4 left-0 w-80 h-80 bg-neutral-100/80 rounded-full blur-3xl' />
        </div>

        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-12'>
            <h2 className='text-2xl sm:text-3xl font-semibold text-neutral-900 mb-3 leading-tight'>
              Frequently Asked Questions
            </h2>
            <p className='text-lg text-neutral-700 max-w-2xl mx-auto leading-relaxed font-medium'>
              Everything you need to know about building your network on Loopn.
            </p>
          </div>

          <div className='space-y-4'>
            {/* FAQ Item 1 */}
            <div className='bg-white border border-neutral-200 rounded-2xl'>
              <button
                className='w-full text-left p-4 sm:p-5 flex items-center justify-between hover:bg-neutral-50/50 transition-colors rounded-2xl'
                onClick={() => toggleFAQ(0)}
              >
                <h3 className='text-lg font-semibold text-neutral-900 pr-4'>
                  How does Loopn work?
                </h3>
                <ChevronDown
                  className={`w-5 h-5 text-neutral-500 flex-shrink-0 transition-transform ${expandedFAQ === 0 ? 'rotate-180' : ''}`}
                />
              </button>
              {expandedFAQ === 0 && (
                <div className='px-4 sm:px-5 pb-4 sm:pb-5 -mt-1'>
                  <p className='text-neutral-700 leading-relaxed'>
                    Loopn connects you with professionals based on shared
                    interests and career goals. Simply complete your profile,
                    browse suggested connections, and start meaningful
                    conversations that can advance your career.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ Item 2 */}
            <div className='bg-white border border-neutral-200 rounded-2xl'>
              <button
                className='w-full text-left p-4 sm:p-5 flex items-center justify-between hover:bg-neutral-50/50 transition-colors rounded-2xl'
                onClick={() => toggleFAQ(1)}
              >
                <h3 className='text-lg font-semibold text-neutral-900 pr-4'>
                  Who can I connect with?
                </h3>
                <ChevronDown
                  className={`w-5 h-5 text-neutral-500 flex-shrink-0 transition-transform ${expandedFAQ === 1 ? 'rotate-180' : ''}`}
                />
              </button>
              {expandedFAQ === 1 && (
                <div className='px-4 sm:px-5 pb-4 sm:pb-5 -mt-1'>
                  <p className='text-neutral-700 leading-relaxed'>
                    All Loopn users are professionals across various industries.
                    You'll connect with people who share your interests, career
                    goals, or expertise areas - from software engineers and
                    designers to consultants and entrepreneurs.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ Item 3 */}
            <div className='bg-white border border-neutral-200 rounded-2xl'>
              <button
                className='w-full text-left p-4 sm:p-5 flex items-center justify-between hover:bg-neutral-50/50 transition-colors rounded-2xl'
                onClick={() => toggleFAQ(2)}
              >
                <h3 className='text-lg font-semibold text-neutral-900 pr-4'>
                  How do I get started?
                </h3>
                <ChevronDown
                  className={`w-5 h-5 text-neutral-500 flex-shrink-0 transition-transform ${expandedFAQ === 2 ? 'rotate-180' : ''}`}
                />
              </button>
              {expandedFAQ === 2 && (
                <div className='px-4 sm:px-5 pb-4 sm:pb-5 -mt-1'>
                  <p className='text-neutral-700 leading-relaxed'>
                    Getting started is simple: sign up, complete your
                    professional profile including your interests and career
                    goals, and we'll suggest relevant connections. You can then
                    browse profiles and send chat requests to professionals
                    you'd like to connect with.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ Item 4 */}
            <div className='bg-white border border-neutral-200 rounded-2xl'>
              <button
                className='w-full text-left p-4 sm:p-5 flex items-center justify-between hover:bg-neutral-50/50 transition-colors rounded-2xl'
                onClick={() => toggleFAQ(3)}
              >
                <h3 className='text-lg font-semibold text-neutral-900 pr-4'>
                  What makes Loopn different from other platforms?
                </h3>
                <ChevronDown
                  className={`w-5 h-5 text-neutral-500 flex-shrink-0 transition-transform ${expandedFAQ === 3 ? 'rotate-180' : ''}`}
                />
              </button>
              {expandedFAQ === 3 && (
                <div className='px-4 sm:px-5 pb-4 sm:pb-5 -mt-1'>
                  <p className='text-neutral-700 leading-relaxed'>
                    Loopn focuses exclusively on meaningful professional
                    conversations. Unlike casual social platforms, every
                    interaction is career-focused, quality-driven, and designed
                    to help you build genuine professional relationships that
                    advance your career.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className='py-8 sm:py-12 bg-white text-neutral-900 relative overflow-hidden border-t border-neutral-200'>
        {/* Background decoration */}
        <div className='absolute inset-0 -z-10'>
          <div className='absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl' />
          <div className='absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl' />
        </div>

        <div className='max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
          <h2 className='text-2xl sm:text-3xl font-semibold text-neutral-900 mb-3 leading-tight'>
            Start Building Your Network Today
          </h2>
          <p className='text-lg text-neutral-700 mb-12 max-w-md mx-auto font-medium'>
            Join thousands of professionals already making career-changing
            connections.
          </p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Link
              href={isAuthenticated ? authLink : signUpLink}
              className='w-full sm:w-auto'
            >
              <button
                className='w-full bg-brand-500 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-lg !font-medium flex items-center justify-center gap-3 border-0 min-h-[50px] touch-manipulation'
                style={{ fontSize: '18px' }}
              >
                {ctaText}
                <ArrowRight className='w-5 h-5' strokeWidth={2.5} />
              </button>
            </Link>
            <button className='w-full sm:w-auto bg-white text-neutral-700 px-6 py-3 sm:px-8 sm:py-4 rounded-lg text-base !font-medium border border-neutral-300 flex items-center justify-center gap-3 min-h-[52px] touch-manipulation'>
              <MessageSquare className='w-5 h-5' strokeWidth={2.5} />
              Watch a Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-neutral-50 py-8 border-t border-neutral-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <div className='flex items-center justify-center space-x-3 mb-4'>
              <Image src='/loopn.svg' alt='Loopn' width={32} height={32} />
              <div className='flex items-center'>
                <span className='text-xl font-medium text-neutral-900'>
                  Loopn
                </span>
              </div>
            </div>
            <p className='text-neutral-700 text-sm text-center max-w-md mx-auto mb-6 leading-relaxed font-medium'>
              AI-powered professional discovery for career-advancing
              relationships
            </p>

            {/* Footer Links */}
            <div className='flex flex-col sm:flex-row justify-center items-center gap-6 mb-6'>
              <Link
                href='/privacy'
                className='text-neutral-700 text-sm font-medium hover:underline hover:underline-offset-4 hover:decoration-2'
              >
                Privacy Policy
              </Link>
              <Link
                href='/terms'
                className='text-neutral-700 text-sm font-medium hover:underline hover:underline-offset-4 hover:decoration-2'
              >
                Terms of Service
              </Link>
            </div>

            <div className='pt-4 border-t border-neutral-200'>
              <p className='text-neutral-700 text-sm'>
                © 2025 Loopn. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
