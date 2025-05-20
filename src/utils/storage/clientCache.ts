
/**
 * Simple client-side caching utilities
 */

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  etag?: string;
}

/**
 * Cache settings
 */
export interface CacheOptions {
  /** Cache duration in seconds */
  duration: number;
  /** Cache key prefix to avoid collisions */
  prefix?: string;
  /** Function to generate a cache key from the input */
  keyFn?: (input: any) => string;
}

/**
 * Store a value in the cache
 */
export function cacheStore<T>(key: string, value: T, options: CacheOptions): void {
  const prefix = options.prefix || 'app_cache_';
  const fullKey = prefix + key;
  
  try {
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      etag: undefined // Can be used later for HTTP caching
    };
    
    sessionStorage.setItem(fullKey, JSON.stringify(entry));
  } catch (err) {
    console.warn('Failed to store in cache:', err);
    // Silently fail - caching is optional
  }
}

/**
 * Retrieve a value from the cache if not expired
 * @returns The cached value if valid, or null if expired or not found
 */
export function cacheGet<T>(key: string, options: CacheOptions): T | null {
  const prefix = options.prefix || 'app_cache_';
  const fullKey = prefix + key;
  
  try {
    const cachedJson = sessionStorage.getItem(fullKey);
    if (!cachedJson) return null;
    
    const cached = JSON.parse(cachedJson) as CacheEntry<T>;
    const now = Date.now();
    const expiryTime = cached.timestamp + (options.duration * 1000);
    
    if (now > expiryTime) {
      // Cache expired - remove it
      sessionStorage.removeItem(fullKey);
      return null;
    }
    
    return cached.value;
  } catch (err) {
    console.warn('Failed to retrieve from cache:', err);
    return null;
  }
}

/**
 * Return a cache key for a function and its arguments
 */
export function getCacheKey(prefix: string, ...args: any[]): string {
  // Simple way to create a hash from args
  try {
    return prefix + '_' + JSON.stringify(args).replace(/[^\w]/g, '_');
  } catch (e) {
    // Fallback for non-serializable arguments
    return prefix + '_' + Date.now().toString();
  }
}

/**
 * Clear all cache entries with the given prefix
 */
export function clearCacheByPrefix(prefix: string): void {
  try {
    const fullPrefix = prefix || 'app_cache_';
    
    // Get all keys from sessionStorage
    const keys = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(fullPrefix)) {
        keys.push(key);
      }
    }
    
    // Remove all matching keys
    keys.forEach(key => sessionStorage.removeItem(key));
  } catch (e) {
    console.warn('Failed to clear cache:', e);
  }
}
