import { ArrowRight, Sparkles, Zap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className='min-h-screen bg-white'>
      {/* Header */}
      <header className='px-6 py-4'>
        <div className='max-w-6xl mx-auto flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <Image src='/loopn.svg' alt='Loopn' width={32} height={32} />
            <span className='text-xl font-bold text-gray-900'>Loopn</span>
          </div>
          <Link
            href='/auth'
            className='text-gray-600 hover:text-gray-900 font-medium'
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className='px-6 pt-20 pb-32'>
        <div className='max-w-4xl mx-auto text-center'>
          <div className='mb-8'>
            <div className='inline-flex items-center space-x-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-6'>
              <Sparkles className='w-4 h-4' />
              <span>Join the network that actually works</span>
            </div>
            <h1 className='text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight'>
              Meet your next
              <br />
              <span className='bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'>
                opportunity
              </span>
            </h1>
            <p className='text-xl text-gray-600 mb-10 max-w-2xl mx-auto'>
              The professional network where meaningful connections happen
              naturally.
            </p>
          </div>

          <div className='mb-16'>
            <Link
              href='/auth'
              className='bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-700 transition-all duration-200 inline-flex items-center group shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
            >
              Get Started
              <ArrowRight className='ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform' />
            </Link>
          </div>

          {/* Social Proof Hint */}
          <div className='flex items-center justify-center space-x-8 text-gray-400'>
            <div className='flex items-center space-x-2'>
              <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse' />
              <span className='text-sm'>Live connections happening now</span>
            </div>
          </div>
        </div>
      </section>

      {/* Mysterious Visual */}
      <section className='px-6 pb-32'>
        <div className='max-w-5xl mx-auto'>
          <div className='relative'>
            {/* Blurred background cards to create intrigue */}
            <div className='absolute inset-0 bg-gradient-to-r from-indigo-100 via-purple-50 to-pink-100 rounded-3xl transform rotate-1' />
            <div className='relative bg-white rounded-2xl shadow-2xl p-8 md:p-12 border'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-12 items-center'>
                <div>
                  <h2 className='text-3xl font-bold text-gray-900 mb-4'>
                    Networking that feels natural
                  </h2>
                  <p className='text-gray-600 mb-6'>
                    No more awkward cold messages or endless scrolling. Connect
                    with the right people at the right time.
                  </p>
                  <div className='flex items-center space-x-2 text-indigo-600'>
                    <Zap className='w-5 h-5' />
                    <span className='font-medium'>
                      Smart. Simple. Effective.
                    </span>
                  </div>
                </div>

                <div className='relative'>
                  {/* Teaser interface - just enough to intrigue */}
                  <div className='bg-gray-50 rounded-xl p-6 space-y-4'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-medium text-gray-500'>
                        AVAILABLE NOW
                      </span>
                      <div className='w-2 h-2 bg-green-500 rounded-full' />
                    </div>

                    <div className='space-y-3'>
                      <div className='bg-white rounded-lg p-4 shadow-sm'>
                        <div className='flex items-center space-x-3'>
                          <div className='w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full' />
                          <div className='flex-1'>
                            <div className='h-3 bg-gray-200 rounded w-24 mb-2' />
                            <div className='h-2 bg-gray-100 rounded w-16' />
                          </div>
                          <div className='w-16 h-6 bg-indigo-100 rounded-full' />
                        </div>
                      </div>

                      <div className='bg-white rounded-lg p-4 shadow-sm border-l-4 border-indigo-500'>
                        <div className='flex items-center space-x-3'>
                          <div className='w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full' />
                          <div className='flex-1'>
                            <div className='h-3 bg-gray-200 rounded w-32 mb-2' />
                            <div className='h-2 bg-indigo-100 rounded w-20' />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Overlay to create mystery */}
                  <div className='absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent rounded-xl pointer-events-none' />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simple value props */}
      <section className='px-6 py-24 bg-gray-50'>
        <div className='max-w-4xl mx-auto text-center'>
          <h2 className='text-3xl font-bold text-gray-900 mb-12'>
            Why professionals choose Loopn
          </h2>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            <div className='text-center'>
              <div className='text-4xl mb-4'>⚡</div>
              <h3 className='font-semibold text-gray-900 mb-2'>Instant</h3>
              <p className='text-gray-600 text-sm'>Connect when it matters</p>
            </div>

            <div className='text-center'>
              <div className='text-4xl mb-4'>🎯</div>
              <h3 className='font-semibold text-gray-900 mb-2'>Relevant</h3>
              <p className='text-gray-600 text-sm'>Meet the right people</p>
            </div>

            <div className='text-center'>
              <div className='text-4xl mb-4'>🔒</div>
              <h3 className='font-semibold text-gray-900 mb-2'>Private</h3>
              <p className='text-gray-600 text-sm'>Your data, your control</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className='px-6 py-24'>
        <div className='max-w-3xl mx-auto text-center'>
          <h2 className='text-4xl font-bold text-gray-900 mb-6'>
            Ready to network differently?
          </h2>
          <p className='text-xl text-gray-600 mb-10'>
            Join thousands of professionals building meaningful connections.
          </p>
          <Link
            href='/auth'
            className='bg-indigo-600 text-white px-10 py-5 rounded-xl text-xl font-semibold hover:bg-indigo-700 transition-all duration-200 inline-flex items-center group shadow-lg hover:shadow-xl transform hover:-translate-y-1'
          >
            Start Connecting
            <ArrowRight className='ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform' />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className='px-6 py-8 border-t border-gray-100'>
        <div className='max-w-6xl mx-auto flex items-center justify-center'>
          <div className='flex items-center space-x-2 text-gray-500'>
            <Image src='/loopn.svg' alt='Loopn' width={20} height={20} />
            <span className='text-sm'>
              © 2024 Loopn • Built for professionals
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
