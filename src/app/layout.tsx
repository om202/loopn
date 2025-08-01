import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';
import AmplifyProvider from './amplify-provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Loopn App',
  description: 'Full-stack app with Amplify authentication',
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
        <meta name='format-detection' content='telephone=no,email=no' />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <AmplifyProvider>{children}</AmplifyProvider>
      </body>
    </html>
  );
}
