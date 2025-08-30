'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import {
  MessageSquare,
  ArrowRight,
  CheckCircle,
  Star,
  User,
  LogIn,
  Zap,
  Brain,
  Shield,
  Smile,
} from 'lucide-react';
import DashboardDemo from '@/components/DashboardDemo';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

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
`;

export default function HomePage() {
  const { user, authStatus } = useAuthenticator(context => [
    context.user,
    context.authStatus,
  ]);

  const isAuthenticated = authStatus === 'authenticated' && user;
  const authLink = isAuthenticated ? '/dashboard' : '/auth';
  const signUpLink = isAuthenticated ? '/dashboard' : '/auth?view=signup';
  const authText = isAuthenticated ? 'Go to Dashboard' : 'Sign In';
  const ctaText = isAuthenticated ? 'Go to Dashboard' : 'Create an account';

  // Get current time for chat demo
  const getCurrentTime = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `Today at ${timeString}`;
  };

  const scrollToHowItWorks = () => {
    const element = document.getElementById('how-it-works');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <main className='min-h-screen bg-white'>
      {/* Add custom styles */}
      <style>{customStyles}</style>

      {/* Top Navigation */}
      <nav className='bg-white border-b border-slate-200 sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            <div className='flex items-center'>
              <div className='flex items-center space-x-3'>
                <Image
                  src='/loopn.svg'
                  alt='Loopn'
                  width={36}
                  height={36}
                  priority
                />
                <div className='flex items-center'>
                  <span className='text-2xl font-medium text-brand-600'>
                    Loopn
                  </span>
                </div>
              </div>
            </div>
            <div className='flex items-center'>
              <Link href={authLink}>
                <button
                  className='bg-white hover:bg-brand-50 text-brand-600 border border-gray-300 px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2 font-medium text-sm min-h-[44px]'
                >
                  <LogIn className='w-4 h-4' strokeWidth={1.5} />
                  {authText}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className='bg-white py-16 lg:py-24 relative overflow-hidden'>
        {/* Background Elements */}
        <div className='absolute inset-0 -z-10'>
          <div className='absolute top-20 left-10 w-72 h-72 bg-brand-50/30 rounded-full blur-3xl animate-float' />
          <div className='absolute bottom-20 right-10 w-80 h-80 bg-brand-50/50 rounded-full blur-3xl animate-float-delayed' />
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full'>
          <div className='grid lg:grid-cols-2 gap-16 lg:gap-24 items-center'>
            {/* Left column - Content */}
            <div className='text-center lg:text-left'>
              <h1 className='text-4xl sm:text-5xl font-medium text-gray-900 mb-6 leading-tight'>
                Connect with Professionals Who Share Your{' '}
                <span className='text-brand-600'>Goals & Expertise</span>
              </h1>

              <p className='text-xl text-gray-600 mb-12 leading-relaxed max-w-2xl'>
                Skip the noise of traditional networking. Get matched with verified professionals based on skills, interests, and career objectives — then start meaningful conversations instantly.
              </p>

              {/* CTA Buttons */}
              <div className='flex flex-col sm:flex-row gap-4 justify-center lg:justify-start'>
                <Link
                  href={isAuthenticated ? authLink : signUpLink}
                  className='w-full sm:w-auto'
                >
                  <button className='group w-full bg-brand-600 hover:bg-brand-700 text-white px-8 py-4 rounded-lg text-base font-medium transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5 border-0 min-h-[52px] touch-manipulation'>
                    {ctaText}
                    <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' strokeWidth={1.5} />
                  </button>
                </Link>
                <button
                  onClick={scrollToHowItWorks}
                  className='text-gray-600 hover:text-gray-900 text-base font-medium transition-colors flex items-center justify-center gap-2'
                >
                  See how it works
                  <ArrowRight className='w-4 h-4' strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Right column - Demo */}
            <div className='relative mt-16 lg:mt-0'>
              {/* Modern Chat Interface - matching real chat UI design */}
              <div className='bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md lg:max-w-lg mx-auto overflow-hidden'>
                {/* Chat Header */}
                <div className='flex-shrink-0 bg-white border-b border-slate-200 px-4 py-3'>
                  <div className='flex items-center gap-3'>
                    {/* Back Button */}
                    <button
                      disabled
                      className='p-2 -ml-2 text-slate-400 rounded-full transition-colors duration-200 cursor-not-allowed'
                    >
                      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
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
                      <div className='absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full'></div>
                    </div>

                    <div className='flex-1 min-w-0'>
                      <h1 className='text-base font-semibold text-black truncate'>
                        Sarah Chen
                      </h1>
                      <div className='text-sm text-slate-500 truncate'>
                        UX Designer • Online
                      </div>
                    </div>

                    {/* Connect Button */}
                    <button
                      disabled
                      className='px-4 py-2 text-sm font-medium rounded-xl bg-brand-50 text-brand-600 border border-brand-200 transition-colors disabled:cursor-not-allowed flex items-center gap-2'
                    >
                      <svg width='14' height='14' viewBox='0 0 24 24' fill='none' className='text-brand-600'>
                        <circle cx='9' cy='12' r='4' fill='currentColor'/>
                        <circle cx='15' cy='12' r='4' fill='currentColor'/>
                      </svg>
                      <span className='hidden sm:inline'>Connect</span>
                    </button>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className='bg-white px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 h-80 sm:h-96 overflow-hidden relative'>
                  {/* Date separator */}
                  <div className='flex items-center justify-center'>
                    <div className='text-xs text-slate-500 bg-slate-50 px-3 py-1 rounded-full'>
                      Today at {getCurrentTime().split(' at ')[1]}
                    </div>
                  </div>

                  {/* Message 1 - Other user */}
                  <div className='flex gap-3 opacity-0 animate-[slideUpFade_0.6s_ease-out_0.8s_forwards]'>
                    <Image
                      src='/dummy-users/dummy-user2.jpg'
                      alt='Sarah'
                      width={32}
                      height={32}
                      className='w-8 h-8 rounded-full object-cover flex-shrink-0'
                    />
                    <div className='flex-1 max-w-xs'>
                      <div className='bg-slate-100 text-slate-900 px-4 py-3 rounded-2xl rounded-tl-md'>
                        <p className='text-sm leading-relaxed'>
                          Hey! I noticed you work in fintech. I'm redesigning a banking app - any insights on building user trust?
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Message 2 - You */}
                  <div className='flex justify-end opacity-0 animate-[slideUpFade_0.6s_ease-out_1.6s_forwards]'>
                    <div className='max-w-xs'>
                      <div className='bg-brand-500 text-white px-4 py-3 rounded-2xl rounded-tr-md relative'>
                        <p className='text-sm leading-relaxed pr-6'>
                          Absolutely! Clear communication and progressive disclosure are key. Users need to understand what's happening with their money.
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

                  {/* Message 3 - Other user */}
                  <div className='flex gap-3 opacity-0 animate-[slideUpFade_0.6s_ease-out_2.4s_forwards]'>
                    <Image
                      src='/dummy-users/dummy-user2.jpg'
                      alt='Sarah'
                      width={32}
                      height={32}
                      className='w-8 h-8 rounded-full object-cover flex-shrink-0'
                    />
                    <div className='flex-1 max-w-xs'>
                      <div className='bg-slate-100 text-slate-900 px-4 py-3 rounded-2xl rounded-tl-md'>
                        <p className='text-sm leading-relaxed'>
                          That makes perfect sense! Would love to get your feedback on some wireframes I'm working on.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Message 4 - You */}
                  <div className='flex justify-end opacity-0 animate-[slideUpFade_0.6s_ease-out_3.2s_forwards]'>
                    <div className='max-w-xs'>
                      <div className='bg-brand-500 text-white px-4 py-3 rounded-2xl rounded-tr-md relative'>
                        <p className='text-sm leading-relaxed pr-6'>
                          I'd be happy to help! Send them over 🚀
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

                  {/* Typing indicator */}
                  <div className='flex gap-3 opacity-0 animate-[slideUpFade_0.6s_ease-out_4s_forwards]'>
                    <Image
                      src='/dummy-users/dummy-user2.jpg'
                      alt='Sarah'
                      width={32}
                      height={32}
                      className='w-8 h-8 rounded-full object-cover flex-shrink-0'
                    />
                    <div className='bg-slate-100 px-4 py-3 rounded-2xl rounded-tl-md'>
                      <div className='flex gap-1'>
                        <div className='w-2 h-2 bg-slate-400 rounded-full animate-pulse'></div>
                        <div className='w-2 h-2 bg-slate-400 rounded-full animate-pulse' style={{animationDelay: '0.2s'}}></div>
                        <div className='w-2 h-2 bg-slate-400 rounded-full animate-pulse' style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message Input */}
                <div className='bg-white border-t border-slate-200 p-3 sm:p-4'>
                  <div className='flex gap-3 items-end'>
                    <div className='flex-1 relative'>
                      <input
                        type='text'
                        placeholder='Type your message...'
                        disabled
                        className='w-full px-4 py-3 pr-12 border border-slate-200 rounded-full bg-slate-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 placeholder-slate-500'
                        style={{ fontSize: '16px' }}
                      />
                      <button
                        type='button'
                        disabled
                        className='absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors disabled:cursor-not-allowed'
                      >
                        <Smile className='w-5 h-5' />
                      </button>
                    </div>
                    <button
                      disabled
                      className='flex-shrink-0 w-12 h-12 bg-brand-500 hover:bg-brand-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60'
                    >
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
      <section className='py-16 sm:py-24 bg-white relative'>
        {/* Background decoration */}
        <div className='absolute inset-0 -z-10'>
          <div className='absolute top-1/4 left-0 w-72 h-72 bg-slate-100/80 rounded-full blur-3xl' />
          <div className='absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-50/60 rounded-full blur-3xl' />
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Section Header */}
          <div className='text-center max-w-4xl mx-auto mb-20'>
            <h2 className='text-3xl sm:text-4xl font-medium text-gray-900 mb-6 leading-tight'>
              Professional Networking, Reimagined
            </h2>
            <p className='text-lg text-gray-600 leading-relaxed'>
              Move beyond surface-level connections. Our AI matches you with professionals who complement your skills and align with your career goals, enabling deeper, more valuable relationships.
            </p>
          </div>

          <DashboardDemo />

          {/* Features Grid */}
          <div className='grid lg:grid-cols-3 gap-8 sm:gap-12 mb-20 mt-20'>
            {/* Feature 1 - Smart Matching */}
            <div className='group bg-white rounded-2xl p-8 border border-slate-200 h-full shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1'>
              <h3 className='text-xl font-semibold text-slate-900 mb-6 flex items-center gap-3'>
                <Brain className='w-6 h-6 text-brand-600' />
                Smart AI Matching
              </h3>
              <p className='text-slate-600 mb-8 leading-relaxed text-base'>
                Meet professionals who complement your skills and align with
                your goals.
              </p>
              <ul className='space-y-4'>
                <li className='flex items-center gap-3 text-slate-600'>
                  <CheckCircle className='w-4 h-4 text-brand-600 flex-shrink-0' />
                  <span className='font-normal text-sm'>
                    AI-powered matching
                  </span>
                </li>
                <li className='flex items-center gap-3 text-slate-600'>
                  <CheckCircle className='w-4 h-4 text-brand-600 flex-shrink-0' />
                  <span className='font-normal text-sm'>
                    Industry-focused connections
                  </span>
                </li>
                <li className='flex items-center gap-3 text-slate-600'>
                  <CheckCircle className='w-4 h-4 text-brand-600 flex-shrink-0' />
                  <span className='font-normal text-sm'>
                    Goal-based alignment
                  </span>
                </li>
              </ul>
            </div>

            {/* Feature 2 - Real-time Chat */}
            <div className='group bg-white rounded-2xl p-8 border border-slate-200 h-full shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1'>
              <h3 className='text-xl font-semibold text-slate-900 mb-6 flex items-center gap-3'>
                <Zap className='w-6 h-6 text-brand-600' />
                Instant Connections
              </h3>
              <p className='text-slate-600 mb-8 leading-relaxed text-base'>
                Start meaningful conversations the moment you match — no delays,
                no barriers.
              </p>
              <ul className='space-y-4'>
                <li className='flex items-center gap-3 text-slate-600'>
                  <CheckCircle className='w-4 h-4 text-brand-600 flex-shrink-0' />
                  <span className='font-normal text-sm'>
                    Real-time messaging
                  </span>
                </li>
                <li className='flex items-center gap-3 text-slate-600'>
                  <CheckCircle className='w-4 h-4 text-brand-600 flex-shrink-0' />
                  <span className='font-normal text-sm'>
                    Professional conversation starters
                  </span>
                </li>
                <li className='flex items-center gap-3 text-slate-600'>
                  <CheckCircle className='w-4 h-4 text-brand-600 flex-shrink-0' />
                  <span className='font-normal text-sm'>
                    Smooth, seamless experience
                  </span>
                </li>
              </ul>
            </div>

            {/* Feature 3 - Quality Network */}
            <div className='group bg-white rounded-2xl p-8 border border-slate-200 h-full shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1'>
              <h3 className='text-xl font-semibold text-slate-900 mb-6 flex items-center gap-3'>
                <Shield className='w-6 h-6 text-brand-600' />
                Quality & Privacy
              </h3>
              <p className='text-slate-600 mb-8 leading-relaxed text-base'>
                Network with verified professionals in a safe, focused space.
              </p>
              <ul className='space-y-4'>
                <li className='flex items-center gap-3 text-slate-600'>
                  <CheckCircle className='w-4 h-4 text-brand-600 flex-shrink-0' />
                  <span className='font-normal text-sm'>
                    Verified members only
                  </span>
                </li>
                <li className='flex items-center gap-3 text-slate-600'>
                  <CheckCircle className='w-4 h-4 text-brand-600 flex-shrink-0' />
                  <span className='font-normal text-sm'>
                    Privacy-first design
                  </span>
                </li>
                <li className='flex items-center gap-3 text-slate-600'>
                  <CheckCircle className='w-4 h-4 text-brand-600 flex-shrink-0' />
                  <span className='font-normal text-sm'>
                    Quality over quantity
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className='text-center'>
            <Link href={isAuthenticated ? authLink : signUpLink}>
              <button className='group inline-flex items-center gap-3 bg-brand-500 hover:bg-brand-600 text-white px-10 py-4 rounded-xl text-base font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 border border-brand-600 min-h-[48px]'>
                {ctaText}
                <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id='how-it-works' className='py-16 sm:py-24 bg-white relative'>
        {/* Background decoration */}
        <div className='absolute inset-0 -z-10'>
          <div className='absolute top-1/3 right-0 w-96 h-96 bg-brand-50/60 rounded-full blur-3xl' />
          <div className='absolute bottom-1/3 left-0 w-80 h-80 bg-slate-100/80 rounded-full blur-3xl' />
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Section Header */}
          <div className='text-center max-w-4xl mx-auto mb-20'>
            <h2 className='text-3xl sm:text-4xl font-medium text-gray-900 mb-6 leading-tight'>
              How It Works
            </h2>
            <p className='text-lg text-gray-600 leading-relaxed'>
              Getting started with Loopn is quick and effortless.
            </p>
          </div>

          {/* Steps */}
          <div className='grid lg:grid-cols-3 gap-8 sm:gap-12 relative'>
            {/* Step 1 */}
            <div className='relative group'>
              <div className='bg-white rounded-2xl p-8 border border-slate-200 relative h-full shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1'>
                {/* Step number */}
                <div className='absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 border-1 border-brand-200 bg-white rounded-2xl flex items-center justify-center text-brand-600 font-bold text-lg z-20'>
                  1
                </div>
                {/* Content */}
                <div className='text-center mt-6'>
                  <h3 className='text-xl font-semibold text-slate-900 mb-6 flex items-center justify-center gap-3'>
                    <User className='w-6 h-6 text-brand-600' />
                    Create Your Profile
                  </h3>
                  <p className='text-slate-600 leading-relaxed text-base'>
                    Showcase your expertise, goals, and what you're looking for
                    — so the right people can find you.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className='relative group'>
              <div className='bg-white rounded-2xl p-8 border border-slate-200 relative h-full shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1'>
                {/* Step number */}
                <div className='absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 border-1 border-brand-200 bg-white rounded-2xl flex items-center justify-center text-brand-600 font-bold text-lg z-20'>
                  2
                </div>
                {/* Content */}
                <div className='text-center mt-6'>
                  <h3 className='text-xl font-semibold text-slate-900 mb-6 flex items-center justify-center gap-3'>
                    <Brain className='w-6 h-6 text-brand-600' />
                    Get Smart Matches
                  </h3>
                  <p className='text-slate-600 leading-relaxed text-base'>
                    Our AI connects you with professionals who share your
                    interests and complement your skills.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className='relative group'>
              <div className='bg-white rounded-2xl p-8 border border-slate-200 relative h-full shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1'>
                {/* Step number */}
                <div className='absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 border-1 border-brand-200 bg-white rounded-2xl flex items-center justify-center text-brand-600 font-bold text-lg z-20'>
                  3
                </div>
                {/* Content */}
                <div className='text-center mt-6'>
                  <h3 className='text-xl font-semibold text-slate-900 mb-6 flex items-center justify-center gap-3'>
                    <MessageSquare className='w-6 h-6 text-brand-600' />
                    Start Connecting
                  </h3>
                  <p className='text-slate-600 leading-relaxed text-base'>
                    Engage in real conversations, grow your network, and build
                    relationships that last.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className='py-16 sm:py-24 bg-white relative'>
        {/* Background decoration */}
        <div className='absolute inset-0 -z-10'>
          <div className='absolute top-1/4 right-0 w-96 h-96 bg-brand-50/40 rounded-full blur-3xl' />
          <div className='absolute bottom-1/4 left-0 w-80 h-80 bg-slate-100/80 rounded-full blur-3xl' />
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-20'>
            <h2 className='text-3xl sm:text-4xl font-medium text-gray-900 mb-6 leading-tight'>
              What Professionals Say
            </h2>
            <p className='text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed'>
              Loopn is built for those who value authentic networking and
              meaningful connections.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12'>
            {/* Testimonial 1 */}
            <div className='group bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col h-full'>
              <div className='flex items-center gap-1 mb-8'>
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={`testimonial-1-star-${star}`}
                    className='w-5 h-5 text-b_yellow-400 fill-current'
                  />
                ))}
              </div>
              <blockquote className='text-slate-700 mb-6 text-base leading-relaxed font-normal flex-grow'>
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
                  <p className='font-semibold text-slate-900 text-sm'>Sarah Johnson</p>
                  <p className='text-slate-600 text-sm'>
                    Software Engineer, Tech Startup
                  </p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className='group bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col h-full'>
              <div className='flex items-center gap-1 mb-8'>
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={`testimonial-2-star-${star}`}
                    className='w-5 h-5 text-b_yellow-400 fill-current'
                  />
                ))}
              </div>
              <blockquote className='text-slate-700 mb-6 text-base leading-relaxed font-normal flex-grow'>
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
                  <p className='font-semibold text-slate-900 text-sm'>Michael Chen</p>
                  <p className='text-slate-600 text-sm'>
                    Product Manager, E-commerce
                  </p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className='group bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 md:col-span-2 lg:col-span-1 flex flex-col h-full'>
              <div className='flex items-center gap-1 mb-8'>
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={`testimonial-3-star-${star}`}
                    className='w-5 h-5 text-b_yellow-400 fill-current'
                  />
                ))}
              </div>
              <blockquote className='text-slate-700 mb-6 text-base leading-relaxed font-normal flex-grow'>
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
          <div className='mt-20 text-center'>
            <h3 className='text-2xl font-semibold text-slate-900 mb-6'>
              Built for Professionals in Every Field
            </h3>
            <p className='text-slate-600 mb-12 text-base'>
              From startups to global enterprises, Loopn connects experts across
              industries.
            </p>
            <div className='flex flex-wrap justify-center items-center gap-8 opacity-70'>
              <div className='text-slate-600 font-medium text-sm'>
                Technology
              </div>
              <div className='text-slate-600 font-medium text-sm'>
                Finance
              </div>
              <div className='text-slate-600 font-medium text-sm'>
                Design
              </div>
              <div className='text-slate-600 font-medium text-sm'>
                Marketing
              </div>
              <div className='text-slate-600 font-medium text-sm'>
                Healthcare
              </div>
              <div className='text-slate-600 font-medium text-sm'>
                Consulting
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className='py-16 sm:py-24 bg-white text-black relative overflow-hidden'>
        {/* Background decoration */}
        <div className='absolute inset-0 -z-10'>
          <div className='absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl' />
          <div className='absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl' />
        </div>

        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
          <h2 className='text-3xl sm:text-4xl font-medium text-gray-900 mb-6 leading-tight'>
            Start Building Your Professional Network
          </h2>
          <p className='text-lg text-gray-600 mb-12 max-w-2xl mx-auto'>
            Join thousands of verified professionals already connecting, collaborating, and advancing their careers through meaningful relationships.
          </p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Link
              href={isAuthenticated ? authLink : signUpLink}
              className='w-full sm:w-auto'
            >
              <button className='group w-full bg-brand-600 hover:bg-brand-700 text-white px-8 py-4 rounded-lg text-base font-medium transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl border-0 min-h-[52px] touch-manipulation'>
                {ctaText}
                <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' strokeWidth={1.5} />
              </button>
            </Link>
            <button className='w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-600 px-8 py-4 rounded-lg text-base font-medium border border-gray-300 transition-all duration-300 flex items-center justify-center gap-3 min-h-[52px] touch-manipulation'>
              <MessageSquare className='w-5 h-5' strokeWidth={1.5} />
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-white py-8 border-t border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <div className='flex items-center justify-center space-x-3 mb-4'>
              <Image src='/loopn.svg' alt='Loopn' width={32} height={32} />
              <div className='flex items-center'>
                <span className='text-xl font-medium text-gray-900'>Loopn</span>
              </div>
            </div>
            <p className='text-gray-600 text-sm text-center max-w-2xl mx-auto mb-6 leading-relaxed'>
              Build meaningful connections through smart matching
            </p>

            {/* Footer Links */}
            <div className='flex flex-col sm:flex-row justify-center items-center gap-6 mb-6'>
              <a
                href='#'
                className='text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium'
              >
                Privacy Policy
              </a>
              <a
                href='#'
                className='text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium'
              >
                Terms of Service
              </a>
              <a
                href='#'
                className='text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium'
              >
                Contact Us
              </a>
              <a
                href='#'
                className='text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium'
              >
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
