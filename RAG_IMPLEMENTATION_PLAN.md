# RAG Search Implementation Plan

## Overview

Implement Retrieval-Augmented Generation (RAG) search for semantic neural search across all profile data in the application. Users can search with natural language queries like "React developers in San Francisco" or "machine learning researchers with publications" and get semantically relevant results.

## Architecture

### Current State

- Rich profile data stored in `UserProfile` model
- Search currently disabled (returns empty results)
- Dynamic profile generation from resume uploads via Claude AI
- Variable field structure - users may have different combinations of filled fields

### Proposed Solution

**Separate Embedding Table Architecture** - Clean separation between search index and profile data.

## Data Flow

### 1. Profile Text Generation

Convert any profile data (regardless of filled fields) into raw text:

```typescript
function createProfileText(profile: UserProfile): string {
  const textParts: string[] = [];

  // Dump all fields as text - no field-specific logic
  Object.entries(profile).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          textParts.push(value.join(' '));
        }
      } else if (typeof value === 'object') {
        // JSON fields - stringify and clean up
        try {
          const parsed = typeof value === 'string' ? JSON.parse(value) : value;
          if (Array.isArray(parsed)) {
            const flattened = parsed
              .map(item =>
                typeof item === 'object'
                  ? Object.values(item).join(' ')
                  : String(item)
              )
              .join(' ');
            if (flattened.trim()) textParts.push(flattened);
          } else {
            textParts.push(JSON.stringify(parsed).replace(/[{}",]/g, ' '));
          }
        } catch (e) {
          textParts.push(String(value));
        }
      } else {
        textParts.push(String(value));
      }
    }
  });

  return textParts
    .join(' ')
    .replace(/\s+/g, ' ')
    .replace(/[{}",]/g, ' ')
    .trim();
}
```

### 2. Vector Embedding Generation

Use AWS Bedrock Titan embedding model:

```typescript
export class EmbeddingService {
  static async generateEmbedding(profileText: string): Promise<number[]> {
    const cleanText = profileText
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 8000); // Cap at reasonable length

    const client = new BedrockRuntimeClient({ region: 'us-east-1' });

    const command = new InvokeModelCommand({
      modelId: 'amazon.titan-embed-text-v1',
      body: JSON.stringify({
        inputText: cleanText,
        dimensions: 1536,
        normalize: true,
      }),
    });

    const response = await client.send(command);
    const result = JSON.parse(new TextDecoder().decode(response.body));

    return result.embedding; // Array of 1536 floating point numbers
  }
}
```

## Database Schema

### New Embedding Table (Lightweight Search Index)

```typescript
// amplify/data/resource.ts - NEW table
ProfileEmbedding: a
  .model({
    userId: a.string().required(),           // Link back to UserProfile
    embeddingVector: a.string().required(),  // JSON array of 1536 numbers
    embeddingText: a.string().required(),    // Raw text that was embedded
    profileVersion: a.string(),              // Track profile updates
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
  })
  .identifier(['userId'])
  .authorization((allow) => [allow.private()]),
```

### UserProfile Table

- **No changes** - Keep existing schema unchanged
- Embedding data stored separately for performance

## Search Implementation

### Search Service

```typescript
export class RAGSearchService {
  static async searchProfiles(
    query: string,
    limit = 20
  ): Promise<SearchResult[]> {
    // Step 1: Convert query to embedding
    const queryEmbedding = await EmbeddingService.generateEmbedding(query);

    // Step 2: Fetch all embedding chunks (lightweight)
    const embeddingChunks = await getClient().models.ProfileEmbedding.list();

    // Step 3: Calculate similarity with all chunks
    const matchedChunks: Array<{ userId: string; similarity: number }> = [];

    for (const chunk of embeddingChunks.data) {
      try {
        const chunkEmbedding = JSON.parse(chunk.embeddingVector);
        const similarity = calculateCosineSimilarity(
          queryEmbedding,
          chunkEmbedding
        );

        if (similarity > 0.3) {
          // 30% similarity threshold
          matchedChunks.push({
            userId: chunk.userId,
            similarity: similarity,
          });
        }
      } catch (error) {
        console.error('Error processing embedding:', error);
      }
    }

    // Step 4: Sort by similarity and limit
    const topChunks = matchedChunks
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    // Step 5: Extract userIds from top matching chunks
    const userIds = topChunks.map(chunk => chunk.userId);

    // Step 6: Batch fetch real profile data for matches only
    const profilePromises = userIds.map(userId =>
      getClient().models.UserProfile.get({ userId })
    );

    const profiles = await Promise.all(profilePromises);

    // Step 7: Combine similarity scores with profile data
    const results: SearchResult[] = [];
    for (let i = 0; i < profiles.length; i++) {
      if (profiles[i].data) {
        results.push({
          userId: topChunks[i].userId,
          profile: profiles[i].data!,
          similarity: topChunks[i].similarity,
        });
      }
    }

    return results;
  }
}
```

### Cosine Similarity Calculation

```typescript
function calculateCosineSimilarity(
  vectorA: number[],
  vectorB: number[]
): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

## Embedding Management

### Embedding Manager Service

```typescript
export class EmbeddingManager {
  // Create embedding when profile is created
  static async createProfileEmbedding(
    userId: string,
    profileData: any
  ): Promise<void> {
    const profileText = createProfileText(profileData);
    const embeddingVector =
      await EmbeddingService.generateEmbedding(profileText);

    await getClient().models.ProfileEmbedding.create({
      userId: userId,
      embeddingVector: JSON.stringify(embeddingVector),
      embeddingText: profileText,
      profileVersion: generateVersion(profileData),
    });
  }

