import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import fetch from 'node-fetch';

// Helper function to make HTTP requests with token authentication
async function makeHttpRequest(
  config: { endpoint: string; token: string },
  method: string,
  requestPath: string,
  body?: string
): Promise<any> {
  // Mock mode for testing when Vespa Cloud is not set up
  if (config.endpoint === 'mock://localhost') {
    console.log(`Mock Vespa request: ${method} ${requestPath}`);

    // Return mock responses based on the request path
    if (requestPath.includes('/search/')) {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () =>
          Promise.resolve({
            root: {
              fields: { totalCount: 0 },
              children: [],
            },
          }),
        text: () =>
          Promise.resolve('{"root":{"fields":{"totalCount":0},"children":[]}}'),
      };
    } else if (requestPath.includes('/document/')) {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve({ pathId: 'mock-doc-id' }),
        text: () => Promise.resolve('{"pathId":"mock-doc-id"}'),
      };
    }

    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({}),
      text: () => Promise.resolve('{}'),
    };
  }

  const url = config.endpoint + requestPath;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.token}`,
    };

    if (body) {
      headers['Content-Length'] = Buffer.byteLength(body).toString();
    }

    const response = await fetch(url, {
      method,
      headers,
      ...(body && { body }),
    });

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

// Cache for Vespa configuration
let vespaConfig: {
  endpoint: string;
  token: string;
} | null = null;

// Get Vespa configuration from Parameter Store
async function getVespaConfig() {
  if (vespaConfig) {
    return vespaConfig;
  }

  const stackHash = process.env.STACK_HASH || 'default';

  try {
    const [endpointParam, tokenParam] = await Promise.all([
      ssmClient.send(
        new GetParameterCommand({
          Name: `/loopn/${stackHash}/vespa/endpoint`,
          WithDecryption: true,
        })
      ),
      ssmClient.send(
        new GetParameterCommand({
          Name: `/loopn/${stackHash}/vespa/token`,
          WithDecryption: true,
        })
      ),
    ]);

    const endpoint = endpointParam.Parameter?.Value;
    const token = tokenParam.Parameter?.Value;

    if (!endpoint) {
      throw new Error(
        `Vespa endpoint parameter not found at /loopn/${stackHash}/vespa/endpoint`
      );
    }

    if (!token) {
      throw new Error(
        `Vespa token parameter not found at /loopn/${stackHash}/vespa/token`
      );
    }

    // Check for placeholder values - for now, allow mock mode for testing
    if (token.includes('placeholder') || !token || token.trim() === '') {
      console.log(
        'Vespa token not configured, running in mock mode for testing'
      );
      // Return mock config for testing
      vespaConfig = {
        endpoint: 'mock://localhost',
        token: 'mock-token',
      };
      return vespaConfig;
    }

    if (!endpoint || endpoint.includes('placeholder')) {
      throw new Error(
        `Vespa endpoint not configured. Please set /loopn/${stackHash}/vespa/endpoint with your actual Vespa Cloud endpoint.`
      );
    }

    vespaConfig = {
      endpoint: endpoint.replace(/\/$/, ''), // Remove trailing slash
      token,
    };

    return vespaConfig;
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

// Search users using Vespa's intelligent search capabilities
async function searchUsers(
  config: { endpoint: string; token: string },
  query: string,
  limit: number = 10,
  filters?: Record<string, any>,
  rankingProfile: string = 'default'
): Promise<SearchResponse> {
  try {
    // Build Vespa YQL query
    let yqlQuery = 'select * from sources user_profile where ';

    // Add text search
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

      yqlQuery += `(${searchFields
        .map(field => `${field} contains "${query.replace(/"/g, '\\"')}"`)
        .join(' OR ')})`;
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
  config: { endpoint: string; token: string },
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
  config: { endpoint: string; token: string },
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

// Index a user profile
async function indexUser(
  config: { endpoint: string; token: string },
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
        profileVector: userProfile.profileVector || new Array(1024).fill(0),
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
  config: { endpoint: string; token: string },
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

// Update a user profile
async function updateUser(
  config: { endpoint: string; token: string },
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
        profileVector: {
          assign: userProfile.profileVector || new Array(1024).fill(0),
        },
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
  config: { endpoint: string; token: string },
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
