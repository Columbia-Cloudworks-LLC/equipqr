import { supabase } from "@/integrations/supabase/client";

/**
 * Options for invoking edge functions
 */
interface EdgeFunctionOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  timeoutMs?: number;
  onRetry?: (attempt: number, error: any) => void;
}

/**
 * Cache configuration for edge functions
 */
interface EdgeFunctionCacheOptions {
  /** Enable caching for this call */
  useCache?: boolean;
  /** Cache duration in seconds (default: 60) */
  cacheDuration?: number;
  /** Cache key prefix (default: function name) */
  cachePrefix?: string;
  /** Function to determine cache key from payload */
  cacheKeyFn?: (payload: Record<string, any>) => string;
  /** Skip the actual call if cached data exists */
  useStaleWhileRevalidate?: boolean;
}

/**
 * Invoke a Supabase Edge Function with timeout handling
 * @param functionName Name of the edge function to invoke
 * @param payload JSON payload to send to the function
 * @param timeoutMs Optional timeout in milliseconds (default: 8000ms)
 * @returns Function response data
 */
export async function invokeEdgeFunction<T = any>(
  functionName: string, 
  payload: Record<string, any>,
  timeoutMs: number = 8000
): Promise<T> {
  // Check session before making the request
  const { data: sessionData } = await supabase.auth.getSession();
  const isAuthenticated = !!sessionData?.session;
  
  // Log authentication status for debugging
  if (!isAuthenticated) {
    console.warn(`WARNING: Calling edge function ${functionName} without authentication`);
    // Don't proceed if authentication is required but missing
    if (functionName !== 'health_check') { // Allow specific functions to run without auth
      throw new Error('Authentication required to call this edge function');
    }
  } else {
    console.log(`Calling edge function ${functionName} with authenticated user: ${sessionData.session?.user?.email}`);
  }
  
  // Create a promise for the edge function call
  const functionPromise = supabase.functions.invoke(functionName, {
    body: payload
  });
  
  // Create a timeout promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Edge function ${functionName} timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  
  try {
    // Race the function call against the timeout
    const result = await Promise.race([functionPromise, timeoutPromise]) as any;
    
    if (result.error) {
      console.error(`Error invoking edge function ${functionName}:`, result.error);
      throw new Error(result.error.message || `${functionName} failed`);
    }
    
    return result.data as T;
  } catch (error) {
    console.error(`Failed to invoke edge function ${functionName}:`, error);
    throw error;
  }
}

/**
 * Invoke a Supabase Edge Function with retry logic and circuit breaker pattern
 * @param functionName Name of the edge function to invoke
 * @param payload JSON payload to send to the function
 * @param config Retry configuration
 * @returns Function response data
 */
