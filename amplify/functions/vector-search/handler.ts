import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import {
  DynamoDBClient,
  ScanCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

interface UserProfile {
  jobRole?: string;
  companyName?: string;
  industry?: string;
  yearsOfExperience?: number;
  education?: string;
  about?: string;
  interests?: string[];
  skills?: string[];
}

interface SearchResult {
  userId: string;
  score: number;
  profile: UserProfile;
}

interface EmbeddingRequest {
  action: 'generate_embedding' | 'search' | 'index_user' | 'bulk_index';
  text?: string;
  query?: string;
  userId?: string;
  userProfile?: UserProfile;
  users?: Array<{
    userId: string;
    userProfile: UserProfile;
  }>;
  limit?: number;
}

interface EmbeddingResponse {
  success: boolean;
  embedding?: number[];
  results?: SearchResult[];
  error?: string;
}

const EMBEDDING_MODEL = 'amazon.titan-embed-text-v2:0';
const EMBEDDING_DIMENSION = 1024; // Titan Text Embeddings v2 produces 1024-dimensional vectors
const USER_PROFILE_TABLE = process.env.USER_PROFILE_TABLE || 'UserProfile';

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION,
});
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

export const handler = async (
  event: EmbeddingRequest
): Promise<EmbeddingResponse> => {
  try {
    console.log('Vector search function called with action:', event.action);

    switch (event.action) {
      case 'generate_embedding':
        return await generateEmbedding(event.text!);

      case 'search':
        return await searchUsers(event.query!, event.limit || 10);

      case 'index_user':
        return await indexUser(event.userId!, event.userProfile!);

      case 'bulk_index':
        return await bulkIndexUsers(event.users!);

      default:
        throw new Error(`Unknown action: ${event.action}`);
    }
  } catch (error) {
    console.error('Error in vector search function:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

async function generateEmbedding(text: string): Promise<EmbeddingResponse> {
  const command = new InvokeModelCommand({
    modelId: EMBEDDING_MODEL,
    body: JSON.stringify({
      inputText: text,
      dimensions: EMBEDDING_DIMENSION,
      normalize: true,
    }),
    contentType: 'application/json',
    accept: 'application/json',
  });

  const response = await bedrockClient.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));

  return {
    success: true,
    embedding: responseBody.embedding,
  };
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

function createProfileText(profile: UserProfile): string {
  const parts = [];

  if (profile.jobRole) parts.push(`Job: ${profile.jobRole}`);
  if (profile.companyName) parts.push(`Company: ${profile.companyName}`);
  if (profile.industry) parts.push(`Industry: ${profile.industry}`);
  if (profile.yearsOfExperience)
    parts.push(`Experience: ${profile.yearsOfExperience} years`);
  if (profile.education) parts.push(`Education: ${profile.education}`);
  if (profile.about) parts.push(`About: ${profile.about}`);
  if (profile.interests?.length)
    parts.push(`Interests: ${profile.interests.join(', ')}`);
  if (profile.skills?.length)
    parts.push(`Skills: ${profile.skills.join(', ')}`);

  return parts.join('. ');
}

async function indexUser(
  userId: string,
  userProfile: UserProfile
): Promise<EmbeddingResponse> {
  const profileText = createProfileText(userProfile);
  const embeddingResponse = await generateEmbedding(profileText);

  if (!embeddingResponse.success || !embeddingResponse.embedding) {
    throw new Error('Failed to generate embedding');
  }

  // Update the UserProfile record with the embedding
  const updateParams = {
    TableName: USER_PROFILE_TABLE,
    Key: marshall({ userId }),
    UpdateExpression:
      'SET profileEmbedding = :embedding, embeddingLastUpdated = :timestamp',
    ExpressionAttributeValues: marshall({
      ':embedding': embeddingResponse.embedding,
      ':timestamp': new Date().toISOString(),
    }),
  };

  await dynamoClient.send(new UpdateItemCommand(updateParams));
  return { success: true };
}

async function bulkIndexUsers(
  users: Array<{ userId: string; userProfile: UserProfile }>
): Promise<EmbeddingResponse> {
  for (const user of users) {
    try {
      await indexUser(user.userId, user.userProfile);
    } catch (error) {
      console.error(`Failed to index user ${user.userId}:`, error);
    }
  }
  return { success: true };
}

async function searchUsers(
  query: string,
  limit: number
): Promise<EmbeddingResponse> {
  const embeddingResponse = await generateEmbedding(query);

  if (!embeddingResponse.success || !embeddingResponse.embedding) {
    throw new Error('Failed to generate query embedding');
  }

  // Scan all user profiles to find the most similar ones
  const scanParams = {
    TableName: USER_PROFILE_TABLE,
    FilterExpression: 'attribute_exists(profileEmbedding)',
  };

  const scanResponse = await dynamoClient.send(new ScanCommand(scanParams));

  if (!scanResponse.Items) {
    return { success: true, results: [] };
  }

  // Calculate similarities and sort by score
  const scoredResults = scanResponse.Items.map(item => {
    const userProfile = unmarshall(item);
    if (!userProfile.profileEmbedding) return null;

    const similarity = cosineSimilarity(
      embeddingResponse.embedding!,
      userProfile.profileEmbedding
    );

    return {
      userId: userProfile.userId,
      score: similarity,
      profile: {
        jobRole: userProfile.jobRole,
        companyName: userProfile.companyName,
        industry: userProfile.industry,
        yearsOfExperience: userProfile.yearsOfExperience,
        education: userProfile.education,
        about: userProfile.about,
        interests: userProfile.interests,
        skills: userProfile.skills,
      },
    } as SearchResult;
  })
    .filter((result): result is SearchResult => result !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    success: true,
    results: scoredResults,
  };
}
