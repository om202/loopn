import { Client } from '@opensearch-project/opensearch';
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';
import { defaultProvider } from '@aws-sdk/credential-provider-node';

// OpenSearch configuration
const OPENSEARCH_ENDPOINT = process.env.OPENSEARCH_ENDPOINT!;
const USER_INDEX = 'user-profiles';

// Initialize OpenSearch client with AWS signing
const client = new Client({
  ...AwsSigv4Signer({
    region: process.env.AWS_REGION!,
    service: 'aoss', // OpenSearch Serverless
    getCredentials: () => defaultProvider()(),
  }),
  node: OPENSEARCH_ENDPOINT,
});

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
}

interface SearchRequest {
  action: string;
  query?: string;
  userId?: string;
  userProfile?: UserProfile;
  limit?: number;
  filters?: Record<string, any>;
}

interface SearchResponse {
  success: boolean;
  results?: any[];
  total?: number;
  error?: string;
}

export const handler = async (event: any): Promise<SearchResponse> => {
  try {
    const request = event.arguments as SearchRequest;

    switch (request.action) {
      case 'search_users':
        return await searchUsers(
          request.query!,
          request.limit || 10,
          request.filters
        );

      case 'index_user':
        return await indexUser(request.userId!, request.userProfile!);

      case 'get_user':
        return await getUser(request.userId!);

      case 'update_user':
        return await updateUser(request.userId!, request.userProfile!);

      case 'delete_user':
        return await deleteUser(request.userId!);

      case 'initialize_index':
        return await initializeIndex();

      default:
        throw new Error(`Unknown action: ${request.action}`);
    }
  } catch (error) {
    console.error('OpenSearch operation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Initialize the user profiles index with proper mapping
async function initializeIndex(): Promise<SearchResponse> {
  const indexMapping = {
    mappings: {
      properties: {
        userId: { type: 'keyword' },
        email: { type: 'keyword' },
        fullName: {
          type: 'text',
          analyzer: 'standard',
          fields: {
            keyword: { type: 'keyword' },
          },
        },
        jobRole: {
          type: 'text',
          analyzer: 'standard',
          fields: {
            keyword: { type: 'keyword' },
          },
        },
        companyName: {
          type: 'text',
          analyzer: 'standard',
          fields: {
            keyword: { type: 'keyword' },
          },
        },
        industry: { type: 'keyword' },
        yearsOfExperience: { type: 'integer' },
        education: { type: 'text' },
        about: { type: 'text' },
        interests: { type: 'keyword' },
        skills: { type: 'keyword' },
        profilePictureUrl: { type: 'keyword' },
        isOnboardingComplete: { type: 'boolean' },

        // Combined text field for intelligent search
        searchableContent: {
          type: 'text',
          analyzer: 'standard',
        },

        // Vector field for semantic search (if needed later)
        profileVector: {
          type: 'knn_vector',
          dimension: 1024,
          method: {
            name: 'hnsw',
            space_type: 'cosinesimil',
            engine: 'nmslib',
          },
        },

        // Timestamps
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
      },
    },
    settings: {
      index: {
        // Enable k-NN for vector search
        knn: true,
        'knn.algo_param.ef_search': 100,
        // Number of replicas for high availability
        // Current: 0 (cost optimized for low users)
        // Scale to: 1 when users > 500 for production reliability
        number_of_replicas: 0,
      },
    },
  };

  try {
    // Check if index exists
    const indexExists = await client.indices.exists({ index: USER_INDEX });

    if (!indexExists.body) {
      // Create index with mapping
      await client.indices.create({
        index: USER_INDEX,
        body: indexMapping,
      });

      console.log(`Created index: ${USER_INDEX}`);
    } else {
      console.log(`Index ${USER_INDEX} already exists`);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to initialize index:', error);
    throw error;
  }
}

// Search users using OpenSearch's intelligent search capabilities
async function searchUsers(
  query: string,
  limit: number = 10,
  filters?: Record<string, any>
): Promise<SearchResponse> {
  const searchBody: any = {
    size: limit,
    query: {
      bool: {
        must: [],
        filter: [],
      },
    },
    highlight: {
      fields: {
        fullName: {},
        jobRole: {},
        about: {},
        skills: {},
        interests: {},
      },
    },
    sort: [{ _score: { order: 'desc' } }],
  };

  // Use OpenSearch's intelligent multi-match query
  if (query && query.trim()) {
    searchBody.query.bool.must.push({
      multi_match: {
        query: query,
        fields: [
          'fullName^3', // Boost name matches
          'jobRole^2', // Boost job role matches
          'skills^2', // Boost skill matches
          'about^1.5', // Boost about section
          'companyName^1.5', // Boost company matches
          'education',
          'interests',
          'searchableContent', // General searchable content
        ],
        type: 'best_fields', // Find best matching field
        fuzziness: 'AUTO', // Handle typos automatically
        operator: 'or', // Match any of the terms
        minimum_should_match: '60%', // Require good relevance
      },
    });
  } else {
    // If no query, return all active users
    searchBody.query.bool.must.push({
      match_all: {},
    });
  }

  // Add filters
  if (filters) {
    if (filters.industry) {
      searchBody.query.bool.filter.push({
        term: { industry: filters.industry },
      });
    }

    if (filters.minExperience !== undefined) {
      searchBody.query.bool.filter.push({
        range: { yearsOfExperience: { gte: filters.minExperience } },
      });
    }

    if (filters.maxExperience !== undefined) {
      searchBody.query.bool.filter.push({
        range: { yearsOfExperience: { lte: filters.maxExperience } },
      });
    }

    if (filters.skills && filters.skills.length > 0) {
      searchBody.query.bool.filter.push({
        terms: { skills: filters.skills },
      });
    }
  }

  // Always filter for complete profiles
  searchBody.query.bool.filter.push({
    term: { isOnboardingComplete: true },
  });

  try {
    const response = await client.search({
      index: USER_INDEX,
      body: searchBody,
      request_cache: true, // Enable OpenSearch request cache
    });

    const results = response.body.hits.hits.map((hit: any) => ({
      userId: hit._source.userId,
      score: hit._score,
      profile: hit._source,
      highlights: hit.highlight || {},
    }));

    return {
      success: true,
      results,
      total: response.body.hits.total.value,
    };
  } catch (error) {
    console.error('Search failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Search failed',
    };
  }
}

// Index a user profile
async function indexUser(
  userId: string,
  userProfile: UserProfile
): Promise<SearchResponse> {
  // Create searchable content by combining all text fields
  const searchableContent = [
    userProfile.fullName,
    userProfile.jobRole,
    userProfile.companyName,
    userProfile.education,
    userProfile.about,
    ...(userProfile.skills || []),
    ...(userProfile.interests || []),
  ]
    .filter(Boolean)
    .join(' ');

  const document = {
    ...userProfile,
    userId,
    searchableContent,
    updatedAt: new Date().toISOString(),
  };

  try {
    // Use document ID for efficient upsert (no expensive deleteByQuery needed)
    await client.index({
      index: USER_INDEX,
      id: userId, // Use userId as document ID for efficient upsert
      body: document,
    });

    return { success: true };
  } catch (error) {
    console.error('Indexing failed:', error);
    throw error;
  }
}

// Get a specific user
async function getUser(userId: string): Promise<SearchResponse> {
  try {
    const response = await client.search({
      index: USER_INDEX,
      body: {
        query: {
          term: { userId: userId },
        },
      },
    });

    return {
      success: true,
      results: response.body.hits.hits.map((hit: any) => hit._source),
      total: response.body.hits.total.value,
    };
  } catch (error: any) {
    if (error.meta?.statusCode === 404) {
      return {
        success: true,
        results: [],
      };
    }
    throw error;
  }
}

// Update a user profile
async function updateUser(
  userId: string,
  userProfile: Partial<UserProfile>
): Promise<SearchResponse> {
  const searchableContent = [
    userProfile.fullName,
    userProfile.jobRole,
    userProfile.companyName,
    userProfile.education,
    userProfile.about,
    ...(userProfile.skills || []),
    ...(userProfile.interests || []),
  ]
    .filter(Boolean)
    .join(' ');

  const updateDoc = {
    ...userProfile,
    searchableContent,
    updatedAt: new Date().toISOString(),
  };

  try {
    // Use document ID for efficient update (no expensive deleteByQuery needed)
    await client.index({
      index: USER_INDEX,
      id: userId, // Use userId as document ID for efficient upsert
      body: updateDoc,
    });

    return { success: true };
  } catch (error) {
    console.error('Update failed:', error);
    throw error;
  }
}

// Delete a user
async function deleteUser(userId: string): Promise<SearchResponse> {
  try {
    // Use document ID for efficient deletion
    await client.delete({
      index: USER_INDEX,
      id: userId, // Use userId as document ID
    });

    return { success: true };
  } catch (error) {
    console.error('Delete failed:', error);
    throw error;
  }
}
