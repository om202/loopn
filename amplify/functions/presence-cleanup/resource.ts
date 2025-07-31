import { defineFunction } from '@aws-amplify/backend';

export const presenceCleanup = defineFunction({
  name: 'presence-cleanup',
  schedule: 'every 1m', // Run every minute
});
