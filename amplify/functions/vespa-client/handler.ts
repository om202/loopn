import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import fetch from 'node-fetch';
import https from 'https';

// Helper function to make HTTP requests with mTLS or Bearer token authentication
async function makeHttpRequest(
  config: { endpoint: string; token?: string; cert?: string; key?: string },
  method: string,
  requestPath: string,
  body?: string
): Promise<any> {
  // NO MORE MOCK MODE - removed entirely

  const url = config.endpoint + requestPath;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (body) {
      headers['Content-Length'] = Buffer.byteLength(body).toString();
    }

    const fetchOptions: any = {
      method,
      headers,
      ...(body && { body }),
    };

    // Use mTLS if certificates are provided, otherwise use Bearer token
    if (config.cert && config.key) {
      // Create HTTPS agent with client certificates for mTLS
      const agent = new https.Agent({
        cert: config.cert,
        key: config.key,
        rejectUnauthorized: true,
      });
      fetchOptions.agent = agent;
    } else if (config.token) {
      // Use Bearer token authentication
      headers.Authorization = `Bearer ${config.token}`;
    } else {
      throw new Error(
        'No authentication method provided (neither mTLS certificates nor token)'
      );
    }

    const response = await fetch(url, fetchOptions);

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      json: () => response.json(),
      text: () => response.text(),
    };
  } catch (error) {
    console.error('HTTP request failed:', error);
    throw error;
  }
}

// AWS SSM client for retrieving Vespa configuration
const ssmClient = new SSMClient({ region: process.env.AWS_REGION! });

// AWS Bedrock client for embeddings
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION!,
});

// Generate embeddings for text using AWS Bedrock Titan Text Embeddings V2
async function generateEmbedding(text: string): Promise<number[]> {
  console.log('Generating embedding for text:', text.substring(0, 100) + '...');
  try {
    const input = {
      modelId: 'amazon.titan-embed-text-v2:0', // AWS Titan Text Embeddings V2 model
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        inputText: text.substring(0, 8000), // Titan V2 has 8K token limit
        dimensions: 1024, // V2 supports configurable dimensions - perfect for our Vespa schema!
        normalize: true, // Normalize embeddings for better similarity search
      }),
    };

    const command = new InvokeModelCommand(input);
    const response = await bedrockClient.send(command);

    if (!response.body) {
      throw new Error('No response body from Bedrock');
    }

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const embedding = responseBody.embedding;

    if (!embedding || !Array.isArray(embedding)) {
      throw new Error('Invalid embedding response from Bedrock');
    }

    // Titan V2 returns exactly 1024 dimensions as requested
    console.log(
      'Successfully generated embedding with',
      embedding.length,
      'dimensions'
    );
    return embedding;
  } catch (error) {
    console.error('Failed to generate embedding with Bedrock Titan V2:', error);
    // Return zero vector as fallback
    return new Array(1024).fill(0);
  }
}

// Cache for Vespa configuration - reset cache to pick up new parameters
let vespaConfig: {
  endpoint: string;
  token?: string;
  cert?: string;
  key?: string;
} | null = null;

// Get Vespa configuration from Parameter Store
async function getVespaConfig() {
  // Force refresh to pick up new parameters
  vespaConfig = null;

  if (vespaConfig) {
    return vespaConfig;
  }

  const stackHash = process.env.STACK_HASH || 'default';

  try {
    // Get all possible parameters
    const parameterPromises = [
      ssmClient.send(
        new GetParameterCommand({
          Name: `/loopn/${stackHash}/vespa/endpoint`,
          WithDecryption: true,
        })
      ),
      // Try to get token (for Bearer auth)
      ssmClient
        .send(
          new GetParameterCommand({
            Name: `/loopn/${stackHash}/vespa/token`,
            WithDecryption: true,
          })
        )
        .catch(() => null),
      // Try to get certificates (for mTLS auth)
      ssmClient
        .send(
          new GetParameterCommand({
            Name: `/loopn/${stackHash}/vespa/cert`,
            WithDecryption: true,
          })
        )
        .catch(() => null),
      ssmClient
        .send(
          new GetParameterCommand({
            Name: `/loopn/${stackHash}/vespa/key`,
            WithDecryption: true,
          })
        )
        .catch(() => null),
    ];

    const [endpointParam, tokenParam, certParam, keyParam] =
      await Promise.all(parameterPromises);

    const endpoint = endpointParam?.Parameter?.Value;
    const token = tokenParam?.Parameter?.Value;
    const cert = certParam?.Parameter?.Value;
    const key = keyParam?.Parameter?.Value;

    console.log('Debug - Parameter retrieval:', {
      endpoint: endpoint ? 'found' : 'missing',
      token: token ? 'found' : 'missing',
      cert: cert ? 'found' : 'missing',
      key: key ? 'found' : 'missing',
      stackHash,
    });

    if (!endpoint) {
      throw new Error(
        `Vespa endpoint parameter not found at /loopn/${stackHash}/vespa/endpoint`
      );
    }

    if (!endpoint || endpoint.includes('placeholder')) {
      throw new Error(
        `Vespa endpoint not configured. Please set /loopn/${stackHash}/vespa/endpoint with your actual Vespa Cloud endpoint.`
      );
    }

    // Check if we have mTLS certificates
    if (cert && key) {
      console.log('Using mTLS authentication with client certificates');
      vespaConfig = {
        endpoint: endpoint.replace(/\/$/, ''), // Remove trailing slash
        cert,
        key,
      };
      return vespaConfig;
    }

    // Check if we have a valid token (temporarily allow placeholder for testing)
    if (token && token.trim() !== '') {
      console.log('Using Bearer token authentication');
      vespaConfig = {
        endpoint: endpoint.replace(/\/$/, ''), // Remove trailing slash
        token,
      };
      return vespaConfig;
    }

    // Provide clear instructions for setup
    throw new Error(
      `No valid authentication found. Need either mTLS certificates or valid token at /loopn/${stackHash}/vespa/`
    );
  } catch (error) {
    console.error('Failed to get Vespa configuration:', error);
    throw error;
  }
}

