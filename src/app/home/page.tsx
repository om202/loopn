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
} from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

// Add custom keyframes for the animations
const customStyles = `
  @keyframes slideUpFade {
    0% {
      opacity: 0;
      transform: translateY(30px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fadeInUp {
    0% {
      opacity: 0;
      transform: translateY(40px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes scaleIn {
    0% {
      opacity: 0;
      transform: scale(0.9);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @keyframes floatUp {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }
  
  .animate-float {
    animation: floatUp 6s ease-in-out infinite;
  }
  
  .animate-float-delayed {
    animation: floatUp 6s ease-in-out infinite 2s;
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
                <button className='bg-brand-500 hover:bg-brand-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2'>
                  <LogIn className='w-4 h-4' />
                  {authText}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className='min-h-[calc(100vh-64px)] bg-zinc-100 flex items-center relative overflow-hidden'>
        {/* Background Elements */}
        <div className='absolute inset-0 -z-10'>
          <div className='absolute top-20 left-10 w-72 h-72 bg-brand-100/30 rounded-full blur-3xl animate-float' />
          <div className='absolute bottom-20 right-10 w-80 h-80 bg-brand-50/50 rounded-full blur-3xl animate-float-delayed' />
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12 lg:py-16'>
          <div className='grid lg:grid-cols-2 gap-12 lg:gap-16 items-center'>
            {/* Left column - Content */}
            <div className='text-center lg:text-left'>
              <div className='mb-6'>
                <span className='inline-flex items-center gap-2 text-sm font-medium mb-6'>
                  <Users className='w-4 h-4' />
                  Join thousands of professionals
                </span>
              </div>

              <h1 className='text-4xl sm:text-5xl lg:text-6xl font-bold text-zinc-900 mb-16 leading-tight'>
                Connect and Grow{' '}
                <span className='text-brand-500 relative'>
                  Professionally
                  <div className='absolute -bottom-2 left-0 w-full h-1 bg-brand-200 rounded-full opacity-60'></div>
                </span>
              </h1>

              <p className='text-lg sm:text-xl text-zinc-700 mb-8 leading-relaxed max-w-2xl'>
                Join a community where meaningful connections happen naturally.
                Build your professional network through smart matching and
                genuine conversations.
              </p>

              {/* Value Propositions */}
              <div className='flex flex-wrap gap-6 justify-center lg:justify-start mb-12'>
                <div className='flex items-center gap-2 text-zinc-700'>
                  <CheckCircle className='w-5 h-5 text-brand-500' />
                  <span className='font-medium'>Smart AI Matching</span>
                </div>
                <div className='flex items-center gap-2 text-zinc-700'>
                  <CheckCircle className='w-5 h-5 text-brand-500' />
                  <span className='font-medium'>Real-time Chat</span>
                </div>
                <div className='flex items-center gap-2 text-zinc-700'>
                  <CheckCircle className='w-5 h-5 text-brand-500' />
                  <span className='font-medium'>Privacy Focused</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className='flex flex-col sm:flex-row gap-4 justify-center lg:justify-start'>
                <Link href={authLink} className='w-full sm:w-auto'>
                  <button className='group w-full bg-brand-500 hover:bg-brand-600 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5'>
                    {ctaText}
                    <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
                  </button>
                </Link>
                <button
                  onClick={scrollToHowItWorks}
                  className='w-full sm:w-auto bg-white hover:bg-zinc-50 text-zinc-700 px-8 py-4 rounded-xl text-lg font-semibold border border-zinc-200 transition-all duration-300 flex items-center justify-center gap-3 hover:shadow-lg'
                >
                  <MessageCircle className='w-5 h-5' />
                  How it works
                </button>
              </div>
            </div>

            {/* Right column - Demo */}
            <div className='relative mt-12 lg:mt-0'>
              {/* Chat Interface Mockup */}
              <div className='bg-white rounded-3xl shadow-2xl border border-zinc-200 max-w-sm sm:max-w-md mx-auto p-1'>
                {/* Chat Header */}
                <div className='bg-zinc-50 rounded-t-3xl px-6 py-4 border-b border-zinc-200'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <UserAvatar
                        email='uxdesigner-d45'
                        size='md'
                        variant='beam'
                      />
                      <div>
                        <p className='font-semibold text-zinc-900'>
                          uxdesigner-d45
                        </p>
                        <p className='text-sm text-zinc-500'>UX Designer</p>
                      </div>
                    </div>
                    <div className='w-3 h-3 bg-green-400 rounded-full'></div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className='p-6 space-y-6 max-h-96 overflow-hidden'>
                  {/* First message - Other user */}
                  <div className='flex flex-col space-y-2 opacity-0 animate-[slideUpFade_0.6s_ease-out_0.8s_forwards]'>
                    <div className='flex items-center gap-2 mb-1'>
                      <UserAvatar
                        email='productmanager-e16'
                        size='sm'
                        variant='beam'
                      />
                      <div className='text-xs text-zinc-600'>
                        productmanager-e16
                      </div>
                    </div>
                    <div className='bg-zinc-100 rounded-2xl rounded-tl-md px-4 py-3 text-zinc-800 text-sm max-w-[85%] shadow-sm'>
                      Hey! Noticed we're both in product design. Would love to
                      connect and share insights!
                    </div>
                  </div>

                  {/* Second message - You */}
                  <div className='flex flex-col items-end space-y-2 opacity-0 animate-[slideUpFade_0.6s_ease-out_1.6s_forwards]'>
                    <div className='bg-brand-500 rounded-2xl rounded-tr-md px-4 py-3 text-white text-sm max-w-[85%] shadow-md'>
                      Absolutely! Always excited to meet fellow designers. What
                      kind of products do you work on?
                    </div>
                  </div>

                  {/* Third message - Other user */}
                  <div className='flex flex-col space-y-2 opacity-0 animate-[slideUpFade_0.6s_ease-out_2.4s_forwards]'>
                    <div className='flex items-center gap-2 mb-1'>
                      <UserAvatar
                        email='productmanager-e16'
                        size='sm'
                        variant='beam'
                      />
                      <div className='text-xs text-zinc-600'>
                        productmanager-e16
                      </div>
                    </div>
                    <div className='bg-zinc-100 rounded-2xl rounded-tl-md px-4 py-3 text-zinc-800 text-sm max-w-[85%] shadow-sm'>
                      Currently building a fintech app. Your experience with
                      user research would be invaluable!
                    </div>
                  </div>

                  {/* Fourth message - You */}
                  <div className='flex flex-col items-end space-y-2 opacity-0 animate-[slideUpFade_0.6s_ease-out_3.2s_forwards]'>
                    <div className='bg-brand-500 rounded-2xl rounded-tr-md px-4 py-3 text-white text-sm max-w-[85%] shadow-md'>
                      Perfect timing! I just completed a fintech UX study. Happy
                      to share findings! 🎯
                    </div>
                  </div>

                  {/* Typing indicator */}
                  <div className='flex items-center gap-2 opacity-0 animate-[fadeInUp_0.6s_ease-out_4s_forwards]'>
                    <UserAvatar
                      email='productmanager-e16'
                      size='sm'
                      variant='beam'
                    />
                    <div className='bg-zinc-100 rounded-2xl px-4 py-3 shadow-sm'>
                      <div className='flex space-x-1'>
                        <div className='w-2 h-2 bg-zinc-400 rounded-full animate-bounce'></div>
                        <div
                          className='w-2 h-2 bg-zinc-400 rounded-full animate-bounce'
                          style={{ animationDelay: '0.1s' }}
                        ></div>
                        <div
                          className='w-2 h-2 bg-zinc-400 rounded-full animate-bounce'
                          style={{ animationDelay: '0.2s' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat Input */}
                <div className='px-6 pb-6 mt-4'>
                  <div className='bg-zinc-50 rounded-xl border border-zinc-200 px-4 py-3 flex items-center gap-3'>
                    <input
                      type='text'
                      placeholder='Type your message...'
                      className='flex-1 bg-transparent text-sm placeholder-zinc-500 focus:outline-none'
                      disabled
                    />
                    <div className='w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center'>
                      <ArrowRight className='w-4 h-4 text-white' />
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
            <div className='mb-6'>
              <span className='inline-flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 rounded-full text-sm font-medium'>
                <Zap className='w-4 h-4' />
                Why professionals choose Loopn
              </span>
            </div>
            <h2 className='text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 mb-6'>
              Experience the future of{' '}
              <span className='text-brand-500 relative'>
                professional networking
                <div className='absolute -bottom-1 left-0 w-full h-1 bg-brand-200 rounded-full opacity-60'></div>
              </span>
            </h2>
            <p className='text-lg text-zinc-700 leading-relaxed'>
              Loopn removes barriers from networking, letting you connect based
              on what truly matters - your expertise and goals.
            </p>
          </div>

          {/* Features Grid */}
          <div className='grid lg:grid-cols-3 gap-8 mb-16'>
            {/* Feature 1 - Smart Matching */}
            <div className='group bg-white rounded-2xl p-8 border border-zinc-200 h-full shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1'>
              <div className='w-14 h-14 bg-gradient-to-br from-brand-100 to-brand-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300'>
                <Brain className='w-7 h-7 text-brand-600' />
              </div>
              <h3 className='text-xl font-bold text-zinc-900 mb-4'>
                Smart AI Matching
              </h3>
              <p className='text-zinc-700 mb-6 leading-relaxed'>
                Connect with professionals who complement your skills and share
                your interests through our intelligent matching system.
              </p>
              <ul className='space-y-3'>
                <li className='flex items-center gap-3 text-zinc-700'>
                  <div className='w-5 h-5 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0'>
                    <CheckCircle className='w-3 h-3 text-brand-600' />
                  </div>
                  <span className='font-medium'>
                    AI-powered matching algorithm
                  </span>
                </li>
                <li className='flex items-center gap-3 text-zinc-700'>
                  <div className='w-5 h-5 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0'>
                    <CheckCircle className='w-3 h-3 text-brand-600' />
                  </div>
                  <span className='font-medium'>
                    Industry-specific connections
                  </span>
                </li>
                <li className='flex items-center gap-3 text-zinc-700'>
                  <div className='w-5 h-5 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0'>
                    <CheckCircle className='w-3 h-3 text-brand-600' />
                  </div>
                  <span className='font-medium'>Goal-based alignment</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 - Real-time Chat */}
            <div className='group bg-white rounded-2xl p-8 border border-zinc-200 h-full shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1'>
              <div className='w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300'>
                <Zap className='w-7 h-7 text-green-600' />
              </div>
              <h3 className='text-xl font-bold text-zinc-900 mb-4'>
                Instant Connections
              </h3>
              <p className='text-zinc-700 mb-6 leading-relaxed'>
                Start meaningful conversations immediately when you find the
                right match. No waiting, no barriers.
              </p>
              <ul className='space-y-3'>
                <li className='flex items-center gap-3 text-zinc-700'>
                  <div className='w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0'>
                    <CheckCircle className='w-3 h-3 text-green-600' />
                  </div>
                  <span className='font-medium'>Real-time messaging</span>
                </li>
                <li className='flex items-center gap-3 text-zinc-700'>
                  <div className='w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0'>
                    <CheckCircle className='w-3 h-3 text-green-600' />
                  </div>
                  <span className='font-medium'>
                    Professional conversation starters
                  </span>
                </li>
                <li className='flex items-center gap-3 text-zinc-700'>
                  <div className='w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0'>
                    <CheckCircle className='w-3 h-3 text-green-600' />
                  </div>
                  <span className='font-medium'>Seamless experience</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 - Quality Network */}
            <div className='group bg-white rounded-2xl p-8 border border-zinc-200 h-full shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1'>
              <div className='w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300'>
                <Shield className='w-7 h-7 text-purple-600' />
              </div>
              <h3 className='text-xl font-bold text-zinc-900 mb-4'>
                Quality & Privacy
              </h3>
              <p className='text-zinc-700 mb-6 leading-relaxed'>
                Build lasting professional relationships in a secure environment
                focused on meaningful interactions.
              </p>
              <ul className='space-y-3'>
                <li className='flex items-center gap-3 text-zinc-700'>
                  <div className='w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0'>
                    <CheckCircle className='w-3 h-3 text-purple-600' />
                  </div>
                  <span className='font-medium'>
                    Verified professionals only
                  </span>
                </li>
                <li className='flex items-center gap-3 text-zinc-700'>
                  <div className='w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0'>
                    <CheckCircle className='w-3 h-3 text-purple-600' />
                  </div>
                  <span className='font-medium'>Privacy-first approach</span>
                </li>
                <li className='flex items-center gap-3 text-zinc-700'>
                  <div className='w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0'>
                    <CheckCircle className='w-3 h-3 text-purple-600' />
                  </div>
                  <span className='font-medium'>Quality over quantity</span>
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
            <div className='mb-6'>
              <span className='inline-flex items-center gap-2 px-4 py-2 bg-white/80 text-zinc-700 rounded-full text-sm font-medium border border-zinc-200'>
                <Users className='w-4 h-4' />
                Simple and effective
              </span>
            </div>
            <h2 className='text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 mb-6'>
              Your journey to meaningful{' '}
              <span className='text-brand-500 relative'>
                connections
                <div className='absolute -bottom-1 left-0 w-full h-1 bg-brand-200 rounded-full opacity-60'></div>
              </span>
            </h2>
            <p className='text-lg text-zinc-700 leading-relaxed'>
              A simple three-step process to start building your professional
              network and making meaningful connections.
            </p>
          </div>

          {/* Steps */}
          <div className='grid lg:grid-cols-3 gap-8 relative'>
            {/* Step 1 */}
            <div className='relative group'>
              <div className='bg-white rounded-2xl p-8 border border-zinc-200 relative h-full shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1'>
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
                  <p className='text-zinc-700 leading-relaxed'>
                    Build your professional identity with your expertise and
                    goals. Focus on what matters for meaningful connections.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className='relative group'>
              <div className='bg-white rounded-2xl p-8 border border-zinc-200 relative h-full shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1'>
                {/* Step number */}
                <div className='absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg z-20'>
                  2
                </div>
                {/* Icon */}
                <div className='w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-6 mx-auto mt-4'>
                  <Brain className='w-8 h-8 text-green-600' />
                </div>
                {/* Content */}
                <div className='text-center'>
                  <h3 className='text-xl font-bold text-zinc-900 mb-4'>
                    Get Smart Matches
                  </h3>
                  <p className='text-zinc-700 leading-relaxed'>
                    Our intelligent algorithm connects you with professionals
                    who share your interests and complement your expertise
                    perfectly.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className='relative group'>
              <div className='bg-white rounded-2xl p-8 border border-zinc-200 relative h-full shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1'>
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
                  <p className='text-zinc-700 leading-relaxed'>
                    Have meaningful conversations with professionals that match
                    your career interests and build lasting relationships.
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
            <div className='mb-6'>
              <span className='inline-flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 rounded-full text-sm font-medium'>
                <Star className='w-4 h-4' />
                Loved by professionals
              </span>
            </div>
            <h2 className='text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 mb-6'>
              Trusted by{' '}
              <span className='text-brand-500 relative'>
                professionals worldwide
                <div className='absolute -bottom-1 left-0 w-full h-1 bg-brand-200 rounded-full opacity-60'></div>
              </span>
            </h2>
            <p className='text-lg text-zinc-700 max-w-3xl mx-auto leading-relaxed'>
              Built for professionals who value meaningful connections and
              authentic networking experiences.
            </p>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {/* Testimonial 1 */}
            <div className='group bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1'>
              <div className='flex items-center gap-1 mb-6'>
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={`testimonial-1-star-${star}`}
                    className='w-5 h-5 text-yellow-400 fill-current'
                  />
                ))}
              </div>
              <blockquote className='text-zinc-800 mb-6 text-base leading-relaxed font-medium'>
                &quot;Loopn made networking feel natural again. I&apos;ve made
                genuine connections through honest conversations about shared
                professional interests.&quot;
              </blockquote>
              <div className='flex items-center gap-4'>
                <UserAvatar
                  email='softwareengineer-a7f'
                  size='lg'
                  variant='beam'
                />
                <div>
                  <p className='font-bold text-zinc-900'>Sarah Johnson</p>
                  <p className='text-zinc-600 text-sm'>
                    Software Engineer, Tech Startup
                  </p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className='group bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1'>
              <div className='flex items-center gap-1 mb-6'>
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={`testimonial-2-star-${star}`}
                    className='w-5 h-5 text-yellow-400 fill-current'
                  />
                ))}
              </div>
              <blockquote className='text-zinc-800 mb-6 text-base leading-relaxed font-medium'>
                &quot;The smart matching is brilliant. I found a mentor through
                professional conversations who&apos;s now become a valuable
                connection in my career.&quot;
              </blockquote>
              <div className='flex items-center gap-4'>
                <UserAvatar
                  email='productmanager-b82'
                  size='lg'
                  variant='beam'
                />
                <div>
                  <p className='font-bold text-zinc-900'>Michael Chen</p>
                  <p className='text-zinc-600 text-sm'>
                    Product Manager, E-commerce
                  </p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className='group bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 md:col-span-2 lg:col-span-1'>
              <div className='flex items-center gap-1 mb-6'>
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={`testimonial-3-star-${star}`}
                    className='w-5 h-5 text-yellow-400 fill-current'
                  />
                ))}
              </div>
              <blockquote className='text-zinc-800 mb-6 text-base leading-relaxed font-medium'>
                &quot;Finally, a platform where expertise matters more than
                titles. The conversations are meaningful and focused on
                professional growth.&quot;
              </blockquote>
              <div className='flex items-center gap-4'>
                <UserAvatar email='uxdesigner-c93' size='lg' variant='beam' />
                <div>
                  <p className='font-bold text-zinc-900'>Emily Rodriguez</p>
                  <p className='text-zinc-600 text-sm'>
                    UX Designer, Design Agency
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className='mt-16 text-center'>
            <p className='text-zinc-600 mb-8'>
              Built for professionals across industries
            </p>
            <div className='flex flex-wrap justify-center items-center gap-6 sm:gap-8 opacity-60'>
              <div className='text-zinc-500 font-semibold text-base sm:text-lg'>
                Technology
              </div>
              <div className='text-zinc-500 font-semibold text-base sm:text-lg'>
                Finance
              </div>
              <div className='text-zinc-500 font-semibold text-base sm:text-lg'>
                Design
              </div>
              <div className='text-zinc-500 font-semibold text-base sm:text-lg'>
                Marketing
              </div>
              <div className='text-zinc-500 font-semibold text-base sm:text-lg'>
                Healthcare
              </div>
              <div className='text-zinc-500 font-semibold text-base sm:text-lg'>
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
            Ready to transform your <span>professional network?</span>
          </h2>

          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Link href={authLink} className='w-full sm:w-auto'>
              <button className='group w-full bg-white hover:bg-zinc-50 text-brand-600 px-10 py-4 rounded-xl text-lg font-bold transition-all duration-300 flex items-center justify-center gap-3'>
                {ctaText}
                <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
              </button>
            </Link>
            <button className='w-full sm:w-auto bg-white hover:bg-zinc-50 text-zinc-700 px-10 py-4 rounded-xl text-lg font-bold border border-zinc-200 transition-all duration-300 flex items-center justify-center gap-3'>
              <MessageCircle className='w-5 h-5' />
              Learn more
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-zinc-900 py-16'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <div className='flex items-center justify-center space-x-3 mb-6'>
              <Image src='/loopn.svg' alt='Loopn' width={40} height={40} />
              <span className='text-2xl font-bold text-white'>Loopn</span>
            </div>
            <p className='text-zinc-400 text-center max-w-2xl mx-auto mb-8 leading-relaxed'>
              The professional networking platform that helps you build
              meaningful connections through smart matching and genuine
              conversations.
            </p>

            {/* Social Links or Additional Info */}
            <div className='flex flex-col sm:flex-row justify-center items-center gap-8 mb-8'>
              <a
                href='#'
                className='text-zinc-400 hover:text-white transition-colors'
              >
                Privacy Policy
              </a>
              <a
                href='#'
                className='text-zinc-400 hover:text-white transition-colors'
              >
                Terms of Service
              </a>
              <a
                href='#'
                className='text-zinc-400 hover:text-white transition-colors'
              >
                Contact Us
              </a>
              <a
                href='#'
                className='text-zinc-400 hover:text-white transition-colors'
              >
                Help Center
              </a>
            </div>

            <div className='pt-8 border-t border-zinc-800'>
              <p className='text-zinc-500 text-sm'>
                © {new Date().getFullYear()} Loopn. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
