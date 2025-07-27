import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/*== LOOPN CHAT APP SCHEMA ==============================================
This schema implements the Loopn user story:

1. User sees AI-chosen professionals online (anonymous profiles)
2. Sends "Chat Request" to start chatting
3. If accepted, they can chat for 7 days (probation period)
4. During chat, either can send "Connection Request" to connect permanently
5. If connected: chat forever
6. If not connected after 7 days: chat data expires, need new chat request

Models:
- ChatRequest: Request to start chatting with someone
- UserConnection: Request to connect permanently (friendship)
- Conversation: Chat between two users
- Message: Individual messages within conversations
- UserPresence: Online/offline status tracking

// TODO: Later features to implement:
// - User profiles with AI-generated descriptions
// - AI matching system for showing relevant professionals
// - Anonymous profile display (job title, field only)
=========================================================================*/

const schema = a.schema({
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

  // Request to connect permanently (Step 2 - during chat)
  UserConnection: a
    .model({
      id: a.id().required(),
      requesterId: a.string().required(), // User who wants to connect
      receiverId: a.string().required(), // User who received connection request
      conversationId: a.id().required(), // Which conversation this connection is for
      status: a.enum(['PENDING', 'ACCEPTED', 'REJECTED']),
      requestedAt: a.datetime(),
      respondedAt: a.datetime(),
      // Connection requests are tied to the conversation's 7-day period
      expiresAt: a.datetime(), // TTL field - expires with the conversation
    })
    .authorization(allow => [allow.authenticated()])
    .secondaryIndexes(index => [
      index('requesterId').sortKeys(['requestedAt']),
      index('receiverId').sortKeys(['requestedAt']),
      index('conversationId'), // Find connection request for a specific conversation
    ]),

  // Conversation between two users
  Conversation: a
    .model({
      id: a.id().required(),
      // The two participants in the conversation
      participant1Id: a.string().required(),
      participant2Id: a.string().required(),
      // Connection status affects data retention
      isConnected: a.boolean().default(false), // Based on UserConnection acceptance
      // Conversation metadata
      lastMessageAt: a.datetime(),
      lastMessageContent: a.string(), // Preview of last message
      lastMessageSenderId: a.string(), // Who sent the last message
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      // TTL field - delete unconnected conversations after 7 days
      expiresAt: a.datetime(), // Only set if isConnected = false
      // Enhanced probation period management
      probationEndsAt: a.datetime(), // When the 7-day probation period ends (for UI countdown)
      chatStatus: a.enum(['ACTIVE', 'PROBATION', 'ENDED']),
      // Track who ended the chat (for different UI behavior)
      endedByUserId: a.string(), // Optional: who clicked "End chat now"
      endedAt: a.datetime(), // When chat was manually ended
    })
    .authorization(allow => [allow.authenticated()])
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
      // TTL field - inherits from conversation's TTL if unconnected
      expiresAt: a.datetime(),
    })
    .authorization(allow => [allow.authenticated()])
    .secondaryIndexes(index => [
      // Get messages for a conversation, ordered by time
      index('conversationId').sortKeys(['sortKey']),
      // Get messages sent by a user
      index('senderId').sortKeys(['timestamp']),
    ]),

  // User online presence - simplified status
  UserPresence: a
    .model({
      id: a.id().required(),
      userId: a.string().required(),
      isOnline: a.boolean().default(false),
      lastSeen: a.datetime(),
      status: a.enum(['ONLINE', 'OFFLINE', 'BUSY']),
      // For heartbeat mechanism
      lastHeartbeat: a.datetime(),
      // TODO: Later add fields for AI matching:
      // - jobTitle: a.string()
      // - field: a.string()
      // - aiGeneratedDescription: a.string()
      // - isAvailableForChat: a.boolean()
    })
    .authorization(allow => [allow.authenticated()])
    .secondaryIndexes(index => [
      index('userId'),
      // TODO: Later add index for AI matching:
      // index('isAvailableForChat').sortKeys(['lastSeen'])
    ]),
});

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

STEP 1: Starting a Chat
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

// Designer accepts chat request
const acceptChatRequest = async (chatRequestId: string, requesterId: string, receiverId: string) => {
  // Update chat request
  await client.models.ChatRequest.update({
    id: chatRequestId,
    status: 'ACCEPTED',
    respondedAt: new Date().toISOString()
  });
  
  // Create conversation with 7-day probation
  const probationEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const expiresAt = probationEndsAt; // Same as probation end
  
  await client.models.Conversation.create({
    participant1Id: requesterId,
    participant2Id: receiverId,
    isConnected: false,
    chatStatus: 'ACTIVE',
    probationEndsAt: probationEndsAt.toISOString(),
    expiresAt: expiresAt.toISOString()
  });
};
```

STEP 2: Probation Period UI Management
```typescript
// Get probation time remaining for UI countdown
const getProbationTimeRemaining = (conversation: Conversation) => {
  if (conversation.isConnected || conversation.chatStatus === 'ENDED') {
    return null; // No probation period
  }
  
  const now = new Date();
  const probationEnd = new Date(conversation.probationEndsAt);
  const timeRemaining = probationEnd.getTime() - now.getTime();
  
  if (timeRemaining <= 0) {
    return 'Expired';
  }
  
  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes };
};