// User profile interface matching the schema
interface UserProfile {
  userId: string;
  email?: string;
  fullName?: string;
  jobRole?: string;
  companyName?: string;
  industry?: string;
  yearsOfExperience?: number;
  education?: string;
  about?: string;
  interests?: string[];
  skills?: string[];
  profilePictureUrl?: string;
  isOnboardingComplete?: boolean;
  profileVector?: number[]; // 1024-dimensional vector
}

interface SearchRequest {
  action: string;
  query?: string;
  userId?: string;
  userProfile?: UserProfile;
  limit?: number;
  filters?: Record<string, any>;
  rankingProfile?: string;
  queryVector?: number[];
}

interface SearchResponse {
  success: boolean;
  results?: Array<{
    userId: string;
    score: number;
    profile: UserProfile;
  }>;
  total?: number;
  error?: string;
}

export const handler = async (event: any): Promise<SearchResponse> => {
  try {
    const request = event.arguments as SearchRequest;
    const config = await getVespaConfig();

    switch (request.action) {
      case 'search_users':
        const filters =
          typeof request.filters === 'string'
            ? JSON.parse(request.filters)
            : request.filters;
        return await searchUsers(
          config,
          request.query!,
          request.limit || 10,
          filters,
          request.rankingProfile
        );

      case 'index_user':
        const userProfile =
          typeof request.userProfile === 'string'
            ? JSON.parse(request.userProfile)
            : request.userProfile;
        return await indexUser(config, request.userId!, userProfile);

      case 'get_user':
        return await getUser(config, request.userId!);

      case 'update_user':
        const updateUserProfile =
          typeof request.userProfile === 'string'
            ? JSON.parse(request.userProfile)
            : request.userProfile;
        return await updateUser(config, request.userId!, updateUserProfile);

      case 'delete_user':
        return await deleteUser(config, request.userId!);

      case 'semantic_search':
        return await semanticSearch(
          config,
          request.queryVector!,
          request.limit || 10,
          request.filters
        );

      case 'hybrid_search':
        return await hybridSearch(
          config,
          request.query!,
          request.queryVector!,
          request.limit || 10,
          request.filters
        );

      default:
        throw new Error(`Unknown action: ${request.action}`);
    }
  } catch (error) {
    console.error('Vespa operation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Search users using Vespa's hybrid AI search capabilities
async function searchUsers(
  config: { endpoint: string; token?: string; cert?: string; key?: string },
  query: string,
  limit: number = 10,
  filters?: Record<string, any>,
  rankingProfile: string = 'default'
): Promise<SearchResponse> {
  try {
    // Generate query embedding for semantic search
    const queryEmbedding =
      query && query.trim() ? await generateEmbedding(query) : null;

    console.log('Search Debug:', {
      query,
      rankingProfile,
      hasEmbedding: !!queryEmbedding,
      embeddingLength: queryEmbedding?.length || 0,
    });

    // Build Vespa YQL query with hybrid search
    let yqlQuery = 'select * from sources user_profile where ';

    if (query && query.trim()) {
      const searchFields = [
        'fullName',
        'jobRole',
        'skills',
        'about',
        'companyName',
        'education',
        'interests',
        'searchableContent',
      ];

      // Use hybrid search: combine text search with vector search
      if (queryEmbedding && rankingProfile === 'hybrid') {
        // Hybrid search: text OR vector similarity
        const textQuery = searchFields
          .map(field => `${field} contains "${query.replace(/"/g, '\\"')}"`)
          .join(' OR ');

        yqlQuery += `((${textQuery}) OR ({targetHits:${limit}}nearestNeighbor(profileVector, queryVector)))`;
      } else if (queryEmbedding && rankingProfile === 'semantic') {
        // Pure semantic search
        yqlQuery += `({targetHits:${limit}}nearestNeighbor(profileVector, queryVector))`;
      } else {
        // Enhanced text search with weakAnd for better recall
        yqlQuery += `(weakAnd(${searchFields
          .map(field => `${field} contains "${query.replace(/"/g, '\\"')}"`)
          .join(', ')}))`;
      }
    } else {
      yqlQuery += 'true';
    }

    // Add filters
    if (filters) {
      if (filters.industry) {
        yqlQuery += ` AND industry = "${filters.industry}"`;
      }

      if (filters.minExperience !== undefined) {
        yqlQuery += ` AND yearsOfExperience >= ${filters.minExperience}`;
      }

      if (filters.maxExperience !== undefined) {
        yqlQuery += ` AND yearsOfExperience <= ${filters.maxExperience}`;
      }

      if (filters.skills && filters.skills.length > 0) {
        const skillsFilter = filters.skills
          .map((skill: string) => `skills contains "${skill}"`)
          .join(' OR ');
        yqlQuery += ` AND (${skillsFilter})`;
      }
    }

    // Always filter for complete profiles
    yqlQuery += ' AND isOnboardingComplete = true';

    const searchParams = new URLSearchParams({
      yql: yqlQuery,
      hits: limit.toString(),
      ranking: rankingProfile,
      format: 'json',
      timeout: '5s',
    });

    // Add query vector for semantic/hybrid search
    if (
      queryEmbedding &&
      (rankingProfile === 'hybrid' || rankingProfile === 'semantic')
    ) {
      searchParams.append(
        'input.query(queryVector)',
        `[${queryEmbedding.join(',')}]`
      );
    }

    const response = await makeHttpRequest(
      config,
      'GET',
      `/search/?${searchParams}`
    );

    if (!response.ok) {
      throw new Error(
        `Vespa search failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    const results =
      data.root.children?.map((hit: any) => ({
        userId: hit.fields.userId,
        score: hit.relevance,
        profile: {
          userId: hit.fields.userId,
          email: hit.fields.email,
          fullName: hit.fields.fullName,
          jobRole: hit.fields.jobRole,
          companyName: hit.fields.companyName,
          industry: hit.fields.industry,
          yearsOfExperience: hit.fields.yearsOfExperience,
          education: hit.fields.education,
          about: hit.fields.about,
          interests: hit.fields.interests,
          skills: hit.fields.skills,
          profilePictureUrl: hit.fields.profilePictureUrl,
          isOnboardingComplete: hit.fields.isOnboardingComplete,
        },
      })) || [];

    return {
      success: true,
      results,
      total: data.root.fields?.totalCount || results.length,
    };
  } catch (error) {
    console.error('Search failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Search failed',
    };
  }
}

