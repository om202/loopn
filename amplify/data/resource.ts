import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { presenceCleanup } from '../functions/presence-cleanup/resource';
import { vespaClient } from '../functions/vespa-client/resource';

/*== LOOPN CHAT APP SCHEMA ==============================================
This schema implements the Loopn user story:

1. User sees AI-chosen professionals online (anonymous profiles)
2. Sends "Chat Request" to start chatting
3. If accepted, they can chat permanently (immediate connection)
4. All conversations are permanent with full chat history

Models:
- ChatRequest: Request to start chatting with someone
- UserConnection: Connection status between users (optional enhancement)
- Conversation: Chat between two users (always permanent)
- Message: Individual messages within conversations
- UserPresence: Online/offline status tracking

// TODO: Later features to implement:
// - User profiles with AI-generated descriptions
// - AI matching system for showing relevant professionals
// - Anonymous profile display (job title, field only)
=========================================================================*/

const schema = a
  .schema({
    // Vespa AI user search - enhanced with vector search and hybrid ranking
    searchUsers: a
      .query()
      .arguments({
        action: a.string().required(),
        query: a.string(),
        userId: a.string(),
        userProfile: a.json(),
        limit: a.integer(),
        filters: a.json(),
        rankingProfile: a.string(), // New: support for different ranking profiles
        queryVector: a.json(), // New: support for vector search
      })
      .returns(a.json())
      .authorization(allow => [allow.authenticated()])
      .handler(a.handler.function(vespaClient)),

    // Request to start chatting with someone (Step 1)
    ChatRequest: a
      .model({
        id: a.id().required(),
        requesterId: a.string().required(), // User who wants to start chatting
        receiverId: a.string().required(), // Professional being requested
        status: a.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED']),
        requestedAt: a.datetime(),
        respondedAt: a.datetime(),
        // Chat requests expire after 24 hours if no response
        expiresAt: a.datetime(), // TTL field for DynamoDB
        // TODO: Later add requestMessage field for custom chat request message
      })
      .authorization(allow => [allow.authenticated()])
      .secondaryIndexes(index => [
        // Find all chat requests for a user (both sent and received)
        index('requesterId').sortKeys(['requestedAt']),
        index('receiverId').sortKeys(['requestedAt']),
      ]),



    // User connections (optional - can be used for friendship/networking features)
    UserConnection: a
      .model({
        id: a.id().required(),
        requesterId: a.string().required(), // User who wants to connect
        receiverId: a.string().required(), // User who received connection request
        conversationId: a.id().required(), // Which conversation this connection is for
        status: a.enum(['PENDING', 'ACCEPTED', 'REJECTED']),
        requestedAt: a.datetime(),
        respondedAt: a.datetime(),
        // Connection requests are permanent (no expiry)
      })
      .authorization(allow => [allow.authenticated()])
      .secondaryIndexes(index => [
        index('requesterId').sortKeys(['requestedAt']),
        index('receiverId').sortKeys(['requestedAt']),
        index('conversationId'), // Find connection request for a specific conversation
      ]),

    // Conversation between two users (always permanent)
    Conversation: a
      .model({
        id: a.id().required(),
        // The two participants in the conversation
        participant1Id: a.string().required(),
        participant2Id: a.string().required(),
        // All conversations are permanent by default
        isConnected: a.boolean().default(true), // Always connected from the start
        // Conversation metadata
        lastMessageAt: a.datetime(),
        lastMessageContent: a.string(), // Preview of last message
        lastMessageSenderId: a.string(), // Who sent the last message
        createdAt: a.datetime(),
        updatedAt: a.datetime(),
        // Note: All conversations are permanent and never auto-deleted
        // Multi-user authorization: both participants can access
        participants: a.string().array(),
      })
      .authorization(allow => [
        // Allow both participants to access the conversation
        allow.ownersDefinedIn('participants'),
      ])
      .secondaryIndexes(index => [
        // Find conversations for a specific user, sorted by last activity
        index('participant1Id').sortKeys(['lastMessageAt']),
        index('participant2Id').sortKeys(['lastMessageAt']),
      ]),

    // Individual messages within conversations
    Message: a
      .model({
        id: a.id().required(),
        conversationId: a.id().required(),
        senderId: a.string().required(),
        receiverId: a.string().required(),
        content: a.string().required(),
        messageType: a.enum(['TEXT', 'SYSTEM']), // SYSTEM for "User A wants to connect" notifications
        timestamp: a.datetime(),
        // For message ordering (timestamp + random suffix for uniqueness)
        sortKey: a.string().required(),
        // Message status
        isRead: a.boolean().default(false),
        readAt: a.datetime(),
        // Optional: for message editing/deleting
        isEdited: a.boolean().default(false),
        editedAt: a.datetime(),
        isDeleted: a.boolean().default(false),
        deletedAt: a.datetime(),
        // Reply functionality
        replyToMessageId: a.id(),
        // All messages are permanent and never auto-deleted
        // Multi-user authorization: both sender and receiver can access
        participants: a.string().array(),
      })
      .authorization(allow => [
        // Allow both participants (sender and receiver) to access the message
        allow.ownersDefinedIn('participants'),
      ])
      .secondaryIndexes(index => [
        // Get messages for a conversation, ordered by time
        index('conversationId').sortKeys(['sortKey']),
        // Get messages sent by a user
        index('senderId').sortKeys(['timestamp']),
      ]),

    // Message reactions
    MessageReaction: a
      .model({
        id: a.id().required(),
        messageId: a.id().required(),
        userId: a.string().required(),
        emoji: a.string().required(), // The emoji character
        timestamp: a.datetime().required(),
        // All reactions are permanent and never auto-deleted
        // Multi-user authorization: all participants can see reactions
        participants: a.string().array(),
      })
      .authorization(allow => [
        // Allow participants to view reactions
        allow.ownersDefinedIn('participants'),
      ])
      .secondaryIndexes(index => [
        // Get all reactions for a message
        index('messageId').sortKeys(['timestamp']),
        // Get all reactions by a user
        index('userId').sortKeys(['timestamp']),
      ]),

    // User profile data - all profile and onboarding information
    UserProfile: a
      .model({
        userId: a.string().required(),
        email: a.string(),
        // Profile information
        fullName: a.string(),
        jobRole: a.string(),
        companyName: a.string(),
        industry: a.string(),
        yearsOfExperience: a.integer(),
        education: a.string(),
        about: a.string(),
        interests: a.string().array(),
        skills: a.string().array(),
        // Profile picture fields
        profilePictureUrl: a.string(), // S3 URL for uploaded profile picture
        profilePictureThumbnailUrl: a.string(), // Optimized thumbnail version
        hasProfilePicture: a.boolean().default(false), // Quick check for avatar display
        // Onboarding status
        isOnboardingComplete: a.boolean().default(false),
        onboardingCompletedAt: a.datetime(),

        // TODO: Later add fields for AI matching:
        // - aiGeneratedDescription: a.string()
        // - isAvailableForChat: a.boolean()
      })
      .identifier(['userId'])
      .authorization(allow => [allow.authenticated()])
      .secondaryIndexes(index => [
        index('industry'), // For matching by industry
        index('onboardingCompletedAt'), // For finding completed profiles by date
        // TODO: Later add index for AI matching:
        // index('isAvailableForChat').sortKeys(['lastSeen'])
      ]),

    // User presence - only online/offline status and chat activity
    UserPresence: a
      .model({
        userId: a.string().required(),
        // Presence status
        isOnline: a.boolean().default(false),
        status: a.enum(['ONLINE', 'OFFLINE', 'BUSY']),
        lastSeen: a.datetime(),
        lastHeartbeat: a.datetime(),
        // Chat window activity tracking
        activeChatId: a.id(), // Which conversation they're actively viewing (null if not in any chat)
        lastChatActivity: a.datetime(), // Last time they were active in a chat window
      })
      .identifier(['userId'])
      .authorization(allow => [allow.authenticated()])
      .secondaryIndexes(index => [
        index('status'),
        index('activeChatId'), // Find users actively viewing a specific chat
        index('lastSeen'), // For finding recently active users
      ]),

    // Notification system for persistent notification storage
    Notification: a
      .model({
        id: a.id().required(),
        userId: a.string().required(), // User who should receive this notification
        type: a.enum(['chat_request', 'message', 'connection', 'system']),
        title: a.string().required(),
        content: a.string().required(),
        timestamp: a.datetime().required(),
        isRead: a.boolean().default(false),
        readAt: a.datetime(),
        // Additional data stored as JSON string (for flexibility)
        data: a.json(), // Will store ChatRequestWithUser, MessageNotificationData, etc.
        // Optional: reference to related entities
        chatRequestId: a.id(), // If type is 'chat_request'
        conversationId: a.id(), // If type is 'message' or 'connection'
        connectionRequestId: a.id(), // If type is 'connection'
        // TTL field - notifications expire after 30 days
        expiresAt: a.datetime(),
      })
      .authorization(allow => [
        // All authenticated users can access - we handle filtering in the service layer
        allow.authenticated(),
      ])
      .secondaryIndexes(index => [
        // Get all notifications for a user, sorted by time (newest first)
        index('userId').sortKeys(['timestamp']),
      ]),

    // Bug Report and Suggestions
    BugReport: a
      .model({
        id: a.id().required(),
        userId: a.string().required(),
        type: a.enum(['bug', 'suggestion']),
        title: a.string().required(),
        description: a.string().required(),
        reportedAt: a.datetime().required(),
      })
      .authorization(allow => [allow.authenticated()]),
  })
  .authorization(allow => [allow.resource(presenceCleanup)]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool', // Cognito User Pools for authentication
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

/*== LOOPN USER FLOW IMPLEMENTATION ====================================

STEP 1: Starting a Chat (Simplified)
```typescript
// User finds a designer and sends chat request
const sendChatRequest = async (designerId: string) => {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  await client.models.ChatRequest.create({
    requesterId: currentUser.userId,
    receiverId: designerId,
    status: 'PENDING',
    expiresAt: expiresAt.toISOString()
  });
};

// Designer accepts chat request - creates permanent conversation immediately
const acceptChatRequest = async (chatRequestId: string, requesterId: string, receiverId: string) => {
  // Update chat request
  await client.models.ChatRequest.update({
    id: chatRequestId,
    status: 'ACCEPTED',
    respondedAt: new Date().toISOString()
  });
  
  // Create permanent conversation immediately
  await client.models.Conversation.create({
    participant1Id: requesterId,
    participant2Id: receiverId,
    isConnected: true, // Always connected from the start
    participants: [requesterId, receiverId],
    createdAt: new Date().toISOString()
  });
};
```

STEP 2: Permanent Chat Management (Simplified)
```typescript
// All conversations are permanent - no probation period needed!
// Users can chat immediately and indefinitely

// Simple UI Component for Connected Status
const ConnectionStatus = ({ conversation }) => {
  return (
    <div className="connection-status">
      <div>✅ Connected - Chat anytime!</div>
    </div>
  );
};
```

STEP 3: Optional Connection Enhancement (Future Feature)
```typescript
// Optional: Users can send connection requests for networking/friendship
// Note: All chats are already permanent, this is just for social features

const sendConnectionRequest = async (conversationId: string, receiverId: string) => {
  await client.models.UserConnection.create({
    requesterId: currentUser.userId,
    receiverId,
    conversationId,
    status: 'PENDING',
    requestedAt: new Date().toISOString()
  });
  
  // Optional: Send system message to chat
  await client.models.Message.create({
    conversationId,
    senderId: 'SYSTEM',
    receiverId,
    content: `${currentUser.name} wants to connect with you`,
    messageType: 'SYSTEM',
    sortKey: `${new Date().toISOString()}_${crypto.randomUUID()}`
  });
};

// Accept connection request - enhances relationship status
const acceptConnectionRequest = async (connectionRequestId: string) => {
  await client.models.UserConnection.update({
    id: connectionRequestId,
    status: 'ACCEPTED',
    respondedAt: new Date().toISOString()
  });
  
  // Note: Conversation is already permanent, this just updates connection status
};
```

STEP 4: Simplified Message Sending Logic
```typescript
// Simple check - users can always send messages in permanent conversations
const canSendMessage = async (conversationId: string, receiverId: string) => {
  const conversation = await client.models.Conversation.get({ id: conversationId });
  
  // All conversations are permanent and active
  if (conversation && conversation.isConnected) {
    return { allowed: true, reason: 'Permanent connection' };
  }
  
  // Default fallback (should rarely happen)
  return { allowed: false, reason: 'Conversation not found' };
};
```

DATA RETENTION POLICY (SIMPLIFIED):
- Chat requests: 24 hours if no response (TTL)
- Conversations: Permanent (never deleted)
- Messages: Permanent (never deleted)
- Reactions: Permanent (never deleted)
- UserConnections: Permanent (never deleted)
- Notifications: 30 days (TTL)

PERMANENT CONNECTION FEATURES:
- ✅ Immediate permanent connections upon chat request acceptance
- 💬 No time limits or restrictions on conversations
- 📱 Simple, user-friendly chat experience
- 🔄 All chat history preserved indefinitely
- 🎯 Focus on meaningful long-term conversations
=========================================================================*/

/*== TODO: FUTURE FEATURES ==============================================

1. AI MATCHING SYSTEM:
   - Add UserProfile model with job titles, fields, skills
   - Implement AI-based professional matching algorithm
   - Add matching preferences and filters

2. ANONYMOUS PROFILES:
   - Show only job title, field, and AI-generated description
   - Hide real names and photos until connected

3. ENHANCED CHAT FEATURES:
   - File/image sharing for connected users
   - Voice messages
   - Message reactions
   - Typing indicators

4. NOTIFICATION SYSTEM:
   - Push notifications for chat requests
   - Connection request notifications
   - Message notifications for offline users

5. PROFESSIONAL FEATURES:
   - Professional portfolios
   - Skill endorsements
   - Project collaboration features
   - Video call integration

6. ANALYTICS & AI:
   - Chat success rate tracking
   - AI improvement based on connection patterns
   - Professional recommendation improvements
=========================================================================*/