// Continue probation period (reset 7 days)
const continueProbation = async (conversationId: string) => {
  const newProbationEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Reset to 7 days
  
  await client.models.Conversation.update({
    id: conversationId,
    probationEndsAt: newProbationEnd.toISOString(),
    expiresAt: newProbationEnd.toISOString(),
    chatStatus: 'ACTIVE' // Reset to active if it was in probation
  });
};

// End chat immediately (user choice)
const endChatNow = async (conversationId: string) => {
  await client.models.Conversation.update({
    id: conversationId,
    chatStatus: 'ENDED',
    endedByUserId: currentUser.userId,
    endedAt: new Date().toISOString()
    // Keep expiresAt - will still clean up after 7 days
  });
};

// UI Component Example for Probation Buttons
const ProbationControls = ({ conversation }) => {
  const timeRemaining = getProbationTimeRemaining(conversation);
  
  if (conversation.isConnected) {
    return <div>✅ Connected - Chat forever!</div>;
  }
  
  if (conversation.chatStatus === 'ENDED') {
    return <div>💔 Chat ended. Data will be deleted soon.</div>;
  }
  
  return (
    <div className="probation-controls">
      <div className="countdown">
        ⏰ Probation ends in: {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m
      </div>
      <div className="buttons">
        <button onClick={() => continueProbation(conversation.id)}>
          🔄 Continue 7 days probation
        </button>
        <button onClick={() => endChatNow(conversation.id)}>
          ❌ End chat now
        </button>
      </div>
    </div>
  );
};
```

STEP 3: During Chat - Connection Request
```typescript
// Either user can send connection request during chat
const sendConnectionRequest = async (conversationId: string, receiverId: string) => {
  // Get conversation expiry to set same expiry for connection request
  const conversation = await client.models.Conversation.get({ id: conversationId });
  
  await client.models.UserConnection.create({
    requesterId: currentUser.userId,
    receiverId,
    conversationId,
    status: 'PENDING',
    expiresAt: conversation.expiresAt // Same as conversation expiry
  });
  
  // Send system message to chat
  await client.models.Message.create({
    conversationId,
    senderId: 'SYSTEM',
    receiverId,
    content: `${currentUser.name} wants to connect with you`,
    messageType: 'SYSTEM',
    sortKey: `${new Date().toISOString()}_${crypto.randomUUID()}`
  });
};

// Accept connection request - make chat permanent
const acceptConnectionRequest = async (connectionRequestId: string, conversationId: string) => {
  // Update connection request
  await client.models.UserConnection.update({
    id: connectionRequestId,
    status: 'ACCEPTED',
    respondedAt: new Date().toISOString()
  });
  
  // Make conversation permanent - remove all TTLs
  await client.models.Conversation.update({
    id: conversationId,
    isConnected: true,
    expiresAt: null, // Remove TTL - chat forever!
    probationEndsAt: null, // No more probation period
    chatStatus: 'ACTIVE'
  });
  
  // TODO: Update all messages in this conversation to remove TTL
  // This would require a bulk update operation
};
```

STEP 4: Enhanced Message Sending Logic
```typescript
// Check if users can send messages with enhanced logic
const canSendMessage = async (conversationId: string, receiverId: string) => {
  const conversation = await client.models.Conversation.get({ id: conversationId });
  
  // Connected users can always chat
  if (conversation.isConnected) {
    return { allowed: true, reason: 'Connected' };
  }
  
  // Chat was manually ended
  if (conversation.chatStatus === 'ENDED') {
    return { allowed: false, reason: 'Chat was ended' };
  }
  
  // Check if probation period expired
  const now = new Date();
  const probationEnd = new Date(conversation.probationEndsAt);
  if (now > probationEnd) {
    return { allowed: false, reason: 'Probation period expired' };
  }
  
  // During active probation period
  if (conversation.chatStatus === 'ACTIVE') {
    return { allowed: true, reason: 'Active probation period' };
  }
  
  // Default fallback
  return { allowed: false, reason: 'Unknown status' };
};
```

TTL CLEANUP (Automatic by DynamoDB):
- Chat requests: 24 hours if no response
- Unconnected conversations: 7 days from probationEndsAt
- Connection requests: 7 days (tied to conversation)
- Messages in unconnected chats: 7 days
- Connected user data: Never expires

ENHANCED PROBATION FEATURES:
- ⏰ Real-time countdown timer showing time left
- 🔄 "Continue 7 days probation" button (resets timer)
- ❌ "End chat now" button (immediate termination)
- 📊 Track who ended the chat and when
- 🎯 Better user control over chat lifecycle
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