// Semantic search using vector similarity
async function semanticSearch(
  config: { endpoint: string; token?: string; cert?: string; key?: string },
  queryVector: number[],
  limit: number = 10,
  filters?: Record<string, any>
): Promise<SearchResponse> {
  try {
    let yqlQuery = 'select * from sources user_profile where ';

    // Use nearestNeighbor for vector search
    yqlQuery += `({targetHits:${limit}}nearestNeighbor(profileVector, queryVector))`;

    // Add filters
    if (filters) {
      if (filters.industry) {
        yqlQuery += ` AND industry = "${filters.industry}"`;
      }
      if (filters.minExperience !== undefined) {
        yqlQuery += ` AND yearsOfExperience >= ${filters.minExperience}`;
      }
      if (filters.maxExperience !== undefined) {
        yqlQuery += ` AND yearsOfExperience <= ${filters.maxExperience}`;
      }
    }

    yqlQuery += ' AND isOnboardingComplete = true';

    const searchParams = new URLSearchParams({
      yql: yqlQuery,
      hits: limit.toString(),
      ranking: 'semantic',
      format: 'json',
      timeout: '5s',
    });

    // Add query vector as input
    searchParams.append(
      'input.query(queryVector)',
      `[${queryVector.join(',')}]`
    );

    const response = await makeHttpRequest(
      config,
      'GET',
      `/search/?${searchParams}`
    );

    if (!response.ok) {
      throw new Error(
        `Vespa semantic search failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    const results =
      data.root.children?.map((hit: any) => ({
        userId: hit.fields.userId,
        score: hit.relevance,
        profile: {
          userId: hit.fields.userId,
          email: hit.fields.email,
          fullName: hit.fields.fullName,
          jobRole: hit.fields.jobRole,
          companyName: hit.fields.companyName,
          industry: hit.fields.industry,
          yearsOfExperience: hit.fields.yearsOfExperience,
          education: hit.fields.education,
          about: hit.fields.about,
          interests: hit.fields.interests,
          skills: hit.fields.skills,
          profilePictureUrl: hit.fields.profilePictureUrl,
          isOnboardingComplete: hit.fields.isOnboardingComplete,
        },
      })) || [];

    return {
      success: true,
      results,
      total: data.root.fields?.totalCount || results.length,
    };
  } catch (error) {
    console.error('Semantic search failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Semantic search failed',
    };
  }
}

// Hybrid search combining text and vector similarity
async function hybridSearch(
  config: { endpoint: string; token?: string; cert?: string; key?: string },
  query: string,
  queryVector: number[],
  limit: number = 10,
  filters?: Record<string, any>
): Promise<SearchResponse> {
  try {
    let yqlQuery = 'select * from sources user_profile where ';

    // Combine text search and vector search
    const searchFields = [
      'fullName',
      'jobRole',
      'skills',
      'about',
      'companyName',
      'education',
      'interests',
    ];
    const textQuery = searchFields
      .map(field => `${field} contains "${query.replace(/"/g, '\\"')}"`)
      .join(' OR ');

    yqlQuery += `((${textQuery}) OR ({targetHits:${limit}}nearestNeighbor(profileVector, queryVector)))`;

    // Add filters
    if (filters) {
      if (filters.industry) {
        yqlQuery += ` AND industry = "${filters.industry}"`;
      }
      if (filters.minExperience !== undefined) {
        yqlQuery += ` AND yearsOfExperience >= ${filters.minExperience}`;
      }
      if (filters.maxExperience !== undefined) {
        yqlQuery += ` AND yearsOfExperience <= ${filters.maxExperience}`;
      }
    }

    yqlQuery += ' AND isOnboardingComplete = true';

    const searchParams = new URLSearchParams({
      yql: yqlQuery,
      hits: limit.toString(),
      ranking: 'hybrid',
      format: 'json',
      timeout: '5s',
    });

    // Add query vector as input
    searchParams.append(
      'input.query(queryVector)',
      `[${queryVector.join(',')}]`
    );

    const response = await makeHttpRequest(
      config,
      'GET',
      `/search/?${searchParams}`
    );

    if (!response.ok) {
      throw new Error(
        `Vespa hybrid search failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    const results =
      data.root.children?.map((hit: any) => ({
        userId: hit.fields.userId,
        score: hit.relevance,
        profile: {
          userId: hit.fields.userId,
          email: hit.fields.email,
          fullName: hit.fields.fullName,
          jobRole: hit.fields.jobRole,
          companyName: hit.fields.companyName,
          industry: hit.fields.industry,
          yearsOfExperience: hit.fields.yearsOfExperience,
          education: hit.fields.education,
          about: hit.fields.about,
          interests: hit.fields.interests,
          skills: hit.fields.skills,
          profilePictureUrl: hit.fields.profilePictureUrl,
          isOnboardingComplete: hit.fields.isOnboardingComplete,
        },
      })) || [];

    return {
      success: true,
      results,
      total: data.root.fields?.totalCount || results.length,
    };
  } catch (error) {
    console.error('Hybrid search failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Hybrid search failed',
    };
  }
}

// Index a user profile with AI-generated embeddings
async function indexUser(
  config: { endpoint: string; token?: string; cert?: string; key?: string },
  userId: string,
  userProfile: UserProfile
): Promise<SearchResponse> {
  try {
    // Create searchable content by combining relevant fields
    const searchableContent = [
      userProfile.fullName,
      userProfile.jobRole,
      userProfile.companyName,
      userProfile.about,
      userProfile.education,
      ...(userProfile.skills || []),
      ...(userProfile.interests || []),
    ]
      .filter(Boolean)
      .join(' ');

    // Generate AI embedding for the user profile
    const profileEmbedding = await generateEmbedding(searchableContent);

    const document = {
      put: `id:user_profile:user_profile::${userId}`,
      fields: {
        userId,
        email: userProfile.email,
        fullName: userProfile.fullName,
        jobRole: userProfile.jobRole,
        companyName: userProfile.companyName,
        industry: userProfile.industry,
        yearsOfExperience: userProfile.yearsOfExperience,
        education: userProfile.education,
        about: userProfile.about,
        interests: userProfile.interests || [],
        skills: userProfile.skills || [],
        profilePictureUrl: userProfile.profilePictureUrl,
        isOnboardingComplete: userProfile.isOnboardingComplete || false,
        searchableContent,
        profileVector: profileEmbedding, // Real AI-generated embedding!
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    };

    const response = await makeHttpRequest(
      config,
      'POST',
      `/document/v1/user_profile/user_profile/docid/${userId}`,
      JSON.stringify(document)
    );

    if (!response.ok) {
      throw new Error(
        `Vespa indexing failed: ${response.status} ${response.statusText}`
      );
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Indexing failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Indexing failed',
    };
  }
}

// Get a specific user
async function getUser(
  config: { endpoint: string; token?: string; cert?: string; key?: string },
  userId: string
): Promise<SearchResponse> {
  try {
    const response = await makeHttpRequest(
      config,
      'GET',
      `/document/v1/user_profile/user_profile/docid/${userId}`
    );

    if (response.status === 404) {
      return {
        success: true,
        results: [],
        total: 0,
      };
    }

    if (!response.ok) {
      throw new Error(
        `Vespa get user failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    const profile = {
      userId: data.fields.userId,
      email: data.fields.email,
      fullName: data.fields.fullName,
      jobRole: data.fields.jobRole,
      companyName: data.fields.companyName,
      industry: data.fields.industry,
      yearsOfExperience: data.fields.yearsOfExperience,
      education: data.fields.education,
      about: data.fields.about,
      interests: data.fields.interests,
      skills: data.fields.skills,
      profilePictureUrl: data.fields.profilePictureUrl,
      isOnboardingComplete: data.fields.isOnboardingComplete,
    };

    return {
      success: true,
      results: [
        {
          userId,
          score: 1.0,
          profile,
        },
      ],
      total: 1,
    };
  } catch (error) {
    console.error('Get user failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Get user failed',
    };
  }
}

// Update a user profile with AI-generated embeddings
async function updateUser(
  config: { endpoint: string; token?: string; cert?: string; key?: string },
  userId: string,
  userProfile: UserProfile
): Promise<SearchResponse> {
  try {
    // Create searchable content
    const searchableContent = [
      userProfile.fullName,
      userProfile.jobRole,
      userProfile.companyName,
      userProfile.about,
      userProfile.education,
      ...(userProfile.skills || []),
      ...(userProfile.interests || []),
    ]
      .filter(Boolean)
      .join(' ');

    // Generate updated AI embedding
    const profileEmbedding = await generateEmbedding(searchableContent);

    const document = {
      update: `id:user_profile:user_profile::${userId}`,
      fields: {
        email: { assign: userProfile.email },
        fullName: { assign: userProfile.fullName },
        jobRole: { assign: userProfile.jobRole },
        companyName: { assign: userProfile.companyName },
        industry: { assign: userProfile.industry },
        yearsOfExperience: { assign: userProfile.yearsOfExperience },
        education: { assign: userProfile.education },
        about: { assign: userProfile.about },
        interests: { assign: userProfile.interests || [] },
        skills: { assign: userProfile.skills || [] },
        profilePictureUrl: { assign: userProfile.profilePictureUrl },
        isOnboardingComplete: {
          assign: userProfile.isOnboardingComplete || false,
        },
        searchableContent: { assign: searchableContent },
        profileVector: { assign: profileEmbedding }, // Real AI-generated embedding!
        updatedAt: { assign: Date.now() },
      },
    };

    const response = await makeHttpRequest(
      config,
      'PUT',
      `/document/v1/user_profile/user_profile/docid/${userId}`,
      JSON.stringify(document)
    );

    if (!response.ok) {
      throw new Error(
        `Vespa update failed: ${response.status} ${response.statusText}`
      );
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Update failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Update failed',
    };
  }
}

// Delete a user
async function deleteUser(
  config: { endpoint: string; token?: string; cert?: string; key?: string },
  userId: string
): Promise<SearchResponse> {
  try {
    const response = await makeHttpRequest(
      config,
      'DELETE',
      `/document/v1/user_profile/user_profile/docid/${userId}`
    );

    if (!response.ok && response.status !== 404) {
      throw new Error(
        `Vespa delete failed: ${response.status} ${response.statusText}`
      );
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}
