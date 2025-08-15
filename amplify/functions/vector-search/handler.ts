import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import {
  DynamoDBClient,
  ScanCommand,
  UpdateItemCommand,
  AttributeValue,
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
  keywordTerms?: string[];
  hybridScores?: { semantic: number; keyword: number; combined: number }[];
  error?: string;
}

// Try different possible model IDs for Titan Text Embeddings
const POSSIBLE_MODELS = [
  'amazon.titan-embed-text-v2:0', // V2 is granted, try this first
  'amazon.titan-embed-text-v1', // Fallback (might not be available)
];
// Use Mistral Small (24.02)
const MISTRAL_MODEL_ID = 'mistral.mistral-small-2402-v1:0';
const EMBEDDING_DIMENSION = 1024; // Titan Text Embeddings v2 produces 1024-dimensional vectors
const USER_PROFILE_TABLE = process.env.USER_PROFILE_TABLE || 'UserProfile';

// Simple in-memory cache for embeddings and search results
const embeddingCache = new Map<string, number[]>();
const searchCache = new Map<
  string,
  { results: SearchResult[]; timestamp: number }
>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

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

      case 'advanced_rag_search':
        if (!actualEvent.query || typeof actualEvent.query !== 'string') {
          throw new Error(
            'Query is missing or invalid for advanced RAG search'
          );
        }

        let ragUserContext: SearchContext | undefined;
        if (actualEvent.userContext) {
          try {
            ragUserContext =
              typeof actualEvent.userContext === 'string'
                ? JSON.parse(actualEvent.userContext)
                : actualEvent.userContext;
          } catch (_parseError) {
            console.warn(
              'Invalid userContext format, proceeding without context'
            );
          }
        }

        return await advancedRAGSearch(
          actualEvent.query.trim(),
          ragUserContext,
          actualEvent.limit || 10
        );

      case 'expand_keywords':
        if (!actualEvent.query || typeof actualEvent.query !== 'string') {
          throw new Error('Query is missing or invalid for keyword expansion');
        }

        let keywordUserContext: SearchContext | undefined;
        if (actualEvent.userContext) {
          try {
            keywordUserContext =
              typeof actualEvent.userContext === 'string'
                ? JSON.parse(actualEvent.userContext)
                : actualEvent.userContext;
          } catch (_parseError) {
            console.warn(
              'Invalid userContext format, proceeding without context'
            );
          }
        }

        return await expandKeywords(
          actualEvent.query.trim(),
          keywordUserContext
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
  // Check cache first
  const normalizedText = text.trim().toLowerCase();
  if (embeddingCache.has(normalizedText)) {
    console.log('Using cached embedding for:', normalizedText.substring(0, 50));
    return {
      success: true,
      embedding: embeddingCache.get(normalizedText)!,
    };
  }

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

      // Cache the successful result
      embeddingCache.set(normalizedText, responseBody.embedding);
      console.log('Cached new embedding for:', normalizedText.substring(0, 50));

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
  // Check search cache first
  const cacheKey = `${query.trim().toLowerCase()}_${limit}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('Using cached search results for:', query);
    return {
      success: true,
      results: cached.results,
    };
  }

  const embeddingResponse = await generateEmbedding(query);

  if (!embeddingResponse.success || !embeddingResponse.embedding) {
    throw new Error('Failed to generate query embedding');
  }

  // Use paginated scan with optimizations for better performance
  const results: SearchResult[] = [];
  let lastEvaluatedKey: Record<string, AttributeValue> | undefined;
  let processedItems = 0;
  const maxItemsToProcess = limit * 10; // Process at most 10x the limit to find good matches

  do {
    const scanParams = {
      TableName: USER_PROFILE_TABLE,
      FilterExpression: 'attribute_exists(profileEmbedding)',
      Limit: 100, // Process in smaller batches
      ExclusiveStartKey: lastEvaluatedKey,
      // Add projection to only fetch necessary fields for performance
      ProjectionExpression:
        'userId, profileEmbedding, jobRole, companyName, industry, yearsOfExperience, education, about, interests, skills',
    };

    const scanResponse = await dynamoClient.send(new ScanCommand(scanParams));

    if (scanResponse.Items && scanResponse.Items.length > 0) {
      // Process this batch
      const batchResults = scanResponse.Items.map(item => {
        const userProfile = unmarshall(item);
        if (!userProfile.profileEmbedding) return null;

        const similarity = cosineSimilarity(
          embeddingResponse.embedding!,
          userProfile.profileEmbedding
        );

        // Early filtering with higher threshold to reduce processing
        if (similarity < 0.3) return null;

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
      }).filter(
        (result: SearchResult | null): result is SearchResult => result !== null
      );

      results.push(...batchResults);
      processedItems += scanResponse.Items.length;
    }

    lastEvaluatedKey = scanResponse.LastEvaluatedKey;

    // Stop early if we have enough good results or processed enough items
    if (results.length >= limit * 3 || processedItems >= maxItemsToProcess) {
      break;
    }
  } while (lastEvaluatedKey);

  // Sort by score and apply final filtering
  const finalResults = results
    .filter((result: SearchResult) => result.score >= 0.25)
    .sort((a: SearchResult, b: SearchResult) => b.score - a.score)
    .slice(0, limit);

  console.log(
    `Processed ${processedItems} items, found ${results.length} candidates, returning ${finalResults.length} results`
  );

  // Cache the results
  searchCache.set(cacheKey, {
    results: finalResults,
    timestamp: Date.now(),
  });

  return {
    success: true,
    results: finalResults,
  };
}

// Helper function to invoke Mistral Small
async function invokeMistral(prompt: string): Promise<string> {
  try {
    const command = new InvokeModelCommand({
      modelId: MISTRAL_MODEL_ID,
      body: JSON.stringify({
        prompt: prompt,
        max_tokens: 1500,
        temperature: 0.15, // Optimized for RAG tasks
        top_p: 0.95,
        stop: ['</s>', '\n\n', '[/INST]'],
      }),
      contentType: 'application/json',
      accept: 'application/json',
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    if (!responseBody.outputs || responseBody.outputs.length === 0) {
      throw new Error('No content in Mistral response');
    }

    return responseBody.outputs[0].text;
  } catch (error: unknown) {
    console.error('Error invoking Mistral:', error);
    throw new Error(
      `Mistral invocation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Enhanced query function using Mistral
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
    const prompt = `[INST] You are a professional search enhancement specialist. Personalize search queries based on user context.

SEARCH QUERY: "${originalQuery}"

USER PROFILE:
- Role: ${userContext?.userProfile?.jobRole || 'Not specified'}
- Industry: ${userContext?.userProfile?.industry || 'Not specified'}
- Experience: ${userContext?.userProfile?.yearsOfExperience || 'Not specified'} years
- Company: ${userContext?.userProfile?.companyName || 'Not specified'}
- Skills: ${userContext?.userProfile?.skills?.join(', ') || 'Not specified'}
- Interests: ${userContext?.userProfile?.interests?.join(', ') || 'Not specified'}

TASK: Enhance the search query by considering:
1. User's career stage and experience level
2. Industry-specific collaboration opportunities
3. Complementary skills and roles
4. Professional networking value
5. Cross-functional partnership potential

OUTPUT: Return ONLY valid JSON:
{
  "enhancedQuery": "personalized search terms aligned with user's profile",
  "searchTerms": ["term1", "term2", "term3"],
  "intent": "what the user is looking for based on their profile"
}

EXAMPLES:
Input: Senior PM searching "co-founder"
Output: {"enhancedQuery": "technical co-founder CTO startup founder software engineer entrepreneur", "searchTerms": ["co-founder", "CTO", "technical founder"], "intent": "Technical business partner to complement product expertise"}

Input: Junior developer searching "backend engineer"  
Output: {"enhancedQuery": "backend engineer senior mentor full-stack developer API developer", "searchTerms": ["backend engineer", "senior mentor", "API developer"], "intent": "Backend expertise for learning and collaboration"} [/INST]`;

    console.log('Calling Mistral with prompt length:', prompt.length);
    const response = await invokeMistral(prompt);
    console.log('Mistral response:', response);

    // Extract JSON from Mistral's response (in case there's extra text)
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

// Result reranking function using Mistral
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
    const prompt = `You are an expert at matching professionals for collaboration and networking based on personalized compatibility.

The CURRENT LOGGED-IN USER searched for: "${originalQuery}"

CURRENT LOGGED-IN USER'S PROFILE:
- Role: ${userContext?.userProfile?.jobRole || 'Not specified'}
- Industry: ${userContext?.userProfile?.industry || 'Not specified'}
- Experience Level: ${userContext?.userProfile?.yearsOfExperience || 'Not specified'} years
- Company: ${userContext?.userProfile?.companyName || 'Not specified'}
- Skills: ${userContext?.userProfile?.skills?.join(', ') || 'Not specified'}
- Interests: ${userContext?.userProfile?.interests?.join(', ') || 'Not specified'}

Vector search returned these professional profiles that could potentially match the CURRENT USER's search:
${JSON.stringify(
  vectorResults.map(r => ({
    userId: r.userId,
    score: r.score,
    profile: r.profile,
  })),
  null,
  2
)}

For each profile, provide a personalized evaluation based on compatibility with the CURRENT USER:
1. A confidence score (0-100) based on how well they match the CURRENT USER's search intent and profile
2. A clear explanation of why they would be valuable for the CURRENT USER (ONLY include profiles with confidence score >= 40)
3. Key relevance factors that make them a good connection specifically for the CURRENT USER

IMPORTANT: EXCLUDE any profiles with confidence score below 40. Only return highly relevant matches for the CURRENT USER.

PERSONALIZED EVALUATION CRITERIA:
- Direct role/skill alignment with the CURRENT USER's search query
- Industry relevance and potential for collaboration with the CURRENT USER's industry
- Experience level compatibility (mentorship, peer collaboration, or learning opportunities)
- Complementary skills that would benefit the CURRENT USER's work
- Career stage alignment and networking value for the CURRENT USER
- Company size/type compatibility for meaningful professional relationships

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

    const response = await invokeMistral(prompt);
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
      error: `Mistral reranking failed, using fallback: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Keyword expansion function using Mistral
async function expandKeywords(
  originalQuery: string,
  userContext?: SearchContext
): Promise<{
  success: boolean;
  expandedTerms: string[];
  synonyms: string[];
  relatedTerms: string[];
  error?: string;
}> {
  try {
    console.log(`expandKeywords called with: "${originalQuery}"`);
    const prompt = `[INST] You are a professional search term expansion specialist.

TASK: Expand the search query "${originalQuery}" with relevant professional terms.

USER CONTEXT:
- Role: ${userContext?.userProfile?.jobRole || 'Not specified'}
- Industry: ${userContext?.userProfile?.industry || 'Not specified'}
- Experience: ${userContext?.userProfile?.yearsOfExperience || 'Not specified'} years

REQUIREMENTS:
1. Generate direct synonyms and alternative job titles
2. Include related roles and specializations
3. Add industry-specific terminology
4. Include relevant skills and technologies
5. Consider different seniority levels

OUTPUT: Return ONLY valid JSON in this exact format:
{
  "expandedTerms": ["term1", "term2", "term3"],
  "synonyms": ["synonym1", "synonym2"],
  "relatedTerms": ["related1", "related2", "related3"]
}

EXAMPLES:
Query: "software engineer"
Output: {"expandedTerms": ["software engineer", "developer", "programmer"], "synonyms": ["developer", "programmer", "software developer"], "relatedTerms": ["full stack", "backend", "frontend", "DevOps", "SRE"]}

Query: "marketing"  
Output: {"expandedTerms": ["marketing", "marketer", "digital marketing"], "synonyms": ["marketer", "marketing specialist"], "relatedTerms": ["digital marketing", "content marketing", "growth marketing", "brand manager"]} [/INST]`;

    const response = await invokeMistral(prompt);

    // Extract JSON from response
    let jsonText = response.trim();
    const jsonStart = jsonText.indexOf('{');
    const jsonEnd = jsonText.lastIndexOf('}') + 1;

    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      jsonText = jsonText.substring(jsonStart, jsonEnd);
    }

    const parsed = JSON.parse(jsonText);

    return {
      success: true,
      expandedTerms: parsed.expandedTerms || [],
      synonyms: parsed.synonyms || [],
      relatedTerms: parsed.relatedTerms || [],
    };
  } catch (error: unknown) {
    console.error('Error expanding keywords:', error);
    return {
      success: false,
      expandedTerms: [originalQuery],
      synonyms: [],
      relatedTerms: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Keyword-based search function with optimized scanning
async function keywordSearch(
  keywordTerms: string[],
  limit: number
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  let lastEvaluatedKey: Record<string, AttributeValue> | undefined;
  let processedItems = 0;
  const maxItemsToProcess = limit * 8; // Process fewer items for keyword search

  do {
    const scanParams = {
      TableName: USER_PROFILE_TABLE,
      FilterExpression: 'attribute_exists(profileEmbedding)',
      Limit: 50, // Smaller batch size for keyword processing
      ExclusiveStartKey: lastEvaluatedKey,
      ProjectionExpression:
        'userId, jobRole, companyName, industry, yearsOfExperience, education, about, interests, skills',
    };

    const scanResponse = await dynamoClient.send(new ScanCommand(scanParams));

    if (scanResponse.Items && scanResponse.Items.length > 0) {
      const batchResults = scanResponse.Items.map(item => {
        const userProfile = unmarshall(item);

        // Create searchable text from profile
        const profileText = createProfileText({
          jobRole: userProfile.jobRole,
          companyName: userProfile.companyName,
          industry: userProfile.industry,
          yearsOfExperience: userProfile.yearsOfExperience,
          education: userProfile.education,
          about: userProfile.about,
          interests: userProfile.interests,
          skills: userProfile.skills,
        }).toLowerCase();

        // Calculate keyword match score
        let matchCount = 0;
        let totalMatches = 0;

        for (const term of keywordTerms) {
          const termLower = term.toLowerCase();
          const matches = (profileText.match(new RegExp(termLower, 'g')) || [])
            .length;
          if (matches > 0) {
            matchCount++;
            totalMatches += matches;
          }
        }

        // Score based on percentage of terms matched and frequency
        const termMatchRatio = matchCount / keywordTerms.length;
        const frequencyBonus = Math.min(totalMatches / 10, 0.3); // Cap bonus at 0.3
        const keywordScore = termMatchRatio + frequencyBonus;

        // Early filtering - only keep results with decent keyword matches
        if (keywordScore <= 0.2) return null;

        return {
          userId: userProfile.userId,
          score: keywordScore,
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
      }).filter(
        (result: SearchResult | null): result is SearchResult => result !== null
      );

      results.push(...batchResults);
      processedItems += scanResponse.Items.length;
    }

    lastEvaluatedKey = scanResponse.LastEvaluatedKey;

    // Stop early if we have enough results or processed enough items
    if (results.length >= limit * 2 || processedItems >= maxItemsToProcess) {
      break;
    }
  } while (lastEvaluatedKey);

  return results
    .sort((a: SearchResult, b: SearchResult) => b.score - a.score)
    .slice(0, limit);
}

// Hybrid search combining semantic and keyword search
async function hybridSearch(
  query: string,
  keywordTerms: string[],
  limit: number
): Promise<{
  results: SearchResult[];
  hybridScores: { semantic: number; keyword: number; combined: number }[];
}> {
  // Get semantic search results
  const semanticResults = await searchUsers(query, limit * 2);

  // Get keyword search results
  const keywordResults = await keywordSearch(keywordTerms, limit * 2);

  if (!semanticResults.success || !semanticResults.results) {
    return { results: keywordResults.slice(0, limit), hybridScores: [] };
  }

  // Create a map to combine scores
  const userScores = new Map<string, { semantic: number; keyword: number }>();

  // Add semantic scores
  for (const result of semanticResults.results) {
    userScores.set(result.userId, { semantic: result.score, keyword: 0 });
  }

  // Add keyword scores
  for (const result of keywordResults) {
    const existing = userScores.get(result.userId);
    if (existing) {
      existing.keyword = result.score;
    } else {
      userScores.set(result.userId, { semantic: 0, keyword: result.score });
    }
  }

  // Calculate hybrid scores and create results
  const hybridResults: SearchResult[] = [];
  const hybridScores: {
    semantic: number;
    keyword: number;
    combined: number;
  }[] = [];

  // Get all unique users from both searches
  const allUsers = new Map<string, SearchResult>();

  for (const result of semanticResults.results) {
    allUsers.set(result.userId, result);
  }

  for (const result of keywordResults) {
    if (!allUsers.has(result.userId)) {
      allUsers.set(result.userId, result);
    }
  }

  for (const [userId, userResult] of allUsers) {
    const scores = userScores.get(userId);
    if (!scores) continue;

    // Weighted combination: 60% semantic, 40% keyword
    const combinedScore = scores.semantic * 0.6 + scores.keyword * 0.4;

    hybridResults.push({
      ...userResult,
      score: combinedScore,
    });

    hybridScores.push({
      semantic: scores.semantic,
      keyword: scores.keyword,
      combined: combinedScore,
    });
  }

  // Sort by combined score
  const sortedIndices = hybridResults
    .map((_, index) => index)
    .sort((a, b) => hybridResults[b].score - hybridResults[a].score);

  const sortedResults = sortedIndices
    .map(i => hybridResults[i])
    .slice(0, limit);
  const sortedScores = sortedIndices.map(i => hybridScores[i]).slice(0, limit);

  return {
    results: sortedResults,
    hybridScores: sortedScores,
  };
}

// Advanced RAG search function
async function advancedRAGSearch(
  query: string,
  userContext?: SearchContext,
  limit: number = 10
): Promise<EmbeddingResponse> {
  try {
    console.log(`Starting advanced RAG search for query: "${query}"`);

    // Step 1: Keyword Expansion
    console.log('Step 1: Expanding keywords...');
    const keywordExpansion = await expandKeywords(query, userContext);
    console.log(
      'Keyword expansion result:',
      JSON.stringify(keywordExpansion, null, 2)
    );

    const allKeywords = [
      ...keywordExpansion.expandedTerms,
      ...keywordExpansion.synonyms,
      ...keywordExpansion.relatedTerms,
    ].filter(Boolean);

    // Step 2: Hybrid Search (Semantic + Keyword)
    console.log('Step 2: Performing hybrid search...');
    const { results: hybridResults, hybridScores } = await hybridSearch(
      query,
      allKeywords,
      limit * 2 // Get more results for LLM filtering
    );

    console.log(`Hybrid search returned ${hybridResults.length} results`);

    if (hybridResults.length === 0) {
      return {
        success: true,
        results: [],
        keywordTerms: allKeywords,
        hybridScores: [],
      };
    }

    // Step 3: LLM Reasoning and Filtering (DISABLED for performance)
    console.log('Step 3: Skipping LLM reasoning for performance...');
    
    // TODO: Re-enable LLM reasoning when rate limits are resolved
    /*
    const ragReasoningPrompt = `[INST] You are a professional matching AI that ranks search results for optimal relevance.

SEARCH QUERY: "${query}"

USER PROFILE:
${JSON.stringify(userContext?.userProfile || {}, null, 2)}

CANDIDATE RESULTS:
${JSON.stringify(hybridResults.slice(0, 15), null, 2)}

TASK: Select the top ${limit} most relevant professionals for this user's search.

RANKING CRITERIA:
1. Direct relevance to search query
2. Professional compatibility with user's profile
3. Potential for meaningful collaboration
4. Complementary skills and experience
5. Industry alignment

OUTPUT: Return ONLY valid JSON with selected professionals:
{
  "selectedResults": [
    {
      "userId": "user123",
      "score": 0.85,
      "profile": {...},
      "reasoningScore": 92
    }
  ]
}

REQUIREMENTS:
- Only include professionals with reasoningScore >= 70
- Maximum ${limit} results
- Maintain original profile structure
- Score professionals 0-100 based on relevance [/INST]`;

    const ragResponse = await invokeMistral(ragReasoningPrompt);

    let ragResult;
    try {
      // Extract JSON from response
      let jsonText = ragResponse.trim();
      const jsonStart = jsonText.indexOf('{');
      const jsonEnd = jsonText.lastIndexOf('}') + 1;

      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        jsonText = jsonText.substring(jsonStart, jsonEnd);
      }

      ragResult = JSON.parse(jsonText);
    } catch (_parseError) {
      console.warn(
        'Failed to parse RAG reasoning response, using hybrid results'
      );
      ragResult = {
        selectedResults: hybridResults.slice(0, limit),
      };
    }

    const finalResults =
      ragResult.selectedResults || hybridResults.slice(0, limit);
    */

    // Skip LLM reasoning for performance - return hybrid results directly
    const finalResults = hybridResults.slice(0, limit);

    console.log(`RAG search returning ${finalResults.length} hybrid results (LLM reasoning disabled)`);

    return {
      success: true,
      results: finalResults,
      keywordTerms: allKeywords,
      hybridScores: hybridScores.slice(0, finalResults.length),
    };
  } catch (error: unknown) {
    console.error('Error in advanced RAG search:', error);

    // Fallback to basic search
    console.log('Falling back to basic vector search');
    try {
      const fallbackResults = await searchUsers(query, limit);
      return {
        ...fallbackResults,
      };
    } catch (_fallbackError: unknown) {
      return {
        success: false,
        error: `Both RAG and fallback search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
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

    // Step 1: Enhance query with Mistral
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

    // Step 3: Return results based on vector similarity only (no Claude reranking)
    const finalResults = vectorResults.results.slice(0, limit);

    console.log(`Returning ${finalResults.length} vector-based results`);

    return {
      success: true,
      results: finalResults, // Use regular results format, not enhancedResults
      enhancedQuery: searchQuery,
    };
  } catch (error: unknown) {
    console.error('Error in intelligent search:', error);

    // Fallback to basic search
    console.log('Falling back to basic vector search');
    try {
      const fallbackResults = await searchUsers(query, limit);
      return {
        ...fallbackResults,
      };
    } catch (fallbackError: unknown) {
      return {
        success: false,
        error: `Both intelligent and fallback search failed: ${error instanceof Error ? error.message : 'Unknown error'}, ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`,
      };
    }
  }
}
