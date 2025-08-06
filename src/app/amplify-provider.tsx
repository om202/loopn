'use client';

import { Authenticator, ThemeProvider } from '@aws-amplify/ui-react';
import { Amplify } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';

import outputs from '../../amplify_outputs.json';
import { amplifyTheme } from '../lib/amplify-theme';
import { amplifyInitialization } from '../lib/amplify-initialization';

// Configure Amplify immediately
Amplify.configure(outputs, {
  ssr: true,
});

// Initialize Amplify service immediately (fire-and-forget)
amplifyInitialization.initialize().catch(console.error);

export default function AmplifyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={amplifyTheme}>
      <Authenticator.Provider>{children}</Authenticator.Provider>
    </ThemeProvider>
  );
}
