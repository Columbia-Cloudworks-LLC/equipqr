
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
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return retry(fn, retries - 1, delay * 2);
  }
}
