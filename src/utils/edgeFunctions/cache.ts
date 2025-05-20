
import { cacheGet, cacheStore } from '../storage/clientCache';
import { invokeEdgeFunctionWithRetry } from './core';

/**
 * Invoke a Supabase Edge Function with caching and retry capabilities
 * 
 * @param functionName The name of the edge function to invoke
 * @param payload The payload to send to the function
 * @param options Configuration options for caching and retries
 * @returns The function response data
 */
export async function invokeEdgeFunctionWithCache<T>(
  functionName: string,
  payload: any,
  options: {
    useCache?: boolean,
    cacheDuration?: number, // in seconds
    maxRetries?: number,
    retryDelay?: number, // in ms
    cachePrefix?: string,
    cacheKeyFn?: (payload: any) => string,
    useStaleWhileRevalidate?: boolean
  } = {}
): Promise<T> {
  const {
    useCache = true,
    cacheDuration = 60, // Default 60 seconds
    maxRetries = 2,
    retryDelay = 1000,
    cachePrefix = 'edge_fn_',
    cacheKeyFn,
    useStaleWhileRevalidate = false
  } = options;

  // Generate a cache key from the function name and payload
  const generateKey = () => {
    if (cacheKeyFn) {
      return cacheKeyFn(payload);
    }
    
    try {
      return `${cachePrefix}${functionName}_${JSON.stringify(payload)}`;
    } catch (e) {
      // Fallback for non-serializable arguments
      return `${cachePrefix}${functionName}_${Date.now().toString()}`;
    }
  };

  const cacheKey = generateKey();
  
  // Try to get from cache first if caching is enabled
  if (useCache) {
    const cached = cacheGet<T>(cacheKey, { duration: cacheDuration, prefix: cachePrefix });
    if (cached) {
      console.log(`Cache hit for edge function ${functionName}`);
      
      // If stale-while-revalidate is enabled, refresh the cache in the background
      if (useStaleWhileRevalidate) {
        setTimeout(() => {
          console.log(`Background refresh for ${functionName}`);
          invokeEdgeFunctionWithRetry<T>(functionName, payload, { 
            maxRetries, 
            retryDelay,
            onSuccess: (data) => {
              cacheStore<T>(cacheKey, data, { 
                duration: cacheDuration, 
                prefix: cachePrefix 
              });
            }
          }).catch(e => console.error(`Background refresh failed for ${functionName}:`, e));
        }, 10); // Very short delay to not block the main thread
      }
      
      return cached;
    }
  }

  // Cache miss or caching disabled, invoke the function with retries
  try {
    const data = await invokeEdgeFunctionWithRetry<T>(functionName, payload, {
      maxRetries,
      retryDelay
    });
    
    // Store in cache if caching is enabled
    if (useCache && data) {
      cacheStore<T>(cacheKey, data, { duration: cacheDuration, prefix: cachePrefix });
    }
    
    return data;
  } catch (error) {
    console.error(`Failed to invoke and cache edge function ${functionName}:`, error);
    throw error;
  }
}
