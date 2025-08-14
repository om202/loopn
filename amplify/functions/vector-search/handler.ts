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

interface EnhancedSearchResult extends SearchResult {
  matchExplanation?: string;
  relevanceFactors?: string[];
  confidenceScore?: number;
}

interface SearchContext {
  userProfile?: UserProfile;
  searchHistory?: string[];
  userIndustry?: string;
  userExperience?: number;
}

interface EmbeddingResponse {
  success: boolean;
  embedding?: number[];
  results?: SearchResult[];
  enhancedResults?: EnhancedSearchResult[];
  enhancedQuery?: string;
  searchInsights?: string;
  error?: string;
}

// Try different possible model IDs for Titan Text Embeddings
const POSSIBLE_MODELS = [
  'amazon.titan-embed-text-v2:0', // V2 is granted, try this first
  'amazon.titan-embed-text-v1', // Fallback (might not be available)
];
// Use Claude 3.5 Haiku with cross-region inference profile
const CLAUDE_MODEL_ID = 'us.anthropic.claude-3-5-haiku-20241022-v1:0';
const EMBEDDING_DIMENSION = 1024; // Titan Text Embeddings v2 produces 1024-dimensional vectors
const USER_PROFILE_TABLE = process.env.USER_PROFILE_TABLE || 'UserProfile';

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION,
});
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

interface GraphQLEvent {
  action: string;
  text?: string;
  query?: string;
  userId?: string;
  userProfile?: string | Record<string, unknown>;
  users?: string | Array<{ userId: string; userProfile: UserProfile }>;
  limit?: number;
  userContext?: string | SearchContext;
  results?: string | SearchResult[];
}

