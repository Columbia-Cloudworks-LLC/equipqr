
import { supabase } from '@/integrations/supabase/client';
import { isValidUuid } from '../validationUtils';

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

    // Create function invocation promise
    const functionPromise = supabase.functions.invoke(functionName, {
      body: params
    });

    // Race the promises
    const result = await Promise.race([functionPromise, timeoutPromise]) as {
      data: any;
      error: any;
    };

    if (result.error) {
      console.error(`Error invoking edge function ${functionName}:`, result.error);
      throw new Error(`Edge function error: ${result.error.message || 'Unknown error'}`);
    }

    return result.data;
  } catch (error: any) {
    console.error(`Failed to invoke edge function ${functionName}:`, error);
    throw new Error(`Edge function ${functionName} failed: ${error.message}`);
  }
}

/**
 * Invoke an edge function with automatic retry on failure
 */
export async function invokeEdgeFunctionWithRetry(
  functionName: string,
  params: Record<string, any> = {},
  maxRetries: number = 2,
  initialTimeoutMs: number = 5000
): Promise<any> {
  let lastError: Error | null = null;
  let timeoutMs = initialTimeoutMs;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Increase timeout for each retry
      const currentTimeout = attempt === 0 ? timeoutMs : timeoutMs * (attempt + 1);
      
      return await invokeEdgeFunction(functionName, params, currentTimeout);
    } catch (error: any) {
      lastError = error;
      console.log(`Attempt ${attempt + 1}/${maxRetries + 1} failed: ${error.message}`);
      
      // Don't wait after the last attempt
      if (attempt < maxRetries) {
        // Exponential backoff
        const backoffMs = Math.min(1000 * Math.pow(2, attempt), 5000);
        console.log(`Retrying in ${backoffMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }
  
  throw lastError || new Error(`All ${maxRetries + 1} attempts to invoke ${functionName} failed`);
}
