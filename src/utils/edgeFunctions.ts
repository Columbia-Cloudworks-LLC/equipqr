
import { supabase } from '@/integrations/supabase/client';
import { isValidUuid } from './validationUtils';

/**
 * Safely invoke an edge function with proper error handling and timeouts
 * @param functionName Name of the edge function to invoke
 * @param params Parameters to pass to the function
 * @param timeoutMs Optional timeout in milliseconds (defaults to 5000)
 * @returns The function response data
 * @throws Error if the function invocation fails
 */
export async function invokeEdgeFunction(
  functionName: string,
  params: Record<string, any> = {},
  timeoutMs: number = 5000
): Promise<any> {
  try {
    // Validate UUID parameters to ensure consistent type handling
    for (const [key, value] of Object.entries(params)) {
      // If the parameter key includes 'id' and the value appears to be a UUID
      if ((key.includes('id') || key.includes('uid')) && typeof value === 'string') {
        // Ensure it's a valid UUID to prevent type mismatches
        if (value && !isValidUuid(value)) {
          console.warn(`Parameter ${key} with value ${value} is not a valid UUID`);
        }
      }
    }

    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Edge function ${functionName} timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    // Create function invocation promise with retry logic
    const functionPromise = callWithRetry(() => supabase.functions.invoke(functionName, {
      body: params
    }), 3, 500);

    // Race the promises
    const result = await Promise.race([functionPromise, timeoutPromise]) as {
      data: any;
      error: any;
    };

    if (result.error) {
      console.error(`Error invoking edge function ${functionName}:`, result.error);
      throw new Error(`Edge function error: ${result.error.message || 'Unknown error'}`);
    }

    return result;
  } catch (error: any) {
    console.error(`Failed to invoke edge function ${functionName}:`, error);
    throw new Error(`Edge function ${functionName} failed: ${error.message}`);
  }
}

/**
 * Helper function to retry a function call with exponential backoff
 */
async function callWithRetry<T>(
  fn: () => Promise<T>, 
  maxRetries: number = 3, 
  initialDelay: number = 500
): Promise<T> {
  let retries = 0;
  let delay = initialDelay;
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (retries >= maxRetries) throw error;
      
      // Wait for the specified delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase the delay for the next retry (exponential backoff)
      delay *= 2;
      retries++;
      
      console.log(`Retrying function call, attempt ${retries} of ${maxRetries}`);
    }
  }
}

/**
 * Helper to check if a string is a valid UUID
 */
export function validateUuid(id: string | null | undefined): boolean {
  if (!id) return false;
  return isValidUuid(id);
}
