
/**
 * Cache utility for edge function results
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Internal cache storage
const cache = new Map<string, CacheEntry<any>>();

/**
 * Invoke an edge function with caching
 */
export async function invokeEdgeFunctionWithCache<T>(
  functionName: string,
  params: Record<string, any> = {},
  options: {
    ttlMs?: number;
    cacheKey?: string;
    forceRefresh?: boolean;
  } = {}
): Promise<T> {
  const {
    ttlMs = 5 * 60 * 1000, // 5 minutes default
    cacheKey = `${functionName}:${JSON.stringify(params)}`,
    forceRefresh = false
  } = options;
  
  // Check cache if not forcing refresh
  if (!forceRefresh) {
    const cached = cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < ttlMs) {
      console.log(`Cache hit for ${functionName}`);
      return cached.data as T;
    }
  }
  
  // Import here to avoid circular dependencies
  const { invokeEdgeFunction } = await import('./core');
  
  // Call the edge function
  const data = await invokeEdgeFunction(functionName, params);
  
  // Cache the result
  cache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  
  return data as T;
}

/**
 * Clear all cached results or specific key
 */
export function clearEdgeFunctionCache(cacheKey?: string): void {
  if (cacheKey) {
    cache.delete(cacheKey);
  } else {
    cache.clear();
  }
}
