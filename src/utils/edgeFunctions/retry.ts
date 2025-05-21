
/**
 * Retry a function with exponential backoff
 * @param fn The function to retry
 * @param options Retry options
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    onRetry?: (attempt: number, error: any) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, retryDelay = 1000, onRetry } = options;
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        
        if (onRetry) {
          onRetry(attempt, error);
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
