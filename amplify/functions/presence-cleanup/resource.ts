import { defineFunction } from '@aws-amplify/backend';

export const presenceCleanup = defineFunction({
  name: 'presence-cleanup',
  schedule: 'every 5m', // Run every 5 minutes - reduce to 'every 2m' when users > 500 for better real-time experience
  memoryMB: 128, // AWS minimum - increase to 256MB when users > 500
});
