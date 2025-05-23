
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
  delay: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      console.error('Retry attempts exhausted:', error);
      throw error;
    }
    
    console.log(`Retrying operation, ${retries} attempts left, waiting ${delay}ms...`);
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 200;
    await new Promise(resolve => setTimeout(resolve, delay + jitter));
    
    // Exponential backoff with base 2
    return retry(fn, retries - 1, delay * 2);
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
