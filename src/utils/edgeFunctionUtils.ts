import { cacheGet, cacheStore } from './storage/clientCache';
import { supabase } from '@/integrations/supabase/client';

/**
 * Retry an asynchronous operation with a backoff strategy.
 *
 * @param fn The function to execute.
 * @param options Retry configuration options.
 * @returns A promise that resolves with the result of the function or rejects after maximum retries.
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries: number;
    retryDelay: number;
    onRetry?: (attempt: number, error: any) => void;
    onSuccess?: (result: T) => void;
  }
): Promise<T> {
  let attempt = 0;
  while (attempt <= options.maxRetries) {
    try {
      const result = await fn();
      options.onSuccess?.(result);
      return result;
    } catch (error: any) {
      if (attempt === options.maxRetries) {
        throw error;
      }
      attempt++;
      options.onRetry?.(attempt, error);
      await new Promise((resolve) => setTimeout(resolve, options.retryDelay));
    }
  }
  throw new Error("Max retries exceeded"); // Should not happen, but keeps TS happy
}

/**
 * Invoke a Supabase Edge Function with retry capabilities
 *
 * @param functionName The name of the edge function to invoke
 * @param payload The payload to send to the function
 * @param options Configuration options for retries
 * @returns The function response data
 */
export async function invokeEdgeFunctionWithRetry<T>(
  functionName: string,
  payload: any,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    onRetry?: (attempt: number, error: any) => void;
		onSuccess?: (data: T) => void;
    timeoutMs?: number;
  } = {}
): Promise<T> {
  const { maxRetries = 3, retryDelay = 1000, onRetry, onSuccess, timeoutMs = 30000 } = options;

  return await retry<T>(
    async () => {
      // Add a timeout to the fetch call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(`/api/${functionName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error?.error || `HTTP error! status: ${response.status}`);
        }

        const data: T = await response.json();
				onSuccess?.(data);
        return data;
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error(`Request timed out after ${timeoutMs}ms`);
        }
        throw error;
      }
    },
    {
      maxRetries,
      retryDelay,
      onRetry,
    }
  );
}

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
  const data = await invokeEdgeFunctionWithRetry<T>(functionName, payload, {
    maxRetries,
    retryDelay
  });
  
  // Store in cache if caching is enabled
  if (useCache && data) {
    cacheStore<T>(cacheKey, data, { duration: cacheDuration, prefix: cachePrefix });
  }
  
  return data;
}
