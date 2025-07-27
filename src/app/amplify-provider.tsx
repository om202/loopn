'use client';

import { Authenticator, ThemeProvider } from '@aws-amplify/ui-react';
import { Amplify } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';

import outputs from '../../amplify_outputs.json';
import { amplifyTheme } from '../lib/amplify-theme';

Amplify.configure(outputs, {
  ssr: true,
});

export default function AmplifyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={amplifyTheme}>
      <Authenticator.Provider>
        {children}
      </Authenticator.Provider>
    </ThemeProvider>
  );
}