  // Update embedding when profile changes
  static async updateProfileEmbedding(
    userId: string,
    profileData: any
  ): Promise<void> {
    const profileText = createProfileText(profileData);
    const embeddingVector =
      await EmbeddingService.generateEmbedding(profileText);

    await getClient().models.ProfileEmbedding.update({
      userId: userId,
      embeddingVector: JSON.stringify(embeddingVector),
      embeddingText: profileText,
      profileVersion: generateVersion(profileData),
    });
  }

  // Delete embedding when profile is deleted
  static async deleteProfileEmbedding(userId: string): Promise<void> {
    await getClient().models.ProfileEmbedding.delete({
      userId: userId,
    });
  }
}
```

### Integration with Profile Service

```typescript
// In UserProfileService.createUserProfile()
const result = await getClient().models.UserProfile.create({ ...profileData });

if (result.data) {
  // Create embedding in separate table
  await EmbeddingManager.createProfileEmbedding(userId, profileData);
}

// In UserProfileService.updateUserProfile()
const result = await getClient().models.UserProfile.update({ ...updates });

if (result.data) {
  // Update embedding in separate table
  await EmbeddingManager.updateProfileEmbedding(userId, result.data);
}
```

## Search Flow Visualization

```
User Query: "React developers in San Francisco"
                    ↓
Convert to embedding: [0.123, -0.456, 0.789, ...]
                    ↓
Compare with ALL embedding chunks:
   - Chunk A (user-123): similarity 0.87 ✓
   - Chunk B (user-456): similarity 0.74 ✓
   - Chunk C (user-789): similarity 0.28 ✗
                    ↓
Extract userIds from top chunks: ["user-123", "user-456"]
                    ↓
Batch fetch real profile data:
   - UserProfile.get({userId: "user-123"}) → John's full profile
   - UserProfile.get({userId: "user-456"}) → Jane's full profile
                    ↓
Return combined results:
[
  {userId: "user-123", profile: John's data, similarity: 0.87},
  {userId: "user-456", profile: Jane's data, similarity: 0.74}
]
```

## Performance Benefits

### Comparison: Old vs New Approach

**Old Approach (fetch all profiles):**

- Fetch 1000 full profiles = ~50MB data transfer
- Process all in memory
- Return top 20

**New Approach (separate embedding table):**

- Fetch 1000 embedding records = ~6MB data transfer
- Process lightweight chunks
- Fetch only top 20 full profiles = ~1MB
- **Total: ~7MB vs 50MB (7x improvement!)**

### Storage Breakdown

```
ProfileEmbedding table (per record):
- userId: ~50 bytes
- embeddingVector: ~6KB (1536 floats as JSON)
- embeddingText: ~2KB (compressed profile text)
- metadata: ~100 bytes
Total: ~8KB per user

UserProfile table: ~20-50KB per user (with all JSON fields)
Search efficiency: 2.5-6x improvement
```

## Query Examples

The system will handle natural language queries like:

- `"React developers in San Francisco"`
- `"Python developers with AWS experience"`
- `"UX designers who speak Spanish"`
- `"Startup founders in fintech"`
- `"Recent CS graduates with internships"`
- `"Senior engineers interested in AI"`
- `"Machine learning researchers with publications"`

## Implementation Phases

### Phase 1: Core Infrastructure

1. Add `ProfileEmbedding` table to schema
2. Create `EmbeddingService` with AWS Bedrock integration
3. Implement `createProfileText()` function
4. Create `EmbeddingManager` service

### Phase 2: Search Service

1. Implement `RAGSearchService` with cosine similarity
2. Create `calculateCosineSimilarity()` function
3. Add search result interfaces and types

### Phase 3: Integration

1. Update `UserProfileService` to create/update embeddings
2. Integrate with existing onboarding flow
3. Update UI components (`SearchUser.tsx`, `SearchSectionContent.tsx`)

### Phase 4: Auto-indexing

1. Create background job to index existing profiles
2. Set up real-time embedding updates
3. Add embedding health checks and monitoring

## Configuration

### AWS Bedrock Setup

- Model: `amazon.titan-embed-text-v1`
- Dimensions: 1536
- Region: `us-east-1`
- Normalization: `true`

### Search Parameters

- Similarity threshold: `0.3` (30%)
- Default result limit: `20`
- Max text length: `8000` characters

## Benefits

1. **Zero Field Logic** - Works with any profile structure
2. **Future Proof** - New fields automatically included
3. **High Performance** - 7x faster than fetching full profiles
4. **Semantic Power** - Natural language understanding
5. **Scalable** - Clean separation of concerns
6. **Cost Effective** - Optimized DynamoDB usage

## Technical Considerations

- **Privacy**: Profile data sent to AWS Bedrock for embedding generation
- **Cost**: AWS Bedrock charges per embedding API call
- **Performance**: 2-5 second search time for up to 5K profiles
- **Scalability**: Current approach handles up to 10K profiles effectively
- **Error Handling**: Graceful degradation for malformed data
