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


interface EmbeddingResponse {
  success: boolean;
  embedding?: number[];
  results?: SearchResult[];
  error?: string;
}

// Try different possible model IDs for Titan Text Embeddings
const POSSIBLE_MODELS = [
  'amazon.titan-embed-text-v2:0', // V2 is granted, try this first
  'amazon.titan-embed-text-v1', // Fallback (might not be available)
];
let EMBEDDING_MODEL = POSSIBLE_MODELS[0]; // Start with v2
const EMBEDDING_DIMENSION = 1024; // Titan Text Embeddings v2 produces 1024-dimensional vectors
const USER_PROFILE_TABLE = process.env.USER_PROFILE_TABLE || 'UserProfile';

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION,
});
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

export const handler = async (
  event: any // Change to any to see the raw structure
): Promise<EmbeddingResponse> => {
  try {
    console.log('=== RAW EVENT DEBUG ===');
    console.log('Event keys:', Object.keys(event));
    console.log('Full event:', JSON.stringify(event, null, 2));
    console.log('event.action:', event.action);
    console.log('event.arguments:', event.arguments);

    // AppSync might wrap arguments differently
    const actualEvent = event.arguments || event;
    console.log('=== PROCESSED EVENT ===');
    console.log('actualEvent.action:', actualEvent.action);

    switch (actualEvent.action) {
      case 'generate_embedding':
        return await generateEmbedding(actualEvent.text!);

      case 'search':
        return await searchUsers(actualEvent.query!, actualEvent.limit || 10);

      case 'index_user':
        console.log('Raw userProfile:', actualEvent.userProfile);
        console.log('userProfile type:', typeof actualEvent.userProfile);
        let userProfile: UserProfile;

        if (typeof actualEvent.userProfile === 'string') {
          try {
            userProfile = JSON.parse(actualEvent.userProfile);
          } catch (parseError) {
            console.error('Failed to parse userProfile JSON:', parseError);
            throw new Error('Invalid userProfile JSON format');
          }
        } else if (
          actualEvent.userProfile &&
          typeof actualEvent.userProfile === 'object'
        ) {
          userProfile = actualEvent.userProfile as UserProfile;
        } else {
          throw new Error('userProfile is missing or invalid');
        }

        console.log('Parsed userProfile:', userProfile);
        return await indexUser(actualEvent.userId!, userProfile);

      case 'bulk_index':
        console.log('Raw users:', actualEvent.users);
        console.log('users type:', typeof actualEvent.users);
        let users: Array<{ userId: string; userProfile: UserProfile }>;

        if (typeof actualEvent.users === 'string') {
          try {
            users = JSON.parse(actualEvent.users);
          } catch (parseError) {
            console.error('Failed to parse users JSON:', parseError);
            throw new Error('Invalid users JSON format');
          }
        } else if (Array.isArray(actualEvent.users)) {
          users = actualEvent.users as Array<{
            userId: string;
            userProfile: UserProfile;
          }>;
        } else {
          throw new Error('users is missing or invalid');
        }

        console.log('Parsed users:', users);
        return await bulkIndexUsers(users);

      default:
        throw new Error(`Unknown action: ${actualEvent.action}`);
    }
  } catch (error) {
    console.error('Error in vector search function:', error);
    console.error('Full error details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

async function generateEmbedding(text: string): Promise<EmbeddingResponse> {
  console.log(`=== EMBEDDING GENERATION DEBUG ===`);
  console.log(`Text to embed: ${text.substring(0, 100)}...`);
  console.log(`Current model: ${EMBEDDING_MODEL}`);
  console.log(`AWS Region: ${process.env.AWS_REGION}`);

  for (let i = 0; i < POSSIBLE_MODELS.length; i++) {
    const modelId = POSSIBLE_MODELS[i];
    try {
      console.log(`Trying model: ${modelId}`);

      const command = new InvokeModelCommand({
        modelId: modelId,
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

      console.log(`SUCCESS with model ${modelId}:`, Object.keys(responseBody));

      if (!responseBody.embedding) {
        throw new Error('No embedding in response');
      }

      // Update the working model for future calls
      EMBEDDING_MODEL = modelId;
      console.log(`Updated EMBEDDING_MODEL to: ${EMBEDDING_MODEL}`);

      return {
        success: true,
        embedding: responseBody.embedding,
      };
    } catch (error: any) {
      console.error(`Model ${modelId} failed:`, error.message);

      // If this is the last model to try, return error
      if (i === POSSIBLE_MODELS.length - 1) {
        console.error('All models failed. Last error:', error);
        return {
          success: false,
          error: `All embedding models failed. Last error: ${error.message}`,
        };
      }
      // Otherwise, continue to next model
    }
  }

  return {
    success: false,
    error: 'All embedding models failed',
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

  if (profile.jobRole && profile.jobRole.trim()) {
    parts.push(`Job: ${profile.jobRole.trim()}`);
  }
  if (profile.companyName && profile.companyName.trim()) {
    parts.push(`Company: ${profile.companyName.trim()}`);
  }
  if (profile.industry && profile.industry.trim()) {
    parts.push(`Industry: ${profile.industry.trim()}`);
  }
  if (
    typeof profile.yearsOfExperience === 'number' &&
    profile.yearsOfExperience >= 0
  ) {
    parts.push(`Experience: ${profile.yearsOfExperience} years`);
  }
  if (profile.education && profile.education.trim()) {
    parts.push(`Education: ${profile.education.trim()}`);
  }
  if (profile.about && profile.about.trim()) {
    parts.push(`About: ${profile.about.trim()}`);
  }
  if (
    profile.interests &&
    Array.isArray(profile.interests) &&
    profile.interests.length > 0
  ) {
    const validInterests = profile.interests
      .filter(item => item && typeof item === 'string' && item.trim())
      .map(item => item.trim());
    if (validInterests.length > 0) {
      parts.push(`Interests: ${validInterests.join(', ')}`);
    }
  }
  if (
    profile.skills &&
    Array.isArray(profile.skills) &&
    profile.skills.length > 0
  ) {
    const validSkills = profile.skills
      .filter(item => item && typeof item === 'string' && item.trim())
      .map(item => item.trim());
    if (validSkills.length > 0) {
      parts.push(`Skills: ${validSkills.join(', ')}`);
    }
  }

  return parts.join('. ');
}

async function indexUser(
  userId: string,
  userProfile: UserProfile
): Promise<EmbeddingResponse> {
  console.log('Indexing user:', userId, 'with profile:', userProfile);
  console.log('Environment variables:');
  console.log('- AWS_REGION:', process.env.AWS_REGION);
  console.log('- USER_PROFILE_TABLE:', process.env.USER_PROFILE_TABLE);

  // Validate userProfile is not empty
  if (!userProfile || Object.keys(userProfile).length === 0) {
    console.error('UserProfile is empty or invalid:', userProfile);
    throw new Error('UserProfile is empty or invalid');
  }

  const profileText = createProfileText(userProfile);
  console.log('Generated profile text:', profileText);

  if (!profileText || profileText.trim().length === 0) {
    console.error('No meaningful profile text generated from:', userProfile);
    throw new Error('No meaningful profile text could be generated');
  }

  const embeddingResponse = await generateEmbedding(profileText);

  if (!embeddingResponse.success || !embeddingResponse.embedding) {
    console.error(
      'Failed to generate embedding for profile text:',
      profileText
    );
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

  console.log('Updating DynamoDB for user:', userId);
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
