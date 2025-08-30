/**
 * Simple in-memory cache service for API responses
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

class CacheService {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes default TTL

  /**
   * Set data in cache with optional TTL
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    const now = Date.now()
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl
    })
  }

  /**
   * Get data from cache if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) {return false}
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }
    
    return true
  }

  /**
   * Clear specific key or all cache
   */
  clear(key?: string): void {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }

  /**
   * Get cache key for user data
   */
  getUserKey(userId: string): string {
    return `user:${userId}`
  }

  /**
   * Get cache key for user's cameras
   */
  getUserCamerasKey(userId: string): string {
    return `cameras:${userId}`
  }

  /**
   * Get cache key for user's discussions
   */
  getUserDiscussionsKey(userId: string): string {
    return `discussions:${userId}`
  }

  /**
   * Get cache key for feed discussions
   */
  getFeedKey(userId: string): string {
    return `feed:${userId}`
  }

  /**
   * Get cache key for following list
   */
  getFollowingKey(userId: string): string {
    return `following:${userId}`
  }

  /**
   * Invalidate user-related cache
   */
  invalidateUserCache(userId: string): void {
    this.clear(this.getUserKey(userId))
    this.clear(this.getUserCamerasKey(userId))
    this.clear(this.getUserDiscussionsKey(userId))
    this.clear(this.getFeedKey(userId))
    this.clear(this.getFollowingKey(userId))
  }
}

export const cacheService = new CacheService()
