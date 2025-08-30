'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import {
  MessageSquare,
  ArrowRight,
  CheckCircle,
  Star,
  Zap,
  Brain,
  Shield,
  Smile,
  CloudUpload,
} from 'lucide-react';

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
import React, { useState, useEffect, useRef } from 'react';

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
      <section className='bg-white py-8 lg:py-12 relative overflow-hidden'>
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
                  width={48}
                  height={48}
                  priority
                />
                <h2 className='text-3xl font-bold text-brand-600'>Loopn</h2>
              </div>

              <h1 className='text-4xl sm:text-5xl font-semibold text-gray-900 mb-8 sm:mb-14 leading-tight'>
                Professional Networking{' '}
                <span className='text-brand-600'>That Actually Matters</span>
              </h1>

              <div className='mb-6 sm:mb-12 max-w-lg mx-auto lg:mx-0'>
                <p className='text-lg sm:text-xl text-gray-600 leading-relaxed font-medium'>
                  Upload your resume. Get matched instantly. Start connecting
                  with professionals who complement your skills and career
                  goals.
                </p>
              </div>

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
                    className='text-gray-600 !font-medium flex items-center justify-center px-3 py-3 sm:px-4 sm:py-4 min-h-[50px] hover:underline hover:underline-offset-4 hover:decoration-2 flex-shrink-0'
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
              <div className='bg-white rounded-2xl shadow-sm border border-slate-200 w-full max-w-sm lg:max-w-md mx-auto lg:ml-auto lg:mr-0 overflow-hidden'>
                {/* Chat Header */}
                <div className='flex-shrink-0 bg-white border-b border-slate-200 px-4 py-3'>
                  <div className='flex items-center gap-3'>
                    {/* Back Button */}
                    <button
                      disabled
                      className='p-2 -ml-2 text-slate-400 rounded-full cursor-not-allowed'
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
                      <h1 className='text-base font-semibold text-black truncate'>
                        Sarah Chen
                      </h1>
                      <div className='text-sm text-slate-500 truncate'>
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
                        <div className='bg-slate-100 text-slate-900 px-4 py-3 rounded-2xl rounded-tl-md'>
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
                        <div className='bg-slate-100 text-slate-900 px-4 py-3 rounded-2xl rounded-tl-md'>
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
                        <div className='bg-slate-100 text-slate-900 px-4 py-3 rounded-2xl rounded-tl-md'>
                          <p className='text-base leading-relaxed'>
                            Awesome! I'll message you more about it tomorrow 🚀
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className='bg-white border-t border-slate-200 p-3 sm:p-4'>
                  <div className='flex gap-3 items-end'>
                    <div className='flex-1 relative'>
                      <input
                        type='text'
                        placeholder='Type your message...'
                        readOnly
                        className='w-full px-4 py-3 pr-12 border border-slate-200 rounded-full bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm placeholder-slate-500 cursor-pointer'
                        style={{ fontSize: '16px' }}
                        onKeyDown={e => e.preventDefault()}
                        onKeyPress={e => e.preventDefault()}
                      />
                      <button
                        type='button'
                        className='absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 rounded-full hover:text-slate-600 cursor-pointer'
                      >
                        <Smile className='w-5 h-5' strokeWidth={2.5} />
                      </button>
                    </div>
                    <button className='flex-shrink-0 w-12 h-12 bg-brand-500 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-brand-600 cursor-pointer'>
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
      <section className='py-8 sm:py-12 bg-slate-50 relative'>
        {/* Background decoration */}
        <div className='absolute inset-0 -z-10'>
          <div className='absolute top-1/4 left-0 w-72 h-72 bg-slate-100/80 rounded-full blur-3xl' />
          <div className='absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-50/60 rounded-full blur-3xl' />
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Section Header */}
          <div className='text-center max-w-3xl mx-auto mb-12'>
            <h2 className='text-3xl sm:text-4xl font-semibold text-gray-900 mb-3 leading-tight'>
              Professional Networking, Reimagined
            </h2>
            <p className='text-lg text-gray-600 leading-relaxed font-medium'>
              Connect with professionals who actually matter to your
              career.
            </p>
          </div>

          {/* Dashboard Images - Responsive */}
          <div className='flex justify-center'>
            {/* Desktop Dashboard Image */}
            <div className='hidden lg:block w-full max-w-5xl'>
              <Image
                src='/desktop-dash.webp'
                alt='Loopn Dashboard - Desktop View'
                width={1200}
                height={900}
                className='w-full h-auto rounded-2xl shadow-sm border border-slate-200'
                quality={100}
                priority
                unoptimized={true}
              />
            </div>

            {/* Mobile Dashboard Image */}
            <div className='block lg:hidden w-full max-w-sm mx-auto'>
              <Image
                src='/mobile-dash.webp'
                alt='Loopn Dashboard - Mobile View'
                width={450}
                height={900}
                className='w-full h-auto rounded-2xl shadow-sm border border-slate-200'
                quality={100}
                priority
                unoptimized={true}
              />
            </div>
          </div>

          {/* Features Grid */}
          <div className='grid lg:grid-cols-3 gap-8 sm:gap-12 mb-12 mt-12'>
            {/* Feature 1 - Smart Matching */}
            <div className=' bg-white rounded-2xl p-8 border border-slate-200 h-full shadow-sm'>
              <h3 className='text-xl font-semibold text-slate-900 mb-3 flex items-center gap-3'>
                <Brain className='w-6 h-6 text-brand-600' strokeWidth={2.5} />
                AI Resume Intelligence
              </h3>
              <p className='text-slate-600 mb-8 leading-relaxed text-base font-medium'>
                Upload once. Get matched to perfect career opportunities
                instantly.
              </p>
              <ul className='space-y-4'>
                <li className='flex items-center gap-3 text-slate-600'>
                  <CheckCircle
                    className='w-4 h-4 text-brand-600 flex-shrink-0'
                    strokeWidth={2.5}
                  />
                  <span className='font-medium text-base'>
                    AI analyzes your resume in seconds
                  </span>
                </li>
                <li className='flex items-center gap-3 text-slate-600'>
                  <CheckCircle
                    className='w-4 h-4 text-brand-600 flex-shrink-0'
                    strokeWidth={2.5}
                  />
                  <span className='font-medium text-base'>
                    Smart compatibility matching
                  </span>
                </li>
                <li className='flex items-center gap-3 text-slate-600'>
                  <CheckCircle
                    className='w-4 h-4 text-brand-600 flex-shrink-0'
                    strokeWidth={2.5}
                  />
                  <span className='font-medium text-base'>
                    Industry-specific results
                  </span>
                </li>
              </ul>
            </div>

            {/* Feature 2 - Real-time Chat */}
            <div className=' bg-white rounded-2xl p-8 border border-slate-200 h-full shadow-sm'>
              <h3 className='text-xl font-semibold text-slate-900 mb-3 flex items-center gap-3'>
                <Zap className='w-6 h-6 text-brand-600' strokeWidth={2.5} />
                Real-Time Discovery
              </h3>
              <p className='text-slate-600 mb-8 leading-relaxed text-base font-medium'>
                Connect with the right people at the right moment.
              </p>
              <ul className='space-y-4'>
                <li className='flex items-center gap-3 text-slate-600'>
                  <CheckCircle
                    className='w-4 h-4 text-brand-600 flex-shrink-0'
                    strokeWidth={2.5}
                  />
                  <span className='font-medium text-base'>
                    See who's online now
                  </span>
                </li>
                <li className='flex items-center gap-3 text-slate-600'>
                  <CheckCircle
                    className='w-4 h-4 text-brand-600 flex-shrink-0'
                    strokeWidth={2.5}
                  />
                  <span className='font-medium text-base'>
                    Send instant chat requests
                  </span>
                </li>
                <li className='flex items-center gap-3 text-slate-600'>
                  <CheckCircle
                    className='w-4 h-4 text-brand-600 flex-shrink-0'
                    strokeWidth={2.5}
                  />
                  <span className='font-medium text-base'>
                    Build permanent relationships
                  </span>
                </li>
              </ul>
            </div>

            {/* Feature 3 - Quality Network */}
            <div className=' bg-white rounded-2xl p-8 border border-slate-200 h-full shadow-sm'>
              <h3 className='text-xl font-semibold text-slate-900 mb-3 flex items-center gap-3'>
                <Shield className='w-6 h-6 text-brand-600' strokeWidth={2.5} />
                Professional Focus
              </h3>
              <p className='text-slate-600 mb-8 leading-relaxed text-base font-medium'>
                Quality over quantity. Every connection is verified, relevant,
                and career-focused.
              </p>
              <ul className='space-y-4'>
                <li className='flex items-center gap-3 text-slate-600'>
                  <CheckCircle
                    className='w-4 h-4 text-brand-600 flex-shrink-0'
                    strokeWidth={2.5}
                  />
                  <span className='font-medium text-base'>
                    Verified professionals only
                  </span>
                </li>
                <li className='flex items-center gap-3 text-slate-600'>
                  <CheckCircle
                    className='w-4 h-4 text-brand-600 flex-shrink-0'
                    strokeWidth={2.5}
                  />
                  <span className='font-medium text-base'>
                    No spam or casual chat
                  </span>
                </li>
                <li className='flex items-center gap-3 text-slate-600'>
                  <CheckCircle
                    className='w-4 h-4 text-brand-600 flex-shrink-0'
                    strokeWidth={2.5}
                  />
                  <span className='font-medium text-base'>
                    Career-advancing focus
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className='text-center'>
            <Link href={isAuthenticated ? authLink : signUpLink}>
              <button
                className='inline-flex items-center gap-3 bg-brand-500 text-white px-6 py-3 sm:px-10 sm:py-4 rounded-xl !font-medium min-h-[50px]'
                style={{ fontSize: '18px' }}
              >
                {ctaText}
                <ArrowRight className='w-5 h-5' strokeWidth={2.5} />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id='how-it-works' className='py-8 sm:py-12 bg-white relative'>
        {/* Background decoration */}
        <div className='absolute inset-0 -z-10'>
          <div className='absolute top-1/3 right-0 w-96 h-96 bg-brand-50/60 rounded-full blur-3xl' />
          <div className='absolute bottom-1/3 left-0 w-80 h-80 bg-slate-100/80 rounded-full blur-3xl' />
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Section Header */}
          <div className='text-center max-w-3xl mx-auto mb-12'>
            <h2 className='text-3xl sm:text-4xl font-semibold text-gray-900 mb-3 leading-tight'>
              How It Works
            </h2>
            <p className='text-lg text-gray-600 leading-relaxed font-medium'>
              Getting started with Loopn is quick and effortless.
            </p>
          </div>

          {/* Steps */}
          <div className='grid lg:grid-cols-3 gap-8 sm:gap-12 relative'>
            {/* Step 1 */}
            <div className='relative group'>
              <div className='bg-white rounded-2xl p-8 border border-slate-200 relative h-full shadow-sm'>
                {/* Step number */}
                <div className='absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 border-1 border-brand-200 bg-white rounded-2xl flex items-center justify-center text-brand-600 font-bold text-lg z-20'>
                  1
                </div>
                {/* Content */}
                <div className='text-center mt-6'>
                  <h3 className='text-xl font-semibold text-slate-900 mb-3 flex items-center justify-center gap-3'>
                    <CloudUpload
                      className='w-6 h-6 text-brand-600'
                      strokeWidth={2.5}
                    />
                    Upload Your Resume
                  </h3>
                  <p className='text-slate-600 leading-relaxed text-base font-medium'>
                    Drop your resume. AI builds your profile in seconds.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className='relative group'>
              <div className='bg-white rounded-2xl p-8 border border-slate-200 relative h-full shadow-sm'>
                {/* Step number */}
                <div className='absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 border-1 border-brand-200 bg-white rounded-2xl flex items-center justify-center text-brand-600 font-bold text-lg z-20'>
                  2
                </div>
                {/* Content */}
                <div className='text-center mt-6'>
                  <h3 className='text-xl font-semibold text-slate-900 mb-3 flex items-center justify-center gap-3'>
                    <Brain
                      className='w-6 h-6 text-brand-600'
                      strokeWidth={2.5}
                    />
                    Discover Live Matches
                  </h3>
                  <p className='text-slate-600 leading-relaxed text-base font-medium'>
                    See perfect matches online right now. Connect instantly.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className='relative group'>
              <div className='bg-white rounded-2xl p-8 border border-slate-200 relative h-full shadow-sm'>
                {/* Step number */}
                <div className='absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 border-1 border-brand-200 bg-white rounded-2xl flex items-center justify-center text-brand-600 font-bold text-lg z-20'>
                  3
                </div>
                {/* Content */}
                <div className='text-center mt-6'>
                  <h3 className='text-xl font-semibold text-slate-900 mb-3 flex items-center justify-center gap-3'>
                    <MessageSquare
                      className='w-6 h-6 text-brand-600'
                      strokeWidth={2.5}
                    />
                    Build Lasting Relationships
                  </h3>
                  <p className='text-slate-600 leading-relaxed text-base font-medium'>
                    Send requests. Start conversations. Build lasting
                    professional relationships.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className='py-8 sm:py-12 bg-slate-50 relative'>
        {/* Background decoration */}
        <div className='absolute inset-0 -z-10'>
          <div className='absolute top-1/4 right-0 w-96 h-96 bg-brand-50/40 rounded-full blur-3xl' />
          <div className='absolute bottom-1/4 left-0 w-80 h-80 bg-slate-100/80 rounded-full blur-3xl' />
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl sm:text-4xl font-semibold text-gray-900 mb-3 leading-tight'>
              What Professionals Say
            </h2>
            <p className='text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed font-medium'>
              Real professionals. Real results. Real career growth.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12'>
            {/* Testimonial 1 */}
            <div className=' bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col h-full'>
              <div className='flex items-center gap-1 mb-8'>
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={`testimonial-1-star-${star}`}
                    className='w-5 h-5 text-b_yellow-400 fill-current'
                  />
                ))}
              </div>
              <blockquote className='text-slate-700 mb-6 text-base leading-relaxed font-medium flex-grow'>
                &quot;Loopn made networking feel natural again. I&apos;ve built
                genuine relationships through honest conversations about shared
                interests.&quot;
              </blockquote>
              <div className='flex items-center gap-4 mt-auto'>
                <Image
                  src='/dummy-users/dummy-user2.jpg'
                  alt='Sarah Johnson'
                  width={48}
                  height={48}
                  className='w-12 h-12 rounded-full object-cover'
                />
                <div>
                  <p className='font-semibold text-slate-900 text-sm'>
                    Sarah Johnson
                  </p>
                  <p className='text-slate-600 text-sm'>
                    Software Engineer, Tech Startup
                  </p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className=' bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col h-full'>
              <div className='flex items-center gap-1 mb-8'>
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={`testimonial-2-star-${star}`}
                    className='w-5 h-5 text-b_yellow-400 fill-current'
                  />
                ))}
              </div>
              <blockquote className='text-slate-700 mb-6 text-base leading-relaxed font-medium flex-grow'>
                &quot;The smart matching is brilliant. I found a mentor through
                meaningful conversations who&apos;s now a key connection in my
                career.&quot;
              </blockquote>
              <div className='flex items-center gap-4 mt-auto'>
                <Image
                  src='/dummy-users/dummy-user3.jpg'
                  alt='Michael Chen'
                  width={48}
                  height={48}
                  className='w-12 h-12 rounded-full object-cover'
                />
                <div>
                  <p className='font-semibold text-slate-900 text-sm'>
                    Michael Chen
                  </p>
                  <p className='text-slate-600 text-sm'>
                    Product Manager, E-commerce
                  </p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className=' bg-white border border-slate-200 rounded-2xl p-8 shadow-sm md:col-span-2 lg:col-span-1 flex flex-col h-full'>
              <div className='flex items-center gap-1 mb-8'>
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={`testimonial-3-star-${star}`}
                    className='w-5 h-5 text-b_yellow-400 fill-current'
                  />
                ))}
              </div>
              <blockquote className='text-slate-700 mb-6 text-base leading-relaxed font-medium flex-grow'>
                &quot;Finally, a platform where expertise matters more than
                titles. Every conversation feels purposeful and
                growth-oriented.&quot;
              </blockquote>
              <div className='flex items-center gap-4 mt-auto'>
                <Image
                  src='/dummy-users/dummy-user4.jpg'
                  alt='Emily Rodriguez'
                  width={48}
                  height={48}
                  className='w-12 h-12 rounded-full object-cover'
                />
                <div>
                  <p className='font-semibold text-slate-900 text-sm'>
                    Emily Rodriguez
                  </p>
                  <p className='text-slate-600 text-sm'>
                    UX Designer, Design Agency
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className='mt-8 text-center'>
            <h3 className='text-2xl font-bold text-slate-900 mb-3'>
              Every Industry. Every Career Level.
            </h3>
            <p className='text-slate-600 mb-12 text-base font-medium'>
              Join professionals across all industries making career-changing
              connections.
            </p>
            <div className='flex flex-wrap justify-center items-center gap-8 opacity-70'>
              <div className='text-slate-600 font-medium text-lg'>
                Technology
              </div>
              <div className='text-slate-600 font-medium text-lg'>Finance</div>
              <div className='text-slate-600 font-medium text-lg'>Design</div>
              <div className='text-slate-600 font-medium text-lg'>
                Marketing
              </div>
              <div className='text-slate-600 font-medium text-lg'>
                Healthcare
              </div>
              <div className='text-slate-600 font-medium text-lg'>
                Consulting
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className='py-8 sm:py-12 bg-white text-black relative overflow-hidden'>
        {/* Background decoration */}
        <div className='absolute inset-0 -z-10'>
          <div className='absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl' />
          <div className='absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl' />
        </div>

        <div className='max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
          <h2 className='text-3xl sm:text-4xl font-semibold text-gray-900 mb-3 leading-tight'>
            Start Connecting Today
          </h2>
          <p className='text-lg text-gray-600 mb-12 max-w-md mx-auto font-medium'>
            Join thousands of professionals already building career-changing
            relationships.
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
            <button className='w-full sm:w-auto bg-white text-gray-600 px-6 py-3 sm:px-8 sm:py-4 rounded-lg text-base !font-medium border border-gray-300 flex items-center justify-center gap-3 min-h-[52px] touch-manipulation'>
              <MessageSquare className='w-5 h-5' strokeWidth={2.5} />
              See It In Action
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-slate-50 py-8 border-t border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <div className='flex items-center justify-center space-x-3 mb-4'>
              <Image src='/loopn.svg' alt='Loopn' width={32} height={32} />
              <div className='flex items-center'>
                <span className='text-xl font-medium text-gray-900'>Loopn</span>
              </div>
            </div>
            <p className='text-gray-600 text-sm text-center max-w-md mx-auto mb-6 leading-relaxed font-medium'>
              AI-powered professional discovery for career-advancing
              relationships
            </p>

            {/* Footer Links */}
            <div className='flex flex-col sm:flex-row justify-center items-center gap-6 mb-6'>
              <a href='#' className='text-gray-600 text-sm font-medium hover:underline hover:underline-offset-4 hover:decoration-2'>
                Privacy Policy
              </a>
              <a href='#' className='text-gray-600 text-sm font-medium hover:underline hover:underline-offset-4 hover:decoration-2'>
                Terms of Service
              </a>
              <a href='#' className='text-gray-600 text-sm font-medium hover:underline hover:underline-offset-4 hover:decoration-2'>
                Contact Us
              </a>
              <a href='#' className='text-gray-600 text-sm font-medium hover:underline hover:underline-offset-4 hover:decoration-2'>
                Help Center
              </a>
            </div>

            <div className='pt-4 border-t border-gray-200'>
              <p className='text-gray-600 text-sm'>
                © 2025 Loopn. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
