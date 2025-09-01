'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Mail, MessageSquare, Clock, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  return (
    <main className='min-h-screen bg-white'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b border-gray-200'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
          <div className='flex items-center justify-between'>
            <Link href='/home' className='flex items-center space-x-3'>
              <Image src='/loopn.svg' alt='Loopn' width={32} height={32} />
              <span className='text-xl font-medium text-gray-900'>Loopn</span>
            </Link>
            <Link
              href='/home'
              className='text-gray-600 hover:text-gray-900 font-medium'
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Contact Content */}
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='text-center mb-12'>
          <h1 className='text-3xl font-semibold text-gray-900 mb-4'>
            Contact Us
          </h1>
          <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
            Have questions, feedback, or need support? We&apos;d love to hear from you.
            Get in touch and we&apos;ll get back to you as soon as possible.
          </p>
        </div>

        <div className='grid md:grid-cols-2 gap-12 mb-12'>
          {/* Contact Information */}
          <div>
            <h2 className='text-2xl font-semibold text-gray-900 mb-6'>
              Get in Touch
            </h2>
            
            {/* Email Contact */}
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6'>
              <div className='flex items-start space-x-4'>
                <div className='flex-shrink-0'>
                  <Mail className='w-6 h-6 text-blue-600' />
                </div>
                <div>
                  <h3 className='text-lg font-medium text-blue-900 mb-2'>
                    Email Support
                  </h3>
                  <p className='text-blue-700 mb-3'>
                    Send us an email and we&apos;ll respond within 24 hours.
                  </p>
                  <a
                    href='mailto:exonary.build@gmail.com'
                    className='inline-flex items-center text-blue-600 hover:text-blue-800 font-medium'
                  >
                    exonary.build@gmail.com
                    <svg
                      className='w-4 h-4 ml-1'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Response Time */}
            <div className='bg-green-50 border border-green-200 rounded-lg p-6'>
              <div className='flex items-start space-x-4'>
                <div className='flex-shrink-0'>
                  <Clock className='w-6 h-6 text-green-600' />
                </div>
                <div>
                  <h3 className='text-lg font-medium text-green-900 mb-2'>
                    Response Time
                  </h3>
                  <p className='text-green-700'>
                    We typically respond within 24 hours during business days.
                    For urgent technical issues, we aim to respond within 4-6 hours.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form Alternative */}
          <div>
            <h2 className='text-2xl font-semibold text-gray-900 mb-6'>
              What Can We Help With?
            </h2>
            
            <div className='space-y-4'>
              {/* Support Categories */}
              <div className='border border-gray-200 rounded-lg p-4'>
                <div className='flex items-start space-x-3'>
                  <CheckCircle className='w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0' />
                  <div>
                    <h4 className='font-medium text-gray-900 mb-1'>
                      Technical Support
                    </h4>
                    <p className='text-sm text-gray-600'>
                      Issues with login, profile setup, messaging, or app functionality
                    </p>
                  </div>
                </div>
              </div>

              <div className='border border-gray-200 rounded-lg p-4'>
                <div className='flex items-start space-x-3'>
                  <CheckCircle className='w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0' />
                  <div>
                    <h4 className='font-medium text-gray-900 mb-1'>
                      Account Questions
                    </h4>
                    <p className='text-sm text-gray-600'>
                      Profile visibility, privacy settings, data deletion, or account management
                    </p>
                  </div>
                </div>
              </div>

              <div className='border border-gray-200 rounded-lg p-4'>
                <div className='flex items-start space-x-3'>
                  <CheckCircle className='w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0' />
                  <div>
                    <h4 className='font-medium text-gray-900 mb-1'>
                      Platform Feedback
                    </h4>
                    <p className='text-sm text-gray-600'>
                      Feature requests, suggestions, or general feedback about Loopn
                    </p>
                  </div>
                </div>
              </div>

              <div className='border border-gray-200 rounded-lg p-4'>
                <div className='flex items-start space-x-3'>
                  <CheckCircle className='w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0' />
                  <div>
                    <h4 className='font-medium text-gray-900 mb-1'>
                      Business Inquiries
                    </h4>
                    <p className='text-sm text-gray-600'>
                      Partnerships, press inquiries, or business development
                    </p>
                  </div>
                </div>
              </div>

              <div className='border border-gray-200 rounded-lg p-4'>
                <div className='flex items-start space-x-3'>
                  <CheckCircle className='w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0' />
                  <div>
                    <h4 className='font-medium text-gray-900 mb-1'>
                      Privacy & Legal
                    </h4>
                    <p className='text-sm text-gray-600'>
                      Questions about our Privacy Policy, Terms of Service, or data practices
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Email Tips */}
        <div className='bg-gray-50 border border-gray-200 rounded-lg p-6'>
          <h3 className='text-lg font-medium text-gray-900 mb-4'>
            📧 Email Tips for Faster Support
          </h3>
          <div className='grid md:grid-cols-2 gap-6 text-sm text-gray-700'>
            <div>
              <h4 className='font-medium text-gray-900 mb-2'>Include in your email:</h4>
              <ul className='space-y-1 text-sm'>
                <li>• Clear subject line describing the issue</li>
                <li>• Your account email address</li>
                <li>• Steps to reproduce any technical issues</li>
                <li>• Screenshots if helpful</li>
              </ul>
            </div>
            <div>
              <h4 className='font-medium text-gray-900 mb-2'>Sample subject lines:</h4>
              <ul className='space-y-1 text-sm text-gray-600'>
                <li>• &quot;Login Issue - Cannot Access Account&quot;</li>
                <li>• &quot;Feature Request - Export Conversations&quot;</li>
                <li>• &quot;Privacy Question - Data Deletion&quot;</li>
                <li>• &quot;Bug Report - Messages Not Sending&quot;</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className='mt-12 text-center'>
          <h3 className='text-lg font-medium text-gray-900 mb-4'>
            Quick Links
          </h3>
          <div className='flex flex-wrap justify-center gap-4'>
            <Link
              href='/privacy'
              className='text-blue-600 hover:text-blue-800 font-medium'
            >
              Privacy Policy
            </Link>
            <span className='text-gray-400'>•</span>
            <Link
              href='/terms'
              className='text-blue-600 hover:text-blue-800 font-medium'
            >
              Terms of Service
            </Link>
            <span className='text-gray-400'>•</span>
            <Link
              href='/home'
              className='text-blue-600 hover:text-blue-800 font-medium'
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className='bg-slate-50 py-8 border-t border-gray-200'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <div className='flex items-center justify-center space-x-3 mb-4'>
              <Image src='/loopn.svg' alt='Loopn' width={32} height={32} />
              <span className='text-xl font-medium text-gray-900'>Loopn</span>
            </div>
            <p className='text-gray-600 text-sm mb-6'>
              Professional networking that actually matters
            </p>
            <div className='flex justify-center items-center gap-6 mb-6'>
              <Link
                href='/privacy'
                className='text-gray-600 text-sm font-medium hover:underline'
              >
                Privacy Policy
              </Link>
              <Link
                href='/terms'
                className='text-gray-600 text-sm font-medium hover:underline'
              >
                Terms of Service
              </Link>
              <Link
                href='/contact'
                className='text-gray-600 text-sm font-medium hover:underline'
              >
                Contact Us
              </Link>
              <Link
                href='/home'
                className='text-gray-600 text-sm font-medium hover:underline'
              >
                Home
              </Link>
            </div>
            <p className='text-gray-600 text-sm'>
              © 2025 Loopn. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
