/**
 * Debounce function to avoid rapid-fire API calls
 */
export function debounce<T extends (...args: any[]) => Promise<any>>(
  fn: T, 
  delay: number
): T {
  let timeout: NodeJS.Timeout | null = null;
  let lastResult: any = null;
  let lastCall = 0;
  
  return ((...args: Parameters<T>) => {
    return new Promise((resolve, reject) => {
      // Check if we've already called recently
      const now = Date.now();
      if (now - lastCall < delay) {
        console.log('Debounced function call, returning last result');
        resolve(lastResult);
        return;
      }
      
      // Clear any pending timeout
      if (timeout) {
        clearTimeout(timeout);
      }
      
      // Set a new timeout
      timeout = setTimeout(async () => {
        try {
          lastCall = Date.now();
          lastResult = await fn(...args);
          resolve(lastResult);
        } catch (err) {
          reject(err);
        } finally {
          timeout = null;
        }
      }, delay);
    });
  }) as T;
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  isRateLimit?: (error: any) => boolean
): Promise<T> {
  let retries = 0;
  let delay = initialDelay;
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      retries++;
      console.log(`Attempt ${retries} failed:`, error);
      
      // Check if we've hit our retry limit
      if (retries >= maxRetries) throw error;
      
      // If this is a rate limiting error and we have a check function, use it
      if (isRateLimit && isRateLimit(error)) {
        console.warn('Rate limit detected, increasing backoff');
        delay = Math.min(delay * 3, 30000); // More aggressive backoff for rate limits
      } else {
        delay *= 2; // Standard exponential backoff
      }
      
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Cache function to avoid redundant API calls
 * Stores results with a key generated from the function arguments
 */
export function withCache<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  keyGenerator: (...args: Args) => string,
  expiryMs: number = 60000 // Default cache for 1 minute
): (...args: Args) => Promise<T> {
  const cache: Record<string, { data: T; timestamp: number }> = {};
  
  return async (...args: Args): Promise<T> => {
    const cacheKey = keyGenerator(...args);
    const now = Date.now();
    const cachedItem = cache[cacheKey];
    
    // Return cached item if it exists and hasn't expired
    if (cachedItem && now - cachedItem.timestamp < expiryMs) {
      console.log(`Cache hit for ${cacheKey}`);
      return cachedItem.data;
    }
    
    // Otherwise, call the function and cache the result
    console.log(`Cache miss for ${cacheKey}, fetching...`);
    const result = await fn(...args);
    cache[cacheKey] = { data: result, timestamp: now };
    return result;
  };
}
