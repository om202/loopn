import { defineFunction } from '@aws-amplify/backend';

export const presenceCleanup = defineFunction({
  name: 'presence-cleanup',
  schedule: 'every 5m', // Run every 5 minutes - reduce to 'every 2m' when users > 500 for better real-time experience
  memoryMB: 64,         // Minimal for low user count - increase to 128MB when users > 200
});
