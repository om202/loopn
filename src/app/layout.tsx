import type { Metadata } from 'next';
import localFont from 'next/font/local';

import './globals.css';

const switzer = localFont({
  src: '../../public/fonts/Switzer/Switzer-Variable.woff2',
  display: 'swap',
  variable: '--font-switzer',
});
import AmplifyProvider from './amplify-provider';
import { RealtimeProvider } from '@/contexts/RealtimeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { GlobalSubscriptionProvider } from '@/contexts/GlobalSubscriptionContext';
import GoogleAnalytics, { PageTracker } from '@/components/GoogleAnalytics';
import { StandardWebAppAnalytics } from '@/components/analytics/StandardWebAppAnalytics';

export const metadata: Metadata = {
  title: 'Loopn - Professional Networking & Career Matching using AI',
  description:
    'Upload your resume, get matched instantly with compatible professionals. Career networking using AI that connects you with the right people for meaningful professional relationships and career advancement.',
  keywords: [
    'professional networking using AI',
    'resume-based career matching',
    'professional networking platform',
    'career advancement connections',
    'resume intelligence matching',
    'professional discovery app',
    'career networking using AI',
    'professional relationship building',
    'career-focused networking',
    'intelligent professional matching',
    'resume analysis networking',
    'career growth platform',
  ],
  authors: [{ name: 'Loopn Team' }],
  creator: 'Loopn',
  publisher: 'Loopn',
  category: 'Professional Networking',
  openGraph: {
    title: 'Loopn - Professional Networking & Career Matching using AI',
    description:
      'Upload your resume, get matched instantly with compatible professionals. Career networking using AI that connects you with the right people for meaningful professional relationships.',
    type: 'website',
    siteName: 'Loopn',
    locale: 'en_US',
    url: 'https://www.loopn.io',
    images: [
      {
        url: 'https://www.loopn.io/loopn.png',
        width: 1200,
        height: 630,
        alt: 'Loopn - Professional Networking & Career Matching using AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Loopn - Professional Networking & Career Matching using AI',
    description:
      'Upload your resume, get matched instantly with compatible professionals. Career networking using AI for meaningful professional relationships.',
    images: ['https://www.loopn.io/loopn.png'],
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
  alternates: {
    canonical: 'https://www.loopn.io',
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
        <link rel='manifest' href='/manifest.json' />
        <meta name='theme-color' content='#0ea5e9' />
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-status-bar-style' content='default' />
        <meta name='apple-mobile-web-app-title' content='Loopn' />
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Loopn',
              description:
                'Professional networking platform using AI that connects professionals through resume-based career matching for meaningful career advancement.',
              url: 'https://www.loopn.io',
              logo: 'https://www.loopn.io/loopn.png',
              foundingDate: '2024',
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'customer support',
                email: 'support@loopn.io',
              },
              applicationCategory: 'Professional Networking',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
                description: 'Free professional networking platform',
              },
              audience: {
                '@type': 'Audience',
                audienceType:
                  'Professionals seeking career advancement and networking opportunities',
              },
            }),
          }}
        />
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Loopn',
              url: 'https://www.loopn.io',
              description:
                'Professional networking platform using AI for career matching and professional relationship building',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://www.loopn.io/search?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
              publisher: {
                '@type': 'Organization',
                name: 'Loopn',
                logo: 'https://www.loopn.io/loopn.png',
              },
            }),
          }}
        />
      </head>
      <body className={`${switzer.variable} antialiased`}>
        <AmplifyProvider>
          <AuthProvider>
            <RealtimeProvider>
              <GlobalSubscriptionProvider>
                {children}
                
                {/* Google Analytics 4 Tracking - Inside AuthProvider */}
                <GoogleAnalytics />
                <PageTracker />
                <StandardWebAppAnalytics />
              </GlobalSubscriptionProvider>
            </RealtimeProvider>
          </AuthProvider>
        </AmplifyProvider>
      </body>
    </html>
  );
}
