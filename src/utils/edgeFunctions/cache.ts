
/**
 * Cache for edge function responses
 */
const edgeFunctionCache = new Map<string, { data: any; timestamp: number }>();

/**
 * Get a cache key for an edge function call
 */
function getCacheKey(functionName: string, params: any): string {
  const paramsString = JSON.stringify(params || {});
  return `${functionName}:${paramsString}`;
}

/**
 * Invoke an edge function with caching
 * @param fn The function to invoke the edge function
 * @param functionName The name of the edge function
 * @param params Parameters to pass to the function
 * @param options Caching options
 */
export async function invokeEdgeFunctionWithCache<T>(
  functionName: string,
  params: any,
  options: {
    ttlMs?: number;
    forceRefresh?: boolean;
    onCacheHit?: (data: T) => void;
  } = {}
): Promise<T> {
  const { ttlMs = 60000, forceRefresh = false, onCacheHit } = options;
  const cacheKey = getCacheKey(functionName, params);
  const now = Date.now();
  
  // Check cache if not forcing refresh
  if (!forceRefresh) {
    const cached = edgeFunctionCache.get(cacheKey);
    if (cached && now - cached.timestamp < ttlMs) {
      console.log(`Cache hit for ${functionName}`);
      if (onCacheHit) {
        onCacheHit(cached.data);
      }
      return cached.data as T;
    }
  }
  
  // Import dynamically to avoid circular dependency
  const { invokeEdgeFunction } = await import('./core');
  
  // Call the edge function
  const data = await invokeEdgeFunction<T>(functionName, params);
  
  // Cache the result
  edgeFunctionCache.set(cacheKey, { data, timestamp: now });
  
  return data;
}
