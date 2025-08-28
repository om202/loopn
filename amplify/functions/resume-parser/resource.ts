import { defineFunction } from '@aws-amplify/backend';

export const resumeParser = defineFunction({
  name: 'resume-parser',
  entry: './handler.ts',
  runtime: 20,
  timeoutSeconds: 60,
  memoryMB: 512,
});