export const handler = async (
  event: unknown // GraphQL event structure
): Promise<EmbeddingResponse> => {
  try {
    // AppSync might wrap arguments differently
    const wrappedEvent = event as { arguments?: GraphQLEvent };
    const actualEvent = wrappedEvent.arguments || (event as GraphQLEvent);

    switch (actualEvent.action) {
      case 'generate_embedding':
        return await generateEmbedding(actualEvent.text!);

      case 'search':
        return await searchUsers(actualEvent.query!, actualEvent.limit || 10);

      case 'index_user':
        let userProfile: UserProfile;

        if (typeof actualEvent.userProfile === 'string') {
          try {
            userProfile = JSON.parse(actualEvent.userProfile);
          } catch (parseError) {
            throw new Error(`Invalid userProfile JSON format ${parseError}`);
          }
        } else if (
          actualEvent.userProfile &&
          typeof actualEvent.userProfile === 'object'
        ) {
          userProfile = actualEvent.userProfile as UserProfile;
        } else {
          throw new Error('userProfile is missing or invalid');
        }

        return await indexUser(actualEvent.userId!, userProfile);

      case 'bulk_index':
        let users: Array<{ userId: string; userProfile: UserProfile }>;

        if (typeof actualEvent.users === 'string') {
          try {
            users = JSON.parse(actualEvent.users);
          } catch (parseError) {
            throw new Error(`Invalid users JSON format ${parseError}`);
          }
        } else if (Array.isArray(actualEvent.users)) {
          users = actualEvent.users as Array<{
            userId: string;
            userProfile: UserProfile;
          }>;
        } else {
          throw new Error('users is missing or invalid');
        }

        return await bulkIndexUsers(users);

      case 'search_users':
        if (!actualEvent.query || typeof actualEvent.query !== 'string') {
          throw new Error('Query is missing or invalid');
        }

        const query = actualEvent.query.trim();
        const limit = actualEvent.limit || 10;

        return await searchUsers(query, limit);

      case 'intelligent_search':
        if (!actualEvent.query || typeof actualEvent.query !== 'string') {
          throw new Error('Query is missing or invalid');
        }

        let userContext: SearchContext | undefined;
        if (actualEvent.userContext) {
          try {
            userContext =
              typeof actualEvent.userContext === 'string'
                ? JSON.parse(actualEvent.userContext)
                : actualEvent.userContext;
          } catch (_parseError) {
            console.warn(
              'Invalid userContext format, proceeding without context'
            );
          }
        }

        return await intelligentSearch(
          actualEvent.query.trim(),
          userContext,
          actualEvent.limit || 10
        );

      case 'enhance_query':
        if (!actualEvent.query || typeof actualEvent.query !== 'string') {
          throw new Error('Query is missing or invalid');
        }

        let queryUserContext: SearchContext | undefined;
        if (actualEvent.userContext) {
          try {
            queryUserContext =
              typeof actualEvent.userContext === 'string'
                ? JSON.parse(actualEvent.userContext)
                : actualEvent.userContext;
          } catch (_parseError) {
            console.warn(
              'Invalid userContext format, proceeding without context'
            );
          }
        }

        return await enhanceQuery(actualEvent.query.trim(), queryUserContext);

      case 'rerank_results':
        if (!actualEvent.results || !actualEvent.query) {
          throw new Error('Results and query are required for reranking');
        }

        let rerankResults: SearchResult[];
        try {
          rerankResults =
            typeof actualEvent.results === 'string'
              ? JSON.parse(actualEvent.results)
              : actualEvent.results;
        } catch (_parseError) {
          throw new Error('Invalid results format for reranking');
        }

        let rerankUserContext: SearchContext | undefined;
        if (actualEvent.userContext) {
          try {
            rerankUserContext =
              typeof actualEvent.userContext === 'string'
                ? JSON.parse(actualEvent.userContext)
                : actualEvent.userContext;
          } catch (_parseError) {
            console.warn(
              'Invalid userContext format, proceeding without context'
            );
          }
        }

        return await rerankResultsFunction(
          rerankResults,
          actualEvent.query,
          rerankUserContext
        );

      default:
        throw new Error(`Unknown action: ${actualEvent.action}`);
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
  for (let i = 0; i < POSSIBLE_MODELS.length; i++) {
    const modelId = POSSIBLE_MODELS[i];
    try {
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

      if (!responseBody.embedding) {
        throw new Error('No embedding in response');
      }

      return {
        success: true,
        embedding: responseBody.embedding,
      };
    } catch (error: unknown) {
      // If this is the last model to try, return error
      if (i === POSSIBLE_MODELS.length - 1) {
        return {
          success: false,
          error: `All embedding models failed. Last error: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
  // Validate userProfile is not empty
  if (!userProfile || Object.keys(userProfile).length === 0) {
    throw new Error('UserProfile is empty or invalid');
  }

  const profileText = createProfileText(userProfile);

  if (!profileText || profileText.trim().length === 0) {
    throw new Error('No meaningful profile text could be generated');
  }

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
  const scoredResults = scanResponse
    .Items!.map(item => {
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
    .filter(
      (result: SearchResult | null): result is SearchResult => result !== null
    )
    .filter((result: SearchResult) => result.score >= 0.25) // Filter out results below 25% similarity
    .sort((a: SearchResult, b: SearchResult) => b.score - a.score)
    .slice(0, limit);

  return {
    success: true,
    results: scoredResults,
  };
}

// Helper function to invoke Claude 3.5 Sonnet
async function invokeClaude(prompt: string): Promise<string> {
  try {
    const command = new InvokeModelCommand({
      modelId: CLAUDE_MODEL_ID,
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1, // Low temperature for consistent results
      }),
      contentType: 'application/json',
      accept: 'application/json',
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    if (!responseBody.content || responseBody.content.length === 0) {
      throw new Error('No content in Claude response');
    }

    return responseBody.content[0].text;
  } catch (error: unknown) {
    console.error('Error invoking Claude:', error);
    throw new Error(
      `Claude invocation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Enhanced query function using Claude
async function enhanceQuery(
  originalQuery: string,
  userContext?: SearchContext
): Promise<{
  success: boolean;
  enhancedQuery: string;
  searchTerms: string[];
  intent: string;
  error?: string;
}> {
  try {
    console.log(`enhanceQuery called with: "${originalQuery}"`);
    const prompt = `You are an expert at understanding professional search queries. 

User is searching for professionals with query: "${originalQuery}"

User context:
- Role: ${userContext?.userProfile?.jobRole || 'Unknown'}
- Industry: ${userContext?.userProfile?.industry || 'Unknown'}
- Experience: ${userContext?.userProfile?.yearsOfExperience || 'Unknown'} years
- Company: ${userContext?.userProfile?.companyName || 'Unknown'}

Enhance this query by:
1. Expanding job titles and skills that match the intent
2. Adding relevant synonyms and related roles
3. Considering complementary roles that would work well with the user
4. Understanding the business context and needs

Return ONLY a valid JSON object with this exact structure, no additional text or explanations:
{
  "enhancedQuery": "expanded search terms that capture the intent better",
  "searchTerms": ["term1", "term2", "term3"],
  "intent": "clear description of what the user is looking for"
}

IMPORTANT: Return ONLY the JSON object, nothing else. No explanations, no notes, no additional text.

Examples:
- "find a co-founder" → enhancedQuery: "technical co-founder CTO startup founder software engineer entrepreneur", searchTerms: ["co-founder", "CTO", "technical founder", "startup founder"], intent: "Looking for a technical business partner"
- "backend engineer" → enhancedQuery: "backend engineer software engineer full-stack developer API developer cloud engineer", searchTerms: ["backend", "software engineer", "API developer"], intent: "Looking for server-side development expertise"`;

    console.log('Calling Claude with prompt length:', prompt.length);
    const response = await invokeClaude(prompt);
    console.log('Claude response:', response);
    
    // Extract JSON from Claude's response (in case there's extra text)
    let jsonText = response.trim();
    
    // Try to find JSON object in the response
    const jsonStart = jsonText.indexOf('{');
    const jsonEnd = jsonText.lastIndexOf('}') + 1;
    
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      jsonText = jsonText.substring(jsonStart, jsonEnd);
    }
    
    console.log('Extracted JSON:', jsonText);
    const parsed = JSON.parse(jsonText);

    return {
      success: true,
      enhancedQuery: parsed.enhancedQuery,
      searchTerms: parsed.searchTerms,
      intent: parsed.intent,
    };
  } catch (error: unknown) {
    console.error('Error enhancing query:', error);
    return {
      success: false,
      enhancedQuery: originalQuery,
      searchTerms: [originalQuery],
      intent: 'Basic search',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Result reranking function using Claude
async function rerankResultsFunction(
  vectorResults: SearchResult[],
  originalQuery: string,
  userContext?: SearchContext
): Promise<{
  success: boolean;
  results: EnhancedSearchResult[];
  error?: string;
}> {
  try {
    const prompt = `You are an expert at matching professionals for collaboration and networking.

User searched for: "${originalQuery}"

User profile:
- Role: ${userContext?.userProfile?.jobRole || 'Unknown'}
- Industry: ${userContext?.userProfile?.industry || 'Unknown'}
- Experience: ${userContext?.userProfile?.yearsOfExperience || 'Unknown'} years
- Skills: ${userContext?.userProfile?.skills?.join(', ') || 'Unknown'}
- Interests: ${userContext?.userProfile?.interests?.join(', ') || 'Unknown'}

Vector search returned these professional profiles:
${JSON.stringify(
  vectorResults.map(r => ({
    userId: r.userId,
    score: r.score,
    profile: r.profile,
  })),
  null,
  2
)}

For each profile, provide:
1. A confidence score (0-100) based on how well they match the search intent
2. A clear explanation of why they match (ONLY include profiles with confidence score >= 40)
3. Key relevance factors that make them a good connection

IMPORTANT: EXCLUDE any profiles with confidence score below 40. Only return highly relevant matches.

Consider:
- Direct role/skill alignment with search query
- Industry relevance and expertise
- Experience level compatibility
- Role synergy and collaboration potential
- Career stage alignment

Return ONLY a valid JSON array where each object has this exact structure:
[
  {
    "userId": "user123",
    "score": 85,
    "profile": {...},
    "confidenceScore": 92,
    "matchExplanation": "Strong match because of shared fintech experience and complementary technical skills",
    "relevanceFactors": ["Fintech expertise", "Technical leadership", "Startup experience"]
  }
]

Ensure the array maintains the same order as the input profiles.`;

    const response = await invokeClaude(prompt);
    const enhancedResults: EnhancedSearchResult[] = JSON.parse(response);

    return {
      success: true,
      results: enhancedResults,
    };
  } catch (error: unknown) {
    console.error('Error reranking results:', error);
    // Fallback: return original results with basic confidence scores
    const fallbackResults: EnhancedSearchResult[] = vectorResults.map(
      result => ({
        ...result,
        confidenceScore: Math.round(result.score * 100),
        matchExplanation: `${Math.round(result.score * 100)}% semantic similarity match`,
        relevanceFactors: ['Semantic similarity'],
      })
    );

    return {
      success: true,
      results: fallbackResults,
      error: `Claude reranking failed, using fallback: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Main intelligent search function
async function intelligentSearch(
  query: string,
  userContext?: SearchContext,
  limit: number = 10
): Promise<EmbeddingResponse> {
  try {
    console.log(`Starting intelligent search for query: "${query}"`);

    // Step 1: Enhance query with Claude
    console.log('Calling enhanceQuery...');
    const queryEnhancement = await enhanceQuery(query, userContext);
    console.log(
      'Query enhancement result:',
      JSON.stringify(queryEnhancement, null, 2)
    );
    if (!queryEnhancement.success) {
      console.warn(
        'Query enhancement failed, proceeding with original query',
        queryEnhancement.error
      );
    }

    const searchQuery = queryEnhancement.success
      ? queryEnhancement.enhancedQuery
      : query;
    console.log(`Enhanced query: "${searchQuery}"`);

    // Step 2: Use enhanced query for vector search (get more results for reranking)
    const vectorResults = await searchUsers(searchQuery, limit * 2);

    if (!vectorResults.success || !vectorResults.results) {
      return {
        success: false,
        error: 'Vector search failed',
      };
    }

    console.log(
      `Vector search returned ${vectorResults.results.length} results`
    );

    // Step 3: Rerank results with Claude
    const rerankingResult = await rerankResultsFunction(
      vectorResults.results,
      query,
      userContext
    );

    if (!rerankingResult.success) {
      console.warn('Result reranking failed, using original results');
      // Fallback to original results
      return {
        success: true,
        results: vectorResults.results,
        enhancedQuery: searchQuery,
        searchInsights: `Found ${vectorResults.results.length} matches using basic vector search`,
      };
    }

    // Step 4: Filter by confidence score, sort, and take top results
    const finalResults = rerankingResult.results
      .filter((result) => (result.confidenceScore || 0) >= 40) // Only keep high-confidence matches
      .sort((a, b) => (b.confidenceScore || 0) - (a.confidenceScore || 0))
      .slice(0, limit);

    console.log(`Returning ${finalResults.length} reranked results`);

    return {
      success: true,
      enhancedResults: finalResults,
      enhancedQuery: searchQuery,
      searchInsights: finalResults.length > 0 
        ? `Found ${finalResults.length} high-quality matches using AI-enhanced search. Query enhanced from "${query}" to "${searchQuery}"`
        : `No relevant matches found for "${query}". Try broader search terms or check if professionals with matching skills are in the system.`,
    };
  } catch (error: unknown) {
    console.error('Error in intelligent search:', error);

    // Fallback to basic search
    console.log('Falling back to basic vector search');
    try {
      const fallbackResults = await searchUsers(query, limit);
      return {
        ...fallbackResults,
        searchInsights: `AI search failed, used basic search: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    } catch (fallbackError: unknown) {
      return {
        success: false,
        error: `Both intelligent and fallback search failed: ${error instanceof Error ? error.message : 'Unknown error'}, ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`,
      };
    }
  }
}
