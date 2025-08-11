import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'loopnUserData',
  access: allow => ({
    'public/profile-pictures/*': [
      // Authenticated users can manage profile pictures in public bucket
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
  }),
});
