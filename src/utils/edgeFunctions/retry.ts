
/**
 * Retry a function with exponential backoff
 * 
 * @param fn The function to retry
 * @param retries The number of retries
 * @param delay The initial delay in ms
 * @returns The result of the function
 * @throws The last error encountered
 */
export async function retry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000,
  isRateLimitError?: (error: any) => boolean
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      console.error('Retry attempts exhausted:', error);
      throw error;
    }
    
    // Check if this is a rate limit error
    const isRateLimit = isRateLimitError 
      ? isRateLimitError(error)
      : error?.message?.includes('429') || error?.status === 429;
    
    let nextDelay = delay;
    
    if (isRateLimit) {
      console.warn('Rate limit detected, using longer backoff');
      // Use longer backoff for rate limit errors
      nextDelay = delay * 3;
    } else {
      // Standard exponential backoff
      nextDelay = delay * 2;
    }
    
    console.log(`Retrying operation, ${retries} attempts left, waiting ${nextDelay}ms...`);
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 200;
    await new Promise(resolve => setTimeout(resolve, nextDelay + jitter));
    
    return retry(fn, retries - 1, nextDelay, isRateLimitError);
  }
}

/**
 * Utility to provide a fallback value when a function fails
 * 
 * @param fn The function to execute
 * @param fallback The fallback value to return if the function fails
 * @returns The result of the function or the fallback value
 */
export async function withFallback<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error('Operation failed, using fallback:', error);
    return fallback;
  }
}

/**
 * Run a function with debounce to avoid hitting rate limits
 * Multiple calls within the wait time will only execute once
 */
export function debounce<T>(
  fn: (...args: any[]) => Promise<T>,
  wait: number = 500
): (...args: any[]) => Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastResult: T;
  let pending: Promise<T> | null = null;
  
  return function(...args: any[]): Promise<T> {
    // If we have a pending promise, return it
    if (pending) return pending;
    
    // Create a new pending promise
    pending = new Promise<T>((resolve, reject) => {
      // Clear any existing timeout
      if (timeout) clearTimeout(timeout);
      
      // Set a new timeout
      timeout = setTimeout(async () => {
        try {
          // Execute the function
          const result = await fn(...args);
          lastResult = result;
          resolve(result);
          pending = null;
        } catch (error) {
          reject(error);
          pending = null;
        }
      }, wait);
    });
    
    return pending;
  };
}

/**
 * Cache function results by key to prevent duplicate calls
 */
export function withCache<T>(
  fn: (...args: any[]) => Promise<T>,
  keyFn: (...args: any[]) => string,
  ttlMs: number = 10000
): (...args: any[]) => Promise<T> {
  const cache: Record<string, {value: T, expiry: number}> = {};
  
  return async function(...args: any[]): Promise<T> {
    const key = keyFn(...args);
    const now = Date.now();
    
    // Check if we have a valid cached result
    if (cache[key] && now < cache[key].expiry) {
      console.log(`Cache hit for ${key}`);
      return cache[key].value;
    }
    
    // Execute the function
    const result = await fn(...args);
    
    // Cache the result
    cache[key] = {
      value: result,
      expiry: now + ttlMs
    };
    
    return result;
  };
}
