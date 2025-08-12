'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import {
  MessageCircle,
  ArrowRight,
  CheckCircle,
  Star,
  User,
  LogIn,
  Zap,
  Users,
  Brain,
  Shield,
  Clock,
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
  const authText = isAuthenticated ? 'Go to Dashboard' : 'Sign In';
  const ctaText = isAuthenticated ? 'Go to Dashboard' : 'Join Loopn';

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
      <nav className='bg-white border-b border-zinc-200 sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            <div className='flex items-center'>
              <div className='flex items-center space-x-2'>
                <Image
                  src='/loopn.svg'
                  alt='Loopn'
                  width={32}
                  height={32}
                  priority
                />
                <span className='text-xl font-bold text-zinc-900'>Loopn</span>
              </div>
            </div>
            <div className='flex items-center'>
              <Link href={authLink}>
                <button className='bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2'>
                  <LogIn className='w-4 h-4' />
                  {authText}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className='bg-zinc-100 py-16 lg:py-24 relative overflow-hidden'>
        {/* Background Elements */}
        <div className='absolute inset-0 -z-10'>
          <div className='absolute top-20 left-10 w-72 h-72 bg-brand-100/30 rounded-full blur-3xl animate-float' />
          <div className='absolute bottom-20 right-10 w-80 h-80 bg-brand-50/50 rounded-full blur-3xl animate-float-delayed' />
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full'>
          <div className='grid lg:grid-cols-2 gap-12 lg:gap-16 items-center'>
            {/* Left column - Content */}
            <div className='text-center lg:text-left'>
              <div className='mb-8'>
                <span className='inline-flex items-center gap-2 px-4 py-2 bg-white/80 text-zinc-700 rounded-full text-sm font-medium border border-zinc-200'>
                  <Users className='w-4 h-4' />
                  Join thousands of professionals
                </span>
              </div>

              <h1 className='text-4xl sm:text-5xl lg:text-6xl font-bold text-zinc-900 mb-8 leading-tight'>
                Connect. Grow.{' '}
                <span className='text-brand-500 relative'>
                  Succeed.
                  <div className='absolute -bottom-2 left-0 w-full h-1 bg-brand-200 rounded-full opacity-60'></div>
                </span>
              </h1>

              <p className='text-lg sm:text-xl text-zinc-700 mb-10 leading-relaxed max-w-2xl'>
                Loopn helps you build meaningful professional relationships
                through smart AI matching and authentic conversations.
              </p>

              {/* Value Propositions */}
              <div className='flex flex-wrap gap-6 justify-center lg:justify-start mb-12'>
                <div className='flex items-center gap-2 text-zinc-700'>
                  <CheckCircle className='w-5 h-5 text-brand-500' />
                  <span className='font-medium text-sm'>
                    Smart AI Matching – Meet the right people faster
                  </span>
                </div>
                <div className='flex items-center gap-2 text-zinc-700'>
                  <CheckCircle className='w-5 h-5 text-brand-500' />
                  <span className='font-medium text-sm'>
                    Real-time Chat – Talk instantly, anytime
                  </span>
                </div>
                <div className='flex items-center gap-2 text-zinc-700'>
                  <CheckCircle className='w-5 h-5 text-brand-500' />
                  <span className='font-medium text-sm'>
                    Privacy First – You control what you share
                  </span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className='flex flex-col sm:flex-row gap-4 justify-center lg:justify-start'>
                <Link href={authLink} className='w-full sm:w-auto'>
                  <button className='group w-full bg-brand-500 hover:bg-brand-600 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5'>
                    Join Loopn
                    <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
                  </button>
                </Link>
                <button
                  onClick={scrollToHowItWorks}
                  className='w-full sm:w-auto bg-white hover:bg-zinc-50 text-zinc-700 px-8 py-4 rounded-xl text-lg font-semibold border border-zinc-200 transition-all duration-300 flex items-center justify-center gap-3 hover:shadow-lg'
                >
                  See how it works
                  <ArrowRight className='w-5 h-5' />
                </button>
              </div>
            </div>

            {/* Right column - Demo */}
            <div className='relative mt-12 lg:mt-0'>
              {/* Chat Interface Mockup - matching real chat UI */}
              <div className='bg-white md:rounded-2xl shadow-xl border border-zinc-200 w-full sm:max-w-md lg:max-w-lg sm:mx-auto overflow-hidden'>
                {/* Chat Header - matching ChatHeader.tsx */}
                <div
                  className='bg-white border-b border-zinc-200 relative z-10'
                  style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)' }}
                >
                  <div className='px-4 py-3'>
                    <div className='flex items-center gap-3'>
                      {/* User Avatar */}
                      <div className='relative'>
                        <Image
                          src='/dummy-user.jpg'
                          alt='Ethan Cole'
                          width={40}
                          height={40}
                          className='w-10 h-10 rounded-full object-cover'
                        />
                        <div className='absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-b_green-400 border-2 border-white rounded-full'></div>
                      </div>

                      <div className='flex-1 min-w-0'>
                        <h1 className='text-sm font-medium text-zinc-900 truncate'>
                          Ethan Cole
                        </h1>
                        <div className='flex items-center gap-2 mt-0.5'>
                          <div className='flex items-center text-sm text-b_green-500'>
                            Online
                          </div>
                          <span className='text-zinc-500 text-sm'>•</span>
                          <span className='text-brand-500 text-sm'>
                            Trial Chat
                          </span>
                        </div>
                      </div>

                      {/* Trial controls */}
                      <div className='flex items-center gap-2 text-sm'>
                        <div className='flex items-center gap-1 text-zinc-500'>
                          <Clock className='w-4 h-4 text-zinc-500' />
                          <span className='text-zinc-900 font-bold whitespace-nowrap'>
                            6d 14h
                          </span>
                        </div>
                        <div className='w-0.5 h-6 bg-zinc-100'></div>
                        <button
                          disabled
                          className='flex items-center gap-1.5 px-3 py-2 bg-brand-500 text-white rounded-lg shadow-lg cursor-not-allowed opacity-80'
                        >
                          <Image
                            src='/connect-icon.svg'
                            alt='Connect'
                            width={16}
                            height={16}
                            className='flex-shrink-0'
                          />
                          <span className='text-sm font-medium'>Connect</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat Messages - matching MessageList.tsx structure */}
                <div className='bg-white px-4 py-4 space-y-4 max-h-[500px] md:max-h-96 overflow-hidden'>
                  {/* Date separator */}
                  <div className='flex items-center justify-center my-6'>
                    <div className='text-zinc-500 text-sm'>
                      Today at 2:30 PM
                    </div>
                  </div>

                  {/* First message - Other user */}
                  <div className='flex flex-col space-y-2 opacity-0 animate-[slideUpFade_0.6s_ease-out_0.8s_forwards]'>
                    <div className='relative flex items-center gap-2 max-w-full'>
                      <div className='flex-shrink-0 w-8 h-8'>
                        <Image
                          src='/dummy-user.jpg'
                          alt='Ethan Cole'
                          width={32}
                          height={32}
                          className='w-8 h-8 rounded-full object-cover'
                        />
                      </div>
                      <div className='relative max-w-[85vw] sm:max-w-sm'>
                        <div className='px-3 py-2 rounded-3xl bg-zinc-100 text-zinc-900 rounded-bl-sm'>
                          <p className='text-sm font-medium leading-relaxed break-words select-none'>
                            Hey! I noticed we're both working in product design.
                            Would love to connect and share insights about UX
                            research!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Second message - You */}
                  <div className='flex flex-col items-end space-y-2 opacity-0 animate-[slideUpFade_0.6s_ease-out_1.6s_forwards] mt-4'>
                    <div className='relative max-w-[85vw] sm:max-w-sm'>
                      <div className='px-3 py-2 rounded-3xl bg-brand-500 text-white border border-brand-500 rounded-br-sm'>
                        <div className='relative'>
                          <p className='text-sm font-medium leading-relaxed break-words pr-10 select-none'>
                            Absolutely! Always excited to meet fellow designers.
                            What kind of products are you currently working on?
                          </p>
                          <div className='absolute bottom-0 right-0'>
                            <Image
                              src='/double_tick.svg'
                              alt='delivered'
                              width={20}
                              height={20}
                              className='opacity-50 filter brightness-0 invert select-none'
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Third message - Other user */}
                  <div className='flex flex-col space-y-2 opacity-0 animate-[slideUpFade_0.6s_ease-out_2.4s_forwards] mt-1'>
                    <div className='relative flex items-center gap-2 max-w-full'>
                      <div className='flex-shrink-0 w-8 h-8'>
                        <Image
                          src='/dummy-user.jpg'
                          alt='Ethan Cole'
                          width={32}
                          height={32}
                          className='w-8 h-8 rounded-full object-cover'
                        />
                      </div>
                      <div className='relative max-w-[85vw] sm:max-w-sm'>
                        <div className='px-3 py-2 rounded-3xl bg-zinc-100 text-zinc-900 rounded-bl-sm'>
                          <p className='text-sm font-medium leading-relaxed break-words select-none'>
                            Currently building a fintech mobile app focused on
                            investment education. Your experience with user
                            research would be incredibly valuable!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fourth message - You */}
                  <div className='flex flex-col items-end space-y-2 opacity-0 animate-[slideUpFade_0.6s_ease-out_3.2s_forwards] mt-4'>
                    <div className='relative max-w-[85vw] sm:max-w-sm'>
                      <div className='px-3 py-2 rounded-3xl bg-brand-500 text-white border border-brand-500 rounded-br-sm'>
                        <div className='relative'>
                          <p className='text-sm font-medium leading-relaxed break-words pr-10 select-none'>
                            Perfect timing! I just wrapped up a comprehensive UX
                            study on financial literacy apps. Happy to share key
                            findings! 🎯
                          </p>
                          <div className='absolute bottom-0 right-0'>
                            <Image
                              src='/double_tick.svg'
                              alt='delivered'
                              width={20}
                              height={20}
                              className='opacity-50 filter brightness-0 invert select-none'
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat Input - matching MessageInput.tsx */}
                <div className='px-4 pb-4 border-t border-zinc-200 bg-white'>
                  <div className='pt-4'>
                    <div className='bg-zinc-50 rounded-xl border border-zinc-200 px-4 py-3 flex items-center gap-3'>
                      <input
                        type='text'
                        placeholder='Type your message...'
                        className='flex-1 bg-transparent text-sm placeholder-zinc-500 focus:outline-none'
                        disabled
                      />
                      <button
                        disabled
                        className='w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center cursor-not-allowed opacity-80'
                      >
                        <ArrowRight className='w-4 h-4 text-white' />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='py-20 sm:py-24 bg-white relative'>
        {/* Background decoration */}
        <div className='absolute inset-0 -z-10'>
          <div className='absolute top-1/4 left-0 w-72 h-72 bg-zinc-50/80 rounded-full blur-3xl' />
          <div className='absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-50/60 rounded-full blur-3xl' />
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Section Header */}
          <div className='text-center max-w-4xl mx-auto mb-16'>
            <h2 className='text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 mb-8'>
              The future of{' '}
              <span className='text-brand-500 relative'>
                networking is here.
                <div className='absolute -bottom-1 left-0 w-full h-1 bg-brand-200 rounded-full opacity-60'></div>
              </span>
            </h2>
            <p className='text-lg text-zinc-700 leading-relaxed'>
              Loopn removes the noise from traditional networking, helping you
              connect based on what truly matters — your expertise, goals, and
              shared interests.
            </p>
          </div>

          <DashboardDemo />

          {/* Features Grid */}
          <div className='grid lg:grid-cols-3 gap-6 sm:gap-8 mb-16 mt-16'>
            {/* Feature 1 - Smart Matching */}
            <div className='group bg-white rounded-2xl p-6 sm:p-8 border border-zinc-200 h-full shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1'>
              <div className='w-14 h-14 bg-gradient-to-br from-brand-100 to-brand-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300'>
                <Brain className='w-7 h-7 text-brand-600' />
              </div>
              <h3 className='text-xl font-bold text-zinc-900 mb-4'>
                Smart AI Matching
              </h3>
              <p className='text-zinc-700 mb-6 leading-relaxed text-sm sm:text-base'>
                Meet professionals who complement your skills and align with
                your goals.
              </p>
              <ul className='space-y-3'>
                <li className='flex items-center gap-3 text-zinc-700'>
                  <div className='w-5 h-5 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0'>
                    <CheckCircle className='w-3 h-3 text-brand-600' />
                  </div>
                  <span className='font-medium text-sm'>
                    AI-powered matching
                  </span>
                </li>
                <li className='flex items-center gap-3 text-zinc-700'>
                  <div className='w-5 h-5 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0'>
                    <CheckCircle className='w-3 h-3 text-brand-600' />
                  </div>
                  <span className='font-medium text-sm'>
                    Industry-focused connections
                  </span>
                </li>
                <li className='flex items-center gap-3 text-zinc-700'>
                  <div className='w-5 h-5 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0'>
                    <CheckCircle className='w-3 h-3 text-brand-600' />
                  </div>
                  <span className='font-medium text-sm'>
                    Goal-based alignment
                  </span>
                </li>
              </ul>
            </div>

            {/* Feature 2 - Real-time Chat */}
            <div className='group bg-white rounded-2xl p-6 sm:p-8 border border-zinc-200 h-full shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1'>
              <div className='w-14 h-14 bg-gradient-to-br from-b_green-100 to-b_green-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300'>
                <Zap className='w-7 h-7 text-b_green-600' />
              </div>
              <h3 className='text-xl font-bold text-zinc-900 mb-4'>
                Instant Connections
              </h3>
              <p className='text-zinc-700 mb-6 leading-relaxed text-sm sm:text-base'>
                Start meaningful conversations the moment you match — no delays,
                no barriers.
              </p>
              <ul className='space-y-3'>
                <li className='flex items-center gap-3 text-zinc-700'>
                  <div className='w-5 h-5 bg-b_green-100 rounded-full flex items-center justify-center flex-shrink-0'>
                    <CheckCircle className='w-3 h-3 text-b_green-600' />
                  </div>
                  <span className='font-medium text-sm'>
                    Real-time messaging
                  </span>
                </li>
                <li className='flex items-center gap-3 text-zinc-700'>
                  <div className='w-5 h-5 bg-b_green-100 rounded-full flex items-center justify-center flex-shrink-0'>
                    <CheckCircle className='w-3 h-3 text-b_green-600' />
                  </div>
                  <span className='font-medium text-sm'>
                    Professional conversation starters
                  </span>
                </li>
                <li className='flex items-center gap-3 text-zinc-700'>
                  <div className='w-5 h-5 bg-b_green-100 rounded-full flex items-center justify-center flex-shrink-0'>
                    <CheckCircle className='w-3 h-3 text-b_green-600' />
                  </div>
                  <span className='font-medium text-sm'>
                    Smooth, seamless experience
                  </span>
                </li>
              </ul>
            </div>

            {/* Feature 3 - Quality Network */}
            <div className='group bg-white rounded-2xl p-6 sm:p-8 border border-zinc-200 h-full shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1'>
              <div className='w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300'>
                <Shield className='w-7 h-7 text-purple-600' />
              </div>
              <h3 className='text-xl font-bold text-zinc-900 mb-4'>
                Quality & Privacy
              </h3>
              <p className='text-zinc-700 mb-6 leading-relaxed text-sm sm:text-base'>
                Network with verified professionals in a safe, focused space.
              </p>
              <ul className='space-y-3'>
                <li className='flex items-center gap-3 text-zinc-700'>
                  <div className='w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0'>
                    <CheckCircle className='w-3 h-3 text-purple-600' />
                  </div>
                  <span className='font-medium text-sm'>
                    Verified members only
                  </span>
                </li>
                <li className='flex items-center gap-3 text-zinc-700'>
                  <div className='w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0'>
                    <CheckCircle className='w-3 h-3 text-purple-600' />
                  </div>
                  <span className='font-medium text-sm'>
                    Privacy-first design
                  </span>
                </li>
                <li className='flex items-center gap-3 text-zinc-700'>
                  <div className='w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0'>
                    <CheckCircle className='w-3 h-3 text-purple-600' />
                  </div>
                  <span className='font-medium text-sm'>
                    Quality over quantity
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className='text-center'>
            <Link href={authLink}>
              <button className='group inline-flex items-center gap-3 bg-brand-500 hover:bg-brand-600 text-white px-10 py-4 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5'>
                {ctaText}
                <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id='how-it-works'
        className='py-20 sm:py-24 bg-zinc-100 relative'
      >
        {/* Background decoration */}
        <div className='absolute inset-0 -z-10'>
          <div className='absolute top-1/3 right-0 w-96 h-96 bg-brand-50/60 rounded-full blur-3xl' />
          <div className='absolute bottom-1/3 left-0 w-80 h-80 bg-zinc-50/80 rounded-full blur-3xl' />
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Section Header */}
          <div className='text-center max-w-4xl mx-auto mb-16'>
            <h2 className='text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 mb-8'>
              Your Journey to Meaningful{' '}
              <span className='text-brand-500 relative'>
                Connections
                <div className='absolute -bottom-1 left-0 w-full h-1 bg-brand-200 rounded-full opacity-60'></div>
              </span>
            </h2>
            <p className='text-lg text-zinc-700 leading-relaxed'>
              Getting started with Loopn is quick and effortless.
            </p>
          </div>

          {/* Steps */}
          <div className='grid lg:grid-cols-3 gap-6 sm:gap-8 relative'>
            {/* Step 1 */}
            <div className='relative group'>
              <div className='bg-white rounded-2xl p-6 sm:p-8 border border-zinc-200 relative h-full shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1'>
                {/* Step number */}
                <div className='absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg z-20'>
                  1
                </div>
                {/* Icon */}
                <div className='w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mb-6 mx-auto mt-4'>
                  <User className='w-8 h-8 text-brand-600' />
                </div>
                {/* Content */}
                <div className='text-center'>
                  <h3 className='text-xl font-bold text-zinc-900 mb-4'>
                    Create Your Profile
                  </h3>
                  <p className='text-zinc-700 leading-relaxed text-sm sm:text-base'>
                    Showcase your expertise, goals, and what you're looking for
                    — so the right people can find you.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className='relative group'>
              <div className='bg-white rounded-2xl p-6 sm:p-8 border border-zinc-200 relative h-full shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1'>
                {/* Step number */}
                <div className='absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg z-20'>
                  2
                </div>
                {/* Icon */}
                <div className='w-16 h-16 bg-b_green-50 rounded-2xl flex items-center justify-center mb-6 mx-auto mt-4'>
                  <Brain className='w-8 h-8 text-b_green-600' />
                </div>
                {/* Content */}
                <div className='text-center'>
                  <h3 className='text-xl font-bold text-zinc-900 mb-4'>
                    Get Smart Matches
                  </h3>
                  <p className='text-zinc-700 leading-relaxed text-sm sm:text-base'>
                    Our AI connects you with professionals who share your
                    interests and complement your skills.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className='relative group'>
              <div className='bg-white rounded-2xl p-6 sm:p-8 border border-zinc-200 relative h-full shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1'>
                {/* Step number */}
                <div className='absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg z-20'>
                  3
                </div>
                {/* Icon */}
                <div className='w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 mx-auto mt-4'>
                  <MessageCircle className='w-8 h-8 text-purple-600' />
                </div>
                {/* Content */}
                <div className='text-center'>
                  <h3 className='text-xl font-bold text-zinc-900 mb-4'>
                    Start Connecting
                  </h3>
                  <p className='text-zinc-700 leading-relaxed text-sm sm:text-base'>
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
      <section className='py-20 sm:py-24 bg-white relative'>
        {/* Background decoration */}
        <div className='absolute inset-0 -z-10'>
          <div className='absolute top-1/4 right-0 w-96 h-96 bg-brand-50/40 rounded-full blur-3xl' />
          <div className='absolute bottom-1/4 left-0 w-80 h-80 bg-zinc-50/80 rounded-full blur-3xl' />
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-16'>
            <h2 className='text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 mb-8'>
              Trusted by{' '}
              <span className='text-brand-500 relative'>
                Professionals Worldwide
                <div className='absolute -bottom-1 left-0 w-full h-1 bg-brand-200 rounded-full opacity-60'></div>
              </span>
            </h2>
            <p className='text-lg text-zinc-700 max-w-3xl mx-auto leading-relaxed'>
              Loopn is built for those who value authentic networking and
              meaningful connections.
            </p>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8'>
            {/* Testimonial 1 */}
            <div className='group bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col h-full'>
              <div className='flex items-center gap-1 mb-6'>
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={`testimonial-1-star-${star}`}
                    className='w-5 h-5 text-b_yellow-400 fill-current'
                  />
                ))}
              </div>
              <blockquote className='text-zinc-800 mb-6 text-sm sm:text-base leading-relaxed font-medium flex-grow'>
                &quot;Loopn made networking feel natural again. I&apos;ve built
                genuine relationships through honest conversations about shared
                interests.&quot;
              </blockquote>
              <div className='flex items-center gap-4 mt-auto'>
                <Image
                  src='/dummy-user2.jpg'
                  alt='Sarah Johnson'
                  width={48}
                  height={48}
                  className='w-12 h-12 rounded-full object-cover'
                />
                <div>
                  <p className='font-bold text-zinc-900 text-sm'>
                    Sarah Johnson
                  </p>
                  <p className='text-zinc-600 text-sm'>
                    Software Engineer, Tech Startup
                  </p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className='group bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col h-full'>
              <div className='flex items-center gap-1 mb-6'>
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={`testimonial-2-star-${star}`}
                    className='w-5 h-5 text-b_yellow-400 fill-current'
                  />
                ))}
              </div>
              <blockquote className='text-zinc-800 mb-6 text-sm sm:text-base leading-relaxed font-medium flex-grow'>
                &quot;The smart matching is brilliant. I found a mentor through
                meaningful conversations who&apos;s now a key connection in my
                career.&quot;
              </blockquote>
              <div className='flex items-center gap-4 mt-auto'>
                <Image
                  src='/dummy-user3.jpg'
                  alt='Michael Chen'
                  width={48}
                  height={48}
                  className='w-12 h-12 rounded-full object-cover'
                />
                <div>
                  <p className='font-bold text-zinc-900 text-sm'>
                    Michael Chen
                  </p>
                  <p className='text-zinc-600 text-sm'>
                    Product Manager, E-commerce
                  </p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className='group bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 md:col-span-2 lg:col-span-1 flex flex-col h-full'>
              <div className='flex items-center gap-1 mb-6'>
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={`testimonial-3-star-${star}`}
                    className='w-5 h-5 text-b_yellow-400 fill-current'
                  />
                ))}
              </div>
              <blockquote className='text-zinc-800 mb-6 text-sm sm:text-base leading-relaxed font-medium flex-grow'>
                &quot;Finally, a platform where expertise matters more than
                titles. Every conversation feels purposeful and
                growth-oriented.&quot;
              </blockquote>
              <div className='flex items-center gap-4 mt-auto'>
                <Image
                  src='/dummy-user4.jpg'
                  alt='Emily Rodriguez'
                  width={48}
                  height={48}
                  className='w-12 h-12 rounded-full object-cover'
                />
                <div>
                  <p className='font-bold text-zinc-900 text-sm'>
                    Emily Rodriguez
                  </p>
                  <p className='text-zinc-600 text-sm'>
                    UX Designer, Design Agency
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className='mt-16 text-center'>
            <h3 className='text-xl sm:text-2xl font-bold text-zinc-900 mb-4'>
              Built for Professionals in Every Field
            </h3>
            <p className='text-zinc-600 mb-8 text-sm sm:text-base'>
              From startups to global enterprises, Loopn connects experts across
              industries.
            </p>
            <div className='flex flex-wrap justify-center items-center gap-6 sm:gap-8 opacity-60'>
              <div className='text-zinc-500 font-semibold text-sm sm:text-base'>
                Technology
              </div>
              <div className='text-zinc-500 font-semibold text-sm sm:text-base'>
                Finance
              </div>
              <div className='text-zinc-500 font-semibold text-sm sm:text-base'>
                Design
              </div>
              <div className='text-zinc-500 font-semibold text-sm sm:text-base'>
                Marketing
              </div>
              <div className='text-zinc-500 font-semibold text-sm sm:text-base'>
                Healthcare
              </div>
              <div className='text-zinc-500 font-semibold text-sm sm:text-base'>
                Consulting
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className='py-20 sm:py-24 bg-zinc-100 text-zinc-900 relative overflow-hidden'>
        {/* Background decoration */}
        <div className='absolute inset-0 -z-10'>
          <div className='absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl' />
          <div className='absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl' />
        </div>

        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
          <h2 className='text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight'>
            Ready to Transform Your Network?
          </h2>
          <p className='text-lg text-zinc-700 mb-8 max-w-2xl mx-auto'>
            Join Loopn today and start making connections that matter.
          </p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Link href={authLink} className='w-full sm:w-auto'>
              <button className='group w-full bg-white hover:bg-zinc-50 text-brand-600 px-10 py-4 rounded-xl text-lg font-bold transition-all duration-300 flex items-center justify-center gap-3'>
                {ctaText}
                <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
              </button>
            </Link>
            <button className='w-full sm:w-auto bg-white hover:bg-zinc-50 text-zinc-700 px-10 py-4 rounded-xl text-lg font-bold border border-zinc-200 transition-all duration-300 flex items-center justify-center gap-3'>
              <MessageCircle className='w-5 h-5' />
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-white py-16 border-t border-zinc-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <div className='flex items-center justify-center space-x-3 mb-6'>
              <Image src='/loopn.svg' alt='Loopn' width={40} height={40} />
              <span className='text-2xl font-bold text-zinc-900'>Loopn</span>
            </div>
            <p className='text-zinc-600 text-center max-w-2xl mx-auto mb-8 leading-relaxed'>
              Build meaningful connections through smart matching and genuine
              conversations.
            </p>

            {/* Footer Links */}
            <div className='flex flex-col sm:flex-row justify-center items-center gap-8 mb-8'>
              <a
                href='#'
                className='text-zinc-600 hover:text-zinc-900 transition-colors'
              >
                Privacy Policy
              </a>
              <a
                href='#'
                className='text-zinc-600 hover:text-zinc-900 transition-colors'
              >
                Terms of Service
              </a>
              <a
                href='#'
                className='text-zinc-600 hover:text-zinc-900 transition-colors'
              >
                Contact Us
              </a>
              <a
                href='#'
                className='text-zinc-600 hover:text-zinc-900 transition-colors'
              >
                Help Center
              </a>
            </div>

            <div className='pt-8 border-t border-zinc-200'>
              <p className='text-zinc-500 text-sm'>
                © 2025 Loopn. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
