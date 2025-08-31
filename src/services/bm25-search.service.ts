import BM25 from 'bm25';

/**
 * Simple BM25-based keyword search service
 * Handles exact term matching to complement vector search
 */
export class BM25SearchService {
  private static index: BM25 | null = null;
  private static documents: Array<{ userId: string; text: string }> = [];

  /**
   * Initialize or update the BM25 index with profile texts
   * @param profileTexts - Array of {userId, text} objects to index
   */
  static buildIndex(
    profileTexts: Array<{ userId: string; text: string }>
  ): void {
    console.log(`Building BM25 index for ${profileTexts.length} profiles`);

    // Store documents for later reference
    BM25SearchService.documents = profileTexts;

    // Tokenize each document (split into words)
    const tokenizedDocuments = profileTexts.map(
      profile =>
        profile.text
          .toLowerCase()
          .replace(/[^\w\s]/g, ' ') // Remove punctuation
          .split(/\s+/)
          .filter(word => word.length > 2) // Filter out short words
    );

    // Create BM25 index
    BM25SearchService.index = new BM25(tokenizedDocuments);

    console.log('BM25 index built successfully');
  }

  /**
   * Add a new document to the existing index
   * @param userId - User ID
   * @param text - Profile text to index
   */
  static addDocument(userId: string, text: string): void {
    // Add to documents array
    BM25SearchService.documents.push({ userId, text });

    // Rebuild the entire index (simple approach)
    BM25SearchService.buildIndex(BM25SearchService.documents);
  }

  /**
   * Update an existing document in the index
   * @param userId - User ID to update
   * @param newText - New profile text
   */
  static updateDocument(userId: string, newText: string): void {
    // Find and update the document
    const docIndex = BM25SearchService.documents.findIndex(
      doc => doc.userId === userId
    );

    if (docIndex !== -1) {
      BM25SearchService.documents[docIndex].text = newText;
    } else {
      // Document doesn't exist, add it
      BM25SearchService.documents.push({ userId, text: newText });
    }

    // Rebuild the index
    BM25SearchService.buildIndex(BM25SearchService.documents);
  }

  /**
   * Remove a document from the index
   * @param userId - User ID to remove
   */
  static removeDocument(userId: string): void {
    // Remove from documents array
    BM25SearchService.documents = BM25SearchService.documents.filter(
      doc => doc.userId !== userId
    );

    // Rebuild the index
    BM25SearchService.buildIndex(BM25SearchService.documents);
  }

  /**
   * Search using BM25 algorithm
   * @param query - Search query
   * @param limit - Maximum number of results to return
   * @returns Array of {userId, score} sorted by relevance
   */
  static search(
    query: string,
    limit: number = 20
  ): Array<{ userId: string; score: number }> {
    if (!BM25SearchService.index || BM25SearchService.documents.length === 0) {
      console.warn('BM25 index not initialized or empty');
      return [];
    }

    // Tokenize the query
    const queryTokens = query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);

    if (queryTokens.length === 0) {
      return [];
    }

    // Get BM25 scores for all documents
    const scores = BM25SearchService.index.search(queryTokens);

    // Combine scores with user IDs and sort
    const results = scores
      .map((score, index) => ({
        userId: BM25SearchService.documents[index].userId,
        score: score,
      }))
      .filter(result => result.score > 0) // Only include non-zero scores
      .sort((a, b) => b.score - a.score) // Sort by score descending
      .slice(0, limit);

    console.log(`BM25 search for "${query}" found ${results.length} results`);
    return results;
  }

  /**
   * Check if a query contains exact terms that should prioritize BM25
   * @param query - Search query
   * @returns true if query appears to be exact term focused
   */
  static isExactTermQuery(query: string): boolean {
    // Heuristics for detecting exact term queries:
    // 1. Single words longer than 3 characters
    // 2. Quoted strings
    // 3. Company/brand names (contains no common words)

    const trimmed = query.trim();

    // Check for quoted strings
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return true;
    }

    // Check for single meaningful words
    const words = trimmed.toLowerCase().split(/\s+/);
    if (words.length === 1 && words[0].length > 3) {
      // Check if it's not a common semantic word
      const commonSemanticWords = [
        'developer',
        'engineer',
        'designer',
        'manager',
        'analyst',
        'architect',
        'specialist',
        'consultant',
        'lead',
        'senior',
        'experienced',
        'skilled',
        'expert',
        'professional',
      ];

      return !commonSemanticWords.includes(words[0]);
    }

    // Check for likely company/brand names (proper nouns)
    if (words.length <= 3) {
      const hasCapitalization = /[A-Z]/.test(query);
      const hasNumbers = /\d/.test(query);

      if (hasCapitalization || hasNumbers) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get statistics about the current index
   * @returns Index statistics
   */
  static getIndexStats(): {
    totalDocuments: number;
    avgDocLength: number;
    isReady: boolean;
  } {
    return {
      totalDocuments: BM25SearchService.documents.length,
      avgDocLength:
        BM25SearchService.documents.length > 0
          ? Math.round(
              BM25SearchService.documents.reduce(
                (sum, doc) => sum + doc.text.length,
                0
              ) / BM25SearchService.documents.length
            )
          : 0,
      isReady: BM25SearchService.index !== null,
    };
  }

  /**
   * Initialize the BM25 index with all existing profile embeddings
   * @param embeddings - Array of profile embedding records
   */
  static async initializeFromEmbeddings(
    embeddings: Array<{ userId: string; embeddingText: string }>
  ): Promise<void> {
    console.log(`Initializing BM25 index with ${embeddings.length} embeddings`);

    const profileTexts = embeddings
      .filter(
        embedding => embedding.embeddingText && embedding.embeddingText.trim()
      )
      .map(embedding => ({
        userId: embedding.userId,
        text: embedding.embeddingText,
      }));

    BM25SearchService.buildIndex(profileTexts);
  }
}
