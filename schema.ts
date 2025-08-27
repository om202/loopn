import { Schema } from '@aws-amplify/datastore';

export const schema: Schema = {
  models: {
    ChatRequest: {
      name: 'ChatRequest',
      fields: {
        id: {
          name: 'id',
          isArray: false,
          type: 'ID',
          isRequired: true,
          attributes: [],
        },
        requesterId: {
          name: 'requesterId',
          isArray: false,
          type: 'String',
          isRequired: true,
          attributes: [],
        },
        receiverId: {
          name: 'receiverId',
          isArray: false,
          type: 'String',
          isRequired: true,
          attributes: [],
        },
        status: {
          name: 'status',
          isArray: false,
          type: {
            enum: 'ChatRequestStatus',
          },
          isRequired: false,
          attributes: [],
        },
        requestedAt: {
          name: 'requestedAt',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: false,
          attributes: [],
        },
        respondedAt: {
          name: 'respondedAt',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: false,
          attributes: [],
        },
        expiresAt: {
          name: 'expiresAt',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: false,
          attributes: [],
        },
        createdAt: {
          name: 'createdAt',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: false,
          attributes: [],
          isReadOnly: true,
        },
        updatedAt: {
          name: 'updatedAt',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: false,
          attributes: [],
          isReadOnly: true,
        },
      },
      syncable: true,
      pluralName: 'ChatRequests',
      attributes: [
        {
          type: 'model',
          properties: {},
        },
        {
          type: 'key',
          properties: {
            fields: ['id'],
          },
        },
        {
          type: 'key',
          properties: {
            name: 'chatRequestsByRequesterIdAndRequestedAt',
            queryField: 'listChatRequestByRequesterIdAndRequestedAt',
            fields: ['requesterId', 'requestedAt'],
          },
        },
        {
          type: 'key',
          properties: {
            name: 'chatRequestsByReceiverIdAndRequestedAt',
            queryField: 'listChatRequestByReceiverIdAndRequestedAt',
            fields: ['receiverId', 'requestedAt'],
          },
        },
        {
          type: 'auth',
          properties: {
            rules: [
              {
                allow: 'private',
                operations: ['create', 'update', 'delete', 'read'],
              },
            ],
          },
        },
      ],
    },

    UserConnection: {
      name: 'UserConnection',
      fields: {
        id: {
          name: 'id',
          isArray: false,
          type: 'ID',
          isRequired: true,
          attributes: [],
        },
        requesterId: {
          name: 'requesterId',
          isArray: false,
          type: 'String',
          isRequired: true,
          attributes: [],
        },
        receiverId: {
          name: 'receiverId',
          isArray: false,
          type: 'String',
          isRequired: true,
          attributes: [],
        },
        conversationId: {
          name: 'conversationId',
          isArray: false,
          type: 'ID',
          isRequired: true,
          attributes: [],
        },
        status: {
          name: 'status',
          isArray: false,
          type: {
            enum: 'UserConnectionStatus',
          },
          isRequired: false,
          attributes: [],
        },
        requestedAt: {
          name: 'requestedAt',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: false,
          attributes: [],
        },
        respondedAt: {
          name: 'respondedAt',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: false,
          attributes: [],
        },
        createdAt: {
          name: 'createdAt',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: false,
          attributes: [],
          isReadOnly: true,
        },
        updatedAt: {
          name: 'updatedAt',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: false,
          attributes: [],
          isReadOnly: true,
        },
      },
      syncable: true,
      pluralName: 'UserConnections',
      attributes: [
        {
          type: 'model',
          properties: {},
        },
        {
          type: 'key',
          properties: {
            fields: ['id'],
          },
        },
        {
          type: 'key',
          properties: {
            name: 'userConnectionsByRequesterIdAndRequestedAt',
            queryField: 'listUserConnectionByRequesterIdAndRequestedAt',
            fields: ['requesterId', 'requestedAt'],
          },
        },
        {
          type: 'key',
          properties: {
            name: 'userConnectionsByReceiverIdAndRequestedAt',
            queryField: 'listUserConnectionByReceiverIdAndRequestedAt',
            fields: ['receiverId', 'requestedAt'],
          },
        },
        {
          type: 'key',
          properties: {
            name: 'userConnectionsByConversationId',
            queryField: 'listUserConnectionByConversationId',
            fields: ['conversationId'],
          },
        },
        {
          type: 'auth',
          properties: {
            rules: [
              {
                allow: 'private',
                operations: ['create', 'update', 'delete', 'read'],
              },
            ],
          },
        },
      ],
    },
    Conversation: {
      name: 'Conversation',
      fields: {
        id: {
          name: 'id',
          isArray: false,
          type: 'ID',
          isRequired: true,
          attributes: [],
        },
        participant1Id: {
          name: 'participant1Id',
          isArray: false,
          type: 'String',
          isRequired: true,
          attributes: [],
        },
        participant2Id: {
          name: 'participant2Id',
          isArray: false,
          type: 'String',
          isRequired: true,
          attributes: [],
        },
        isConnected: {
          name: 'isConnected',
          isArray: false,
          type: 'Boolean',
          isRequired: false,
          attributes: [],
        },
        lastMessageAt: {
          name: 'lastMessageAt',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: false,
          attributes: [],
        },
        lastMessageContent: {
          name: 'lastMessageContent',
          isArray: false,
          type: 'String',
          isRequired: false,
          attributes: [],
        },
        lastMessageSenderId: {
          name: 'lastMessageSenderId',
          isArray: false,
          type: 'String',
          isRequired: false,
          attributes: [],
        },
        createdAt: {
          name: 'createdAt',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: false,
          attributes: [],
        },
        updatedAt: {
          name: 'updatedAt',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: false,
          attributes: [],
        },

        participants: {
          name: 'participants',
          isArray: true,
          type: 'String',
          isRequired: false,
          attributes: [],
          isArrayNullable: true,
        },
      },
      syncable: true,
      pluralName: 'Conversations',
      attributes: [
        {
          type: 'model',
          properties: {},
        },
        {
          type: 'key',
          properties: {
            fields: ['id'],
          },
        },
        {
          type: 'key',
          properties: {
            name: 'conversationsByParticipant1IdAndLastMessageAt',
            queryField: 'listConversationByParticipant1IdAndLastMessageAt',
            fields: ['participant1Id', 'lastMessageAt'],
          },
        },
        {
          type: 'key',
          properties: {
            name: 'conversationsByParticipant2IdAndLastMessageAt',
            queryField: 'listConversationByParticipant2IdAndLastMessageAt',
            fields: ['participant2Id', 'lastMessageAt'],
          },
        },
        {
          type: 'auth',
          properties: {
            rules: [
              {
                provider: 'userPools',
                ownerField: 'participants',
                allow: 'owner',
                identityClaim: 'cognito:username',
                operations: ['create', 'update', 'delete', 'read'],
              },
            ],
          },
        },
      ],
    },
    Message: {
      name: 'Message',
      fields: {
        id: {
          name: 'id',
          isArray: false,
          type: 'ID',
          isRequired: true,
          attributes: [],
        },
        conversationId: {
          name: 'conversationId',
          isArray: false,
          type: 'ID',
          isRequired: true,
          attributes: [],
        },
        senderId: {
          name: 'senderId',
          isArray: false,
          type: 'String',
          isRequired: true,
          attributes: [],
        },
        receiverId: {
          name: 'receiverId',
          isArray: false,
          type: 'String',
          isRequired: true,
          attributes: [],
        },
        content: {
          name: 'content',
          isArray: false,
          type: 'String',
          isRequired: true,
          attributes: [],
        },
        messageType: {
          name: 'messageType',
          isArray: false,
          type: {
            enum: 'MessageMessageType',
          },
          isRequired: false,
          attributes: [],
        },
        timestamp: {
          name: 'timestamp',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: false,
          attributes: [],
        },
        sortKey: {
          name: 'sortKey',
          isArray: false,
          type: 'String',
          isRequired: true,
          attributes: [],
        },
        isRead: {
          name: 'isRead',
          isArray: false,
          type: 'Boolean',
          isRequired: false,
          attributes: [],
        },
        readAt: {
          name: 'readAt',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: false,
          attributes: [],
        },
        isEdited: {
          name: 'isEdited',
          isArray: false,
          type: 'Boolean',
          isRequired: false,
          attributes: [],
        },
        editedAt: {
          name: 'editedAt',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: false,
          attributes: [],
        },
        isDeleted: {
          name: 'isDeleted',
          isArray: false,
          type: 'Boolean',
          isRequired: false,
          attributes: [],
        },
        deletedAt: {
          name: 'deletedAt',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: false,
          attributes: [],
        },
        replyToMessageId: {
          name: 'replyToMessageId',
          isArray: false,
          type: 'ID',
          isRequired: false,
          attributes: [],
        },
        participants: {
          name: 'participants',
          isArray: true,
          type: 'String',
          isRequired: false,
          attributes: [],
          isArrayNullable: true,
        },
        createdAt: {
          name: 'createdAt',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: false,
          attributes: [],
          isReadOnly: true,
        },
        updatedAt: {
          name: 'updatedAt',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: false,
          attributes: [],
          isReadOnly: true,
        },
      },
      syncable: true,
      pluralName: 'Messages',
      attributes: [
        {
          type: 'model',
          properties: {},
        },
        {
          type: 'key',
          properties: {
            fields: ['id'],
          },
        },
        {
          type: 'key',
          properties: {
            name: 'messagesByConversationIdAndSortKey',
            queryField: 'listMessageByConversationIdAndSortKey',
            fields: ['conversationId', 'sortKey'],
          },
        },
        {
          type: 'key',
          properties: {
            name: 'messagesBySenderIdAndTimestamp',
            queryField: 'listMessageBySenderIdAndTimestamp',
            fields: ['senderId', 'timestamp'],
          },
        },
        {
          type: 'auth',
          properties: {
            rules: [
              {
                provider: 'userPools',
                ownerField: 'participants',
                allow: 'owner',
                identityClaim: 'cognito:username',
                operations: ['create', 'update', 'delete', 'read'],
              },
            ],
          },
        },
      ],
    },
    MessageReaction: {
      name: 'MessageReaction',
      fields: {
        id: {
          name: 'id',
          isArray: false,
          type: 'ID',
          isRequired: true,
          attributes: [],
        },
        messageId: {
          name: 'messageId',
          isArray: false,
          type: 'ID',
          isRequired: true,
          attributes: [],
        },
        userId: {
          name: 'userId',
          isArray: false,
          type: 'String',
          isRequired: true,
          attributes: [],
        },
        emoji: {
          name: 'emoji',
          isArray: false,
          type: 'String',
          isRequired: true,
          attributes: [],
        },
        timestamp: {
          name: 'timestamp',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: true,
          attributes: [],
        },
        participants: {
          name: 'participants',
          isArray: true,
          type: 'String',
          isRequired: false,
          attributes: [],
          isArrayNullable: true,
        },
        createdAt: {
          name: 'createdAt',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: false,
          attributes: [],
          isReadOnly: true,
        },
        updatedAt: {
          name: 'updatedAt',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: false,
          attributes: [],
          isReadOnly: true,
        },
      },
      syncable: true,
      pluralName: 'MessageReactions',
      attributes: [
        {
          type: 'model',
          properties: {},
        },
        {
          type: 'key',
          properties: {
            fields: ['id'],
          },
        },
        {
          type: 'key',
          properties: {
            name: 'messageReactionsByMessageIdAndTimestamp',
            queryField: 'listMessageReactionByMessageIdAndTimestamp',
            fields: ['messageId', 'timestamp'],
          },
        },
        {
          type: 'key',
          properties: {
            name: 'messageReactionsByUserIdAndTimestamp',
            queryField: 'listMessageReactionByUserIdAndTimestamp',
            fields: ['userId', 'timestamp'],
          },
        },
        {
          type: 'auth',
          properties: {
            rules: [
              {
                provider: 'userPools',
                ownerField: 'participants',
                allow: 'owner',
                identityClaim: 'cognito:username',
                operations: ['create', 'update', 'delete', 'read'],
              },
            ],
          },
        },
      ],
    },
    UserPresence: {
      name: 'UserPresence',
      fields: {
        userId: {
          name: 'userId',
          isArray: false,
          type: 'String',
          isRequired: true,
          attributes: [],
        },
        email: {
          name: 'email',
          isArray: false,
          type: 'String',
          isRequired: false,
          attributes: [],
        },
        isOnline: {
          name: 'isOnline',
          isArray: false,
          type: 'Boolean',
          isRequired: false,
          attributes: [],
        },
        lastSeen: {
          name: 'lastSeen',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: false,
          attributes: [],
        },
        status: {
          name: 'status',
          isArray: false,
          type: {
            enum: 'UserPresenceStatus',
          },
          isRequired: false,
          attributes: [],
        },
        lastHeartbeat: {
          name: 'lastHeartbeat',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: false,
          attributes: [],
        },
        activeChatId: {
          name: 'activeChatId',
          isArray: false,
          type: 'ID',
          isRequired: false,
          attributes: [],
        },
        lastChatActivity: {
          name: 'lastChatActivity',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: false,
          attributes: [],
        },
        createdAt: {
          name: 'createdAt',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: false,
          attributes: [],
          isReadOnly: true,
        },
        updatedAt: {
          name: 'updatedAt',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: false,
          attributes: [],
          isReadOnly: true,
        },
      },
      syncable: true,
      pluralName: 'UserPresences',
      attributes: [
        {
          type: 'model',
          properties: {},
        },
        {
          type: 'key',
          properties: {
            fields: ['userId'],
          },
        },
        {
          type: 'key',
          properties: {
            name: 'userPresencesByStatus',
            queryField: 'listUserPresenceByStatus',
            fields: ['status'],
          },
        },
        {
          type: 'key',
          properties: {
            name: 'userPresencesByActiveChatId',
            queryField: 'listUserPresenceByActiveChatId',
            fields: ['activeChatId'],
          },
        },
        {
          type: 'auth',
          properties: {
            rules: [
              {
                allow: 'private',
                operations: ['create', 'update', 'delete', 'read'],
              },
            ],
          },
        },
      ],
    },
    Notification: {
      name: 'Notification',
      fields: {
        id: {
          name: 'id',
          isArray: false,
          type: 'ID',
          isRequired: true,
          attributes: [],
        },
        userId: {
          name: 'userId',
          isArray: false,
          type: 'String',
          isRequired: true,
          attributes: [],
        },
        type: {
          name: 'type',
          isArray: false,
          type: {
            enum: 'NotificationType',
          },
          isRequired: false,
          attributes: [],
        },
        title: {
          name: 'title',
          isArray: false,
          type: 'String',
          isRequired: true,
          attributes: [],
        },
        content: {
          name: 'content',
          isArray: false,
          type: 'String',
          isRequired: true,
          attributes: [],
        },
        timestamp: {
          name: 'timestamp',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: true,
          attributes: [],
        },
        isRead: {
          name: 'isRead',
          isArray: false,
          type: 'Boolean',
          isRequired: false,
          attributes: [],
        },
        readAt: {
          name: 'readAt',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: false,
          attributes: [],
        },
        data: {
          name: 'data',
          isArray: false,
          type: 'AWSJSON',
          isRequired: false,
          attributes: [],
        },
        chatRequestId: {
          name: 'chatRequestId',
          isArray: false,
          type: 'ID',
          isRequired: false,
          attributes: [],
        },
        conversationId: {
          name: 'conversationId',
          isArray: false,
          type: 'ID',
          isRequired: false,
          attributes: [],
        },
        connectionRequestId: {
          name: 'connectionRequestId',
          isArray: false,
          type: 'ID',
          isRequired: false,
          attributes: [],
        },
        expiresAt: {
          name: 'expiresAt',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: false,
          attributes: [],
        },
        createdAt: {
          name: 'createdAt',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: false,
          attributes: [],
          isReadOnly: true,
        },
        updatedAt: {
          name: 'updatedAt',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: false,
          attributes: [],
          isReadOnly: true,
        },
      },
      syncable: true,
      pluralName: 'Notifications',
      attributes: [
        {
          type: 'model',
          properties: {},
        },
        {
          type: 'key',
          properties: {
            fields: ['id'],
          },
        },
        {
          type: 'key',
          properties: {
            name: 'notificationsByUserIdAndTimestamp',
            queryField: 'listNotificationByUserIdAndTimestamp',
            fields: ['userId', 'timestamp'],
          },
        },
        {
          type: 'auth',
          properties: {
            rules: [
              {
                allow: 'private',
                operations: ['create', 'update', 'delete', 'read'],
              },
            ],
          },
        },
      ],
    },
  },
  enums: {
    ChatRequestStatus: {
      name: 'ChatRequestStatus',
      values: ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
    },
    UserConnectionStatus: {
      name: 'UserConnectionStatus',
      values: ['PENDING', 'ACCEPTED', 'REJECTED'],
    },

    MessageMessageType: {
      name: 'MessageMessageType',
      values: ['TEXT', 'SYSTEM'],
    },
    UserPresenceStatus: {
      name: 'UserPresenceStatus',
      values: ['ONLINE', 'OFFLINE', 'BUSY'],
    },
    NotificationType: {
      name: 'NotificationType',
      values: ['chat_request', 'message', 'connection', 'system'],
    },
  },
  nonModels: {},
  codegenVersion: '3.4.4',
  version: 'db54c32818f923b2d6e54c200d70ede5',
};