export async function invokeEdgeFunctionWithRetry<T = any>(
  functionName: string,
  payload: Record<string, any>,
  config: EdgeFunctionOptions = {}
): Promise<T> {
  const { 
    maxRetries = 2, 
    initialDelayMs = 1000, 
    timeoutMs = 8000, 
    onRetry 
  } = config;
  
  // Check circuit breaker - if too many failures, don't even try
  const now = Date.now();
  const breakerState = circuitBreakerState[functionName] || { failures: 0, lastFailure: 0, backoffUntil: 0 };
  
  // If circuit is open (too many recent failures), wait before retrying
  if (breakerState.failures >= 5 && now < breakerState.backoffUntil) {
    console.warn(`Circuit breaker open for ${functionName} - skipping call until ${new Date(breakerState.backoffUntil).toISOString()}`);
    throw new Error(`Function ${functionName} temporarily unavailable due to repeated failures. Try again later.`);
  }
  
  let lastError: any = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Exponential backoff delay after the first attempt
      if (attempt > 0) {
        const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
        console.log(`Retry attempt ${attempt}/${maxRetries} for ${functionName} after ${delayMs}ms`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      
      const result = await invokeEdgeFunction<T>(functionName, payload, timeoutMs);
      
      // Success - reset circuit breaker for this function
      if (breakerState.failures > 0) {
        circuitBreakerState[functionName] = { failures: 0, lastFailure: 0, backoffUntil: 0 };
      }
      
      return result;
    } catch (error) {
      console.warn(`Attempt ${attempt + 1}/${maxRetries + 1} failed for ${functionName}:`, error);
      lastError = error;
      
      // Call the onRetry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, error);
      }
      
      // Update circuit breaker state
      circuitBreakerState[functionName] = {
        failures: breakerState.failures + 1,
        lastFailure: now,
        backoffUntil: now + Math.min(breakerState.failures * 5000, 60000) // Increasing backoff up to 1 minute
      };
      
      // If this is a connection error or timeout, continue retrying
      // Otherwise, throw immediately
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isRetryableError = errorMessage.includes('timeout') || 
                              errorMessage.includes('network') ||
                              errorMessage.includes('connection');
      
      if (!isRetryableError && attempt > 0) {
        throw error;
      }
    }
  }
  
  // If we got here, all attempts failed
  throw lastError || new Error(`All ${maxRetries + 1} attempts failed for ${functionName}`);
}

/**
 * Invoke a Supabase Edge Function with caching support
 * @param functionName Name of the edge function to invoke
 * @param payload JSON payload to send to the function
 * @param cacheOptions Cache configuration options
 * @returns Function response data
 */
export async function invokeEdgeFunctionWithCache<T = any>(
  functionName: string, 
  payload: Record<string, any>,
  cacheOptions: EdgeFunctionCacheOptions = {}
): Promise<T> {
  // Import cache utilities dynamically to avoid circular dependencies
  const { cacheGet, cacheStore, getCacheKey } = await import('./storage/clientCache');
  
  // Setup cache options with defaults
  const options = {
    useCache: true,
    cacheDuration: 60, // 1 minute default
    cachePrefix: `edge_${functionName}_`,
    useStaleWhileRevalidate: false,
    ...cacheOptions
  };
  
  // Generate cache key from function name and payload
  const cacheKeyFn = options.cacheKeyFn || 
    (p => getCacheKey(options.cachePrefix, p));
  const cacheKey = cacheKeyFn(payload);
  
  // Try to get from cache first
  if (options.useCache) {
    const cachedData = cacheGet<T>(cacheKey, {
      duration: options.cacheDuration,
      prefix: options.cachePrefix
    });
    
    if (cachedData) {
      console.log(`[CACHE HIT] ${functionName}`, { cacheKey });
      
      // If using stale-while-revalidate, return cached data immediately
      if (options.useStaleWhileRevalidate) {
        // Trigger a refresh in the background
        setTimeout(() => {
          invokeEdgeFunction<T>(functionName, payload)
            .then(freshData => {
              cacheStore<T>(cacheKey, freshData, {
                duration: options.cacheDuration,
                prefix: options.cachePrefix
              });
              console.log(`[CACHE REFRESH] ${functionName}`, { cacheKey });
            })
            .catch(err => console.warn(`[CACHE REFRESH FAILED] ${functionName}`, err));
        }, 100);
        
        return cachedData;
      }
      
      return cachedData;
    }
  }
  
  // No cache hit, call the function
  console.log(`[CACHE MISS] ${functionName}`, { cacheKey });
  const result = await invokeEdgeFunction<T>(functionName, payload);
  
  // Store in cache for next time
  if (options.useCache) {
    cacheStore<T>(cacheKey, result, {
      duration: options.cacheDuration,
      prefix: options.cachePrefix
    });
  }
  
  return result;
}

/**
 * Circuit breaker state - tracks failed calls to prevent continuous failures
 */
const circuitBreakerState: Record<string, {
  failures: number;
  lastFailure: number;
  backoffUntil: number;
}> = {};
