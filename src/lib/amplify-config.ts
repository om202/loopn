import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';

import type { Schema } from '../../amplify/data/resource';
import outputs from '../../amplify_outputs.json';

// Configure Amplify immediately when this module loads
// Configure for both server and client
Amplify.configure(outputs, { ssr: true });

export const client = generateClient<Schema>();
