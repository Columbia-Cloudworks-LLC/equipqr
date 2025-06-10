
/**
 * Enhanced retry utility with rate limiting awareness
 */

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000,
  shouldRetry?: (error: any) => boolean
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry this error
      if (shouldRetry && !shouldRetry(error)) {
        throw error;
      }
      
      // Don't retry on the last attempt
      if (attempt === maxAttempts) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      
      console.log(`Retry attempt ${attempt} failed, retrying in ${delay}ms:`, error);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Debounce function to limit rapid successive calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: NodeJS.Timeout;
  let resolvers: Array<{
    resolve: (value: ReturnType<T>) => void;
    reject: (error: any) => void;
  }> = [];

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise<ReturnType<T>>((resolve, reject) => {
      // Clear previous timeout
      clearTimeout(timeoutId);
      
      // Add this call's resolvers to the list
      resolvers.push({ resolve, reject });
      
      // Set new timeout
      timeoutId = setTimeout(async () => {
        const currentResolvers = resolvers;
        resolvers = [];
        
        try {
          const result = await func(...args);
          
          // Resolve all pending calls with the same result
          currentResolvers.forEach(({ resolve }) => resolve(result));
        } catch (error) {
          // Reject all pending calls with the same error
          currentResolvers.forEach(({ reject }) => reject(error));
        }
      }, delay);
    });
  };
}

/**
 * Rate limit aware retry function
 */
export async function retryWithRateLimit<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000,
  rateLimitMultiplier: number = 5
): Promise<T> {
  return retry(
    fn,
    maxAttempts,
    baseDelay,
    (error: any) => {
      // Check if this is a rate limit error
      if (isRateLimitError(error)) {
        console.warn('Rate limit detected, backing off...');
        return true;
      }
      
      // Check if this is a temporary network error
      if (isNetworkError(error)) {
        return true;
      }
      
      // Don't retry authentication errors
      if (isAuthError(error)) {
        return false;
      }
      
      return false;
    }
  );
}

/**
 * Check if an error is a rate limit error
 */
export function isRateLimitError(error: any): boolean {
  return (
    error?.status === 429 ||
    error?.message?.includes('429') ||
    error?.message?.includes('rate limit') ||
    error?.message?.includes('too many requests')
  );
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: any): boolean {
  return (
    error?.message?.includes('network') ||
    error?.message?.includes('timeout') ||
    error?.message?.includes('ECONNRESET') ||
    error?.message?.includes('ENOTFOUND') ||
    error?.code === 'NETWORK_ERROR'
  );
}

/**
 * Check if an error is an authentication error
 */
export function isAuthError(error: any): boolean {
  return (
    error?.status === 401 ||
    error?.status === 403 ||
    error?.message?.includes('unauthorized') ||
    error?.message?.includes('forbidden') ||
    error?.message?.includes('invalid token')
  );
}
