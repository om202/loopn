import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';

import type { Schema } from '../../amplify/data/resource';
import outputs from '../../amplify_outputs.json';

// Configure Amplify immediately when this module loads
// Configure for both server and client
Amplify.configure(outputs, { ssr: true });

// Lazy client generation
let client: ReturnType<typeof generateClient<Schema>> | null = null;

export const getClient = () => {
  if (!client) {
    client = generateClient<Schema>();
  }
  return client;
};
