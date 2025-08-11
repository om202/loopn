/**
 * Image URL caching utility for AWS S3 signed URLs
 * Provides in-memory caching with TTL to avoid repeated AWS getUrl calls
 */

import { getUrl } from 'aws-amplify/storage';

interface CacheEntry {
  url: string;
  timestamp: number;
  expiresAt: number;
}

class ImageUrlCache {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 50 * 60 * 1000; // 50 minutes (S3 URLs expire in 1 hour)

  /**
   * Get a resolved URL, using cache if available and not expired
   */
  async getResolvedUrl(key: string): Promise<string | null> {
    // Check if it's already a full URL
    if (key.startsWith('http')) {
      return key;
    }

    // Check cache first
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && now < cached.expiresAt) {
      return cached.url;
    }

    // Resolve URL from AWS
    try {
      const result = await getUrl({ key });
      const url = result.url.toString();

      // Cache the result
      this.cache.set(key, {
        url,
        timestamp: now,
        expiresAt: now + this.DEFAULT_TTL,
      });

      return url;
    } catch (error) {
      console.error('Error resolving image URL:', error);

      // Clean up failed cache entry
      this.cache.delete(key);
      return null;
    }
  }

  /**
   * Clear expired entries from cache
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        expiresIn: entry.expiresAt - Date.now(),
      })),
    };
  }

  /**
   * Log cache stats to console (for debugging)
   */
  logStats() {
    const stats = this.getStats();
    console.log('🖼️ Image URL Cache Stats:', {
      totalCachedUrls: stats.size,
      entries: stats.entries.map(entry => ({
        key: entry.key,
        ageMinutes: Math.round(entry.age / (1000 * 60)),
        expiresInMinutes: Math.round(entry.expiresIn / (1000 * 60)),
      })),
    });
  }
}

// Export singleton instance
export const imageUrlCache = new ImageUrlCache();

// Auto-cleanup every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(
    () => {
      imageUrlCache.cleanup();
    },
    10 * 60 * 1000
  );
}
