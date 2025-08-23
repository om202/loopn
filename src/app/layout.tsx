import type { Metadata } from 'next';
import localFont from 'next/font/local';

import './globals.css';

const atkinson = localFont({
  src: [
    {
      path: '../../public/fonts/Atkinson/atkinson-hyperlegible-next-latin-200-normal.woff2',
      weight: '200',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Atkinson/atkinson-hyperlegible-next-latin-200-italic.woff2',
      weight: '200',
      style: 'italic',
    },
    {
      path: '../../public/fonts/Atkinson/atkinson-hyperlegible-next-latin-300-normal.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Atkinson/atkinson-hyperlegible-next-latin-300-italic.woff2',
      weight: '300',
      style: 'italic',
    },
    {
      path: '../../public/fonts/Atkinson/atkinson-hyperlegible-next-latin-400-normal.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Atkinson/atkinson-hyperlegible-next-latin-400-italic.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../../public/fonts/Atkinson/atkinson-hyperlegible-next-latin-500-normal.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Atkinson/atkinson-hyperlegible-next-latin-500-italic.woff2',
      weight: '500',
      style: 'italic',
    },
    {
      path: '../../public/fonts/Atkinson/atkinson-hyperlegible-next-latin-600-normal.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Atkinson/atkinson-hyperlegible-next-latin-600-italic.woff2',
      weight: '600',
      style: 'italic',
    },
    {
      path: '../../public/fonts/Atkinson/atkinson-hyperlegible-next-latin-700-normal.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Atkinson/atkinson-hyperlegible-next-latin-700-italic.woff2',
      weight: '700',
      style: 'italic',
    },
    {
      path: '../../public/fonts/Atkinson/atkinson-hyperlegible-next-latin-800-normal.woff2',
      weight: '800',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Atkinson/atkinson-hyperlegible-next-latin-800-italic.woff2',
      weight: '800',
      style: 'italic',
    },
  ],
  display: 'swap',
  variable: '--font-atkinson',
});
import AmplifyProvider from './amplify-provider';
import { RealtimeProvider } from '@/contexts/RealtimeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { GlobalSubscriptionProvider } from '@/contexts/GlobalSubscriptionContext';

export const metadata: Metadata = {
  title: 'Loopn - Real-Time Messaging Platform',
  description:
    'Connect and chat with people instantly. Secure real-time messaging with chat requests, user presence, message reactions, and time-limited conversations.',
  keywords: [
    'real-time messaging',
    'chat platform',
    'instant messaging',
    'secure chat',
    'online communication',
    'message reactions',
    'user presence',
    'chat requests',
  ],
  authors: [{ name: 'Loopn Team' }],
  openGraph: {
    title: 'Loopn - Real-Time Messaging Platform',
    description:
      'Connect and chat with people instantly. Secure real-time messaging with chat requests, user presence, message reactions, and time-limited conversations.',
    type: 'website',
    siteName: 'Loopn',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Loopn - Real-Time Messaging Platform',
    description:
      'Connect and chat with people instantly. Secure real-time messaging with chat requests, user presence, message reactions, and time-limited conversations.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  formatDetection: {
    telephone: false,
    email: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <head>
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1, viewport-fit=cover'
        />
        <meta name='format-detection' content='telephone=no,email=no' />
      </head>
      <body className={`${atkinson.variable} antialiased`}>
        <AmplifyProvider>
          <AuthProvider>
            <RealtimeProvider>
              <GlobalSubscriptionProvider>
                {children}
              </GlobalSubscriptionProvider>
            </RealtimeProvider>
          </AuthProvider>
        </AmplifyProvider>
      </body>
    </html>
  );
}
