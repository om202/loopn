import type { EventBridgeHandler } from 'aws-lambda';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
// @ts-ignore - This will be available at runtime
import { env } from '$amplify/env/presence-cleanup';
import type { Schema } from '../../data/resource';

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>();

export const handler: EventBridgeHandler<
  'Scheduled Event',
  null,
  void
> = async event => {
  try {
    console.log('Starting presence cleanup...');

    // Calculate 2 minutes ago
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    // Find users who are marked online but haven't been seen for 2+ minutes
    const staleUsers = await client.models.UserPresence.list({
      filter: {
        isOnline: { eq: true },
        lastSeen: { lt: twoMinutesAgo.toISOString() },
      },
    });

    if (!staleUsers.data || staleUsers.data.length === 0) {
      console.log('No stale users found');
      return;
    }

    console.log(`Found ${staleUsers.data.length} stale users, marking offline`);

    // Mark them offline
    const updatePromises = staleUsers.data.map(user =>
      client.models.UserPresence.update({
        userId: user.userId,
        isOnline: false,
        status: 'OFFLINE',
        lastSeen: new Date().toISOString(),
      })
    );

    await Promise.all(updatePromises);

    console.log(`Successfully marked ${staleUsers.data.length} users offline`);
  } catch (error) {
    console.error('Presence cleanup error:', error);
    throw error;
  }
};
