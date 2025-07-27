import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';

import type { Schema } from '../../amplify/data/resource';
import outputs from '../../amplify_outputs.json';

Amplify.configure(outputs);

export const client = generateClient<Schema>();
