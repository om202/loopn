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
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

// Add custom keyframes for the animations
const customStyles = `
  @keyframes slideUpFade {
    0% {
      opacity: 0;
      transform: translateY(20px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
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
      <section className='min-h-[calc(100vh-64px)] bg-zinc-100 flex items-center relative'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8 lg:py-12'>
          <div className='grid lg:grid-cols-2 gap-8 lg:gap-12 items-center'>
            {/* Left column - Content */}
            <div className='text-center lg:text-left'>
              <h1 className='text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-semibold text-zinc-900 mb-6 leading-tight'>
                Connect and Grow{' '}
                <span className='text-brand-500'>Professionally</span>
              </h1>
              <p className='text-base sm:text-lg text-zinc-900 mb-8 leading-relaxed'>
                Join a community where meaningful connections happen naturally.
                Build your professional network through smart matching and
                genuine conversations.
              </p>

              {/* CTA Buttons */}
              <div className='flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-20 mb-6'>
                <Link href={authLink} className='w-full sm:w-auto'>
                  <button className='w-full bg-brand-500 hover:bg-brand-500 text-white px-10 py-4 rounded-lg text-lg font-medium transition-all duration-200 flex items-center justify-center gap-2'>
                    <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
                    {ctaText}
                  </button>
                </Link>
              </div>
            </div>

            {/* Right column - Demo */}
            <div className='relative'>
              {/* Conversation cards */}
              <div className='space-y-8 max-w-sm mx-auto mt-8 lg:mt-12'>
                {/* First message - Product Manager */}
                <div className='flex flex-col space-y-2 opacity-0 animate-[slideUpFade_0.5s_ease-out_0.5s_forwards]'>
                  <div className='flex items-center gap-2 mb-1'>
                    <div className='w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center'>
                      <span className='text-white text-sm font-medium'>PM</span>
                    </div>
                    <div className='text-sm text-zinc-900'>
                      Product Manager • Tech Startup
                    </div>
                  </div>
                  <div className='bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-zinc-200 text-zinc-900 text-sm max-w-[85%]'>
                    Hey! Noticed we&apos;re both in product. Would love to
                    connect!
                  </div>
                </div>

                {/* Second message - UX Designer */}
                <div className='flex flex-col items-end space-y-2 opacity-0 animate-[slideUpFade_0.5s_ease-out_1.5s_forwards]'>
                  <div className='flex items-center gap-2 mb-1'>
                    <div className='text-sm text-zinc-900'>
                      UX Designer • Design Agency
                    </div>
                    <div className='w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center'>
                      <span className='text-white text-sm font-medium'>UX</span>
                    </div>
                  </div>
                  <div className='bg-brand-500 rounded-2xl rounded-tr-none px-4 py-3 shadow-sm text-white text-sm max-w-[85%]'>
                    Always excited to meet new people in the industry. What
                    brings you here?
                  </div>
                </div>

                {/* Third message - Product Manager */}
                <div className='flex flex-col space-y-2 opacity-0 animate-[slideUpFade_0.5s_ease-out_2.5s_forwards]'>
                  <div className='flex items-center gap-2 mb-1'>
                    <div className='w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center'>
                      <span className='text-white text-sm font-medium'>PM</span>
                    </div>
                    <div className='text-sm text-zinc-900'>
                      Product Manager • Tech Startup
                    </div>
                  </div>
                  <div className='bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-zinc-200 text-zinc-900 text-sm max-w-[85%]'>
                    Looking to connect with designers to improve our product UX.
                  </div>
                </div>

                {/* Fourth message - UX Designer */}
                <div className='flex flex-col items-end space-y-2 opacity-0 animate-[slideUpFade_0.5s_ease-out_3.5s_forwards]'>
                  <div className='flex items-center gap-2 mb-1'>
                    <div className='text-sm text-zinc-900'>
                      UX Designer • Design Agency
                    </div>
                    <div className='w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center'>
                      <span className='text-white text-sm font-medium'>UX</span>
                    </div>
                  </div>
                  <div className='bg-brand-500 rounded-2xl rounded-tr-none px-4 py-3 shadow-sm text-white text-sm max-w-[85%]'>
                    Perfect! I&apos;d love to discuss user research best
                    practices.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='py-16 sm:py-20 bg-white'>
        {/* Background decoration */}
        <div className='absolute inset-0 -z-10'>
          <div className='absolute top-1/4 left-0 w-72 h-72 bg-zinc-100/30 rounded-full blur-3xl' />
          <div className='absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-100/20 rounded-full blur-3xl' />
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Section Header */}
          <div className='text-center max-w-3xl mx-auto mb-12 relative'>
            <h2 className='text-2xl sm:text-3xl lg:text-4xl font-medium text-zinc-900 mb-4'>
              Experience the future of{' '}
              <span className='text-brand-500'>professional networking</span>
            </h2>
            <p className='text-base text-zinc-900'>
              Loopn removes barriers from networking, letting you connect based
              on what truly matters - your expertise and goals.
            </p>
          </div>

          {/* Features Grid */}
          <div className='grid lg:grid-cols-3 gap-6 mb-12'>
            {/* Feature 1 - Smart Matching */}
            <div className='bg-white rounded-lg p-5 border border-zinc-200 h-full'>
              <div className='w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center mb-3'>
                <User className='w-5 h-5 text-brand-500' />
              </div>
              <h3 className='text-lg font-medium text-zinc-900 mb-2'>
                Smart Matching
              </h3>
              <p className='text-sm text-zinc-900 mb-3'>
                Connect with professionals who complement your skills and share
                your interests.
              </p>
              <ul className='space-y-2'>
                <li className='flex items-center gap-2 text-sm text-zinc-900'>
                  <CheckCircle className='w-4 h-4 text-brand-500 flex-shrink-0' />
                  <span>AI-powered matching</span>
                </li>
                <li className='flex items-center gap-2 text-sm text-zinc-900'>
                  <CheckCircle className='w-4 h-4 text-brand-500 flex-shrink-0' />
                  <span>Industry focus</span>
                </li>
                <li className='flex items-center gap-2 text-sm text-zinc-900'>
                  <CheckCircle className='w-4 h-4 text-brand-500 flex-shrink-0' />
                  <span>Goal alignment</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 - Real-time Chat */}
            <div className='bg-white rounded-lg p-5 border border-zinc-200 h-full'>
              <div className='w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center mb-3'>
                <Zap className='w-5 h-5 text-brand-500' />
              </div>
              <h3 className='text-lg font-medium text-zinc-900 mb-2'>
                Instant Connections
              </h3>
              <p className='text-sm text-zinc-900 mb-3'>
                Start conversations immediately when you find the right match.
              </p>
              <ul className='space-y-2'>
                <li className='flex items-center gap-2 text-sm text-zinc-900'>
                  <CheckCircle className='w-4 h-4 text-brand-500 flex-shrink-0' />
                  <span>Real-time messaging</span>
                </li>
                <li className='flex items-center gap-2 text-sm text-zinc-900'>
                  <CheckCircle className='w-4 h-4 text-brand-500 flex-shrink-0' />
                  <span>Professional topics</span>
                </li>
                <li className='flex items-center gap-2 text-sm text-zinc-900'>
                  <CheckCircle className='w-4 h-4 text-brand-500 flex-shrink-0' />
                  <span>Meaningful discussions</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 - Quality Network */}
            <div className='bg-white rounded-lg p-5 border border-zinc-200 h-full'>
              <div className='w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center mb-3'>
                <MessageCircle className='w-5 h-5 text-brand-500' />
              </div>
              <h3 className='text-lg font-medium text-zinc-900 mb-2'>
                Quality Conversations
              </h3>
              <p className='text-sm text-zinc-900 mb-3'>
                Build lasting professional relationships through genuine
                interactions.
              </p>
              <ul className='space-y-2'>
                <li className='flex items-center gap-2 text-sm text-zinc-900'>
                  <CheckCircle className='w-4 h-4 text-brand-500 flex-shrink-0' />
                  <span>Verified professionals</span>
                </li>
                <li className='flex items-center gap-2 text-sm text-zinc-900'>
                  <CheckCircle className='w-4 h-4 text-brand-500 flex-shrink-0' />
                  <span>Privacy focused</span>
                </li>
                <li className='flex items-center gap-2 text-sm text-zinc-900'>
                  <CheckCircle className='w-4 h-4 text-brand-500 flex-shrink-0' />
                  <span>Meaningful connections</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className='text-center mt-28'>
            <Link href={authLink}>
              <button className='inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-500 text-white px-10 py-4 rounded-lg text-lg font-medium transition-all duration-200 group'>
                {ctaText}
                <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className='py-16 sm:py-20 bg-zinc-100'>
        {/* Background decoration */}
        <div className='absolute inset-0 -z-10'>
          <div className='absolute top-1/3 right-0 w-96 h-96 bg-brand-100/20 rounded-full blur-3xl' />
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Section Header */}
          <div className='text-center max-w-3xl mx-auto mb-12'>
            <h2 className='text-2xl sm:text-3xl lg:text-4xl font-medium text-zinc-900 mb-4'>
              Your journey to meaningful{' '}
              <span className='text-brand-500'>connections</span>
            </h2>
            <p className='text-base text-zinc-900'>
              A simple three-step process to start building your professional
              network.
            </p>
          </div>

          {/* Steps */}
          <div className='grid lg:grid-cols-3 gap-6 relative'>
            {/* Step 1 */}
            <div className='relative'>
              <div className='bg-white rounded-lg p-5 border border-zinc-200 relative h-full'>
                {/* Step number */}
                <div className='absolute -top-2.5 right-3 w-7 h-7 bg-brand-500 rounded-full flex items-center justify-center text-white font-medium text-sm'>
                  1
                </div>
                {/* Content */}
                <h3 className='text-lg font-medium text-zinc-900 mb-2'>
                  Create Your Profile
                </h3>
                <p className='text-sm text-zinc-900'>
                  Build your professional identity with your expertise and
                  goals. Focus on what matters for meaningful connections.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className='relative'>
              <div className='bg-white rounded-lg p-5 border border-zinc-200 relative h-full'>
                {/* Step number */}
                <div className='absolute -top-2.5 right-3 w-7 h-7 bg-brand-500 rounded-full flex items-center justify-center text-white font-medium text-sm'>
                  2
                </div>
                {/* Content */}
                <h3 className='text-lg font-medium text-zinc-900 mb-2'>
                  Get Matched
                </h3>
                <p className='text-sm text-zinc-900'>
                  Our smart algorithm connects you with professionals who share
                  your interests and complement your expertise.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className='relative'>
              <div className='bg-white rounded-lg p-5 border border-zinc-200 relative h-full'>
                {/* Step number */}
                <div className='absolute -top-2.5 right-3 w-7 h-7 bg-brand-500 rounded-full flex items-center justify-center text-white font-medium text-sm'>
                  3
                </div>
                {/* Content */}
                <h3 className='text-lg font-medium text-zinc-900 mb-2'>
                  Start Connecting
                </h3>
                <p className='text-sm text-zinc-900'>
                  Have meaningful conversations with professionals that match
                  your career interests and goals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className='py-16 sm:py-20 bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-10'>
            <h2 className='text-2xl sm:text-3xl lg:text-4xl font-medium text-zinc-900 mb-3'>
              Professionals love Loopn
            </h2>
            <p className='text-base text-zinc-900 max-w-3xl mx-auto'>
              Join thousands who have transformed their networking experience
            </p>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
            <div className='bg-white border border-zinc-200 rounded-lg p-5'>
              <div className='flex items-center gap-1 mb-3'>
                {['star1', 'star2', 'star3', 'star4', 'star5'].map(starId => (
                  <Star
                    key={`testimonial-1-${starId}`}
                    className='w-4 h-4 text-yellow-400 fill-current'
                  />
                ))}
              </div>
              <blockquote className='text-zinc-900 mb-3 text-sm'>
                &quot;Loopn made networking feel natural again. I&apos;ve made
                genuine connections through honest conversations about shared
                professional interests.&quot;
              </blockquote>
              <div className='flex items-center gap-3'>
                <div className='w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center'>
                  <User className='w-4 h-4 text-brand-500' />
                </div>
                <div>
                  <p className='font-medium text-zinc-900 text-sm'>
                    Software Engineer
                  </p>
                  <p className='text-zinc-500 text-sm'>Tech Startup</p>
                </div>
              </div>
            </div>

            <div className='bg-white border border-zinc-200 rounded-lg p-5'>
              <div className='flex items-center gap-1 mb-3'>
                {['star1', 'star2', 'star3', 'star4', 'star5'].map(starId => (
                  <Star
                    key={`testimonial-2-${starId}`}
                    className='w-4 h-4 text-yellow-400 fill-current'
                  />
                ))}
              </div>
              <blockquote className='text-zinc-900 mb-3 text-sm'>
                &quot;The smart matching is brilliant. I found a mentor through
                professional conversations who&apos;s now become a valuable
                connection in my career.&quot;
              </blockquote>
              <div className='flex items-center gap-3'>
                <div className='w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center'>
                  <User className='w-4 h-4 text-brand-500' />
                </div>
                <div>
                  <p className='font-medium text-zinc-900 text-sm'>
                    Product Manager
                  </p>
                  <p className='text-zinc-500 text-sm'>E-commerce</p>
                </div>
              </div>
            </div>

            <div className='bg-white border border-zinc-200 rounded-lg p-5'>
              <div className='flex items-center gap-1 mb-3'>
                {['star1', 'star2', 'star3', 'star4', 'star5'].map(starId => (
                  <Star
                    key={`testimonial-3-${starId}`}
                    className='w-4 h-4 text-yellow-400 fill-current'
                  />
                ))}
              </div>
              <blockquote className='text-zinc-900 mb-3 text-sm'>
                &quot;Finally, a platform where expertise matters more than
                titles. The conversations are meaningful and focused on
                professional growth.&quot;
              </blockquote>
              <div className='flex items-center gap-3'>
                <div className='w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center'>
                  <User className='w-4 h-4 text-brand-500' />
                </div>
                <div>
                  <p className='font-medium text-zinc-900 text-sm'>
                    UX Designer
                  </p>
                  <p className='text-zinc-500 text-sm'>Design Agency</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-zinc-100 py-10 border-t border-zinc-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex flex-col items-center justify-center'>
            <div className='flex items-center space-x-2 mb-3'>
              <Image src='/loopn.svg' alt='Loopn' width={32} height={32} />
              <span className='text-xl font-bold text-zinc-900'>Loopn</span>
            </div>
            <p className='text-zinc-900 text-center max-w-md mb-3 text-sm'>
              Loopn is the professional networking platform that helps you build
              meaningful connections through smart matching and genuine
              conversations.
            </p>
            <p className='text-zinc-500 text-sm'>
              © {new Date().getFullYear()} Loopn. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
