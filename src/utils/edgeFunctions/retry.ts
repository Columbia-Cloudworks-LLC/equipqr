
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
