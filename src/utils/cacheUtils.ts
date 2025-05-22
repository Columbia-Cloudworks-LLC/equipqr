
/**
 * Utility functions to help with caching data in memory or session storage
 */

type CacheItem<T> = {
  data: T;
  timestamp: number;
};

/**
 * Store an item in session storage with a timestamp
 */
export function cacheItem<T>(key: string, data: T): void {
  try {
    const cacheData: CacheItem<T> = {
      data,
      timestamp: Date.now()
    };
    
    sessionStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache item:', error);
  }
}

/**
 * Retrieve an item from session storage if it's not expired
 * @param key The cache key
 * @param maxAge Maximum age in milliseconds
 * @returns The cached item or null if expired or not found
 */
export function getCachedItem<T>(key: string, maxAge: number): T | null {
  try {
    const cachedData = sessionStorage.getItem(key);
    if (!cachedData) return null;
    
    const parsedData = JSON.parse(cachedData) as CacheItem<T>;
    const now = Date.now();
    
    if (now - parsedData.timestamp < maxAge) {
      return parsedData.data;
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to retrieve cached item:', error);
    return null;
  }
}

/**
 * Clear all cached items or a specific one
 */
export function clearCache(key?: string): void {
  if (key) {
    sessionStorage.removeItem(key);
  } else {
    sessionStorage.clear();
  }
}

/**
 * Memory cache for faster access (no serialization overhead)
 */
class MemoryCache {
  private static cache = new Map<string, CacheItem<any>>();
  
  static set<T>(key: string, data: T, ttlMs: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now() + ttlMs
    });
  }
  
  static get<T>(key: string): T | null {
    const item = this.cache.get(key);
    const now = Date.now();
    
    if (item && now < item.timestamp) {
      return item.data as T;
    }
    
    // Expired or not found
    if (item) this.cache.delete(key);
    return null;
  }
  
  static clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

export { MemoryCache };
