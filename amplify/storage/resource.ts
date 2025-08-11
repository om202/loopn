import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'loopnUserData',
  access: allow => ({
    'profile-pictures/{entity_id}/*': [
      // Users can only access their own profile pictures
      allow.entity('identity').to(['read', 'write', 'delete']),
    ],
    'profile-pictures/public/*': [
      // Public read access for processed thumbnails
      allow.authenticated.to(['read']),
      allow.guest.to(['read']),
    ],
  }),
});
