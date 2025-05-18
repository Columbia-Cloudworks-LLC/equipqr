
/**
 * Utilities for working with Supabase edge functions
 */

import { supabase } from "@/integrations/supabase/client";

// Default timeout for edge function calls in milliseconds (10 seconds)
const DEFAULT_TIMEOUT = 10000;

/**
 * Invoke a Supabase edge function with timeout handling
 * 
 * @param functionName The edge function name to call
 * @param payload The payload to send to the function
 * @param timeout Optional timeout in milliseconds (defaults to 10 seconds)
 * @returns The function response data or throws an error
 */
export async function invokeEdgeFunction<T = any>(
  functionName: string, 
  payload: any = {}, 
  timeout: number = DEFAULT_TIMEOUT
): Promise<T> {
  // Create a promise that rejects after the specified timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Edge function ${functionName} timed out after ${timeout}ms`));
    }, timeout);
    // Clear the timeout if the promise is cancelled
    return () => clearTimeout(timeoutId);
  });
  
  // Create the actual function call promise
  const functionPromise = async (): Promise<T> => {
    try {
      console.log(`Calling edge function ${functionName} with payload:`, payload);
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload
      });
      
      if (error) {
        console.error(`Edge function ${functionName} error:`, error);
        throw new Error(`Edge function error: ${error.message || error}`);
      }
      
      console.log(`Edge function ${functionName} returned:`, data);
      return data as T;
    } catch (error: any) {
      console.error(`Edge function ${functionName} failed:`, error);
      throw error;
    }
  };
  
  // Race the function call against the timeout
  try {
    return await Promise.race([functionPromise(), timeoutPromise]);
  } catch (error: any) {
    if (error.message?.includes('timed out')) {
      console.error(`Edge function ${functionName} timed out after ${timeout}ms`);
      throw new Error(`Request to ${functionName} timed out. Please try again.`);
    }
    
    throw error;
  }
}

/**
 * Helper to invoke edge functions with automatic retries
 */
export async function invokeEdgeFunctionWithRetry<T = any>(
  functionName: string,
  payload: any = {},
  options: {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
  } = {}
): Promise<T> {
  const { timeout = DEFAULT_TIMEOUT, retries = 2, retryDelay = 1000 } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Wait before retry attempts, but not before the first attempt
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        console.log(`Retry attempt ${attempt} for ${functionName}...`);
      }
      
      return await invokeEdgeFunction<T>(functionName, payload, timeout);
    } catch (error: any) {
      lastError = error;
      console.warn(`Attempt ${attempt + 1}/${retries + 1} failed for ${functionName}:`, error);
      
      // Don't retry if it's not a timeout or network error
      if (!error.message?.includes('timed out') && !error.message?.includes('network')) {
        throw error;
      }
    }
  }
  
  // If we reach here, all retries failed
  throw lastError || new Error(`All ${retries} retries failed for ${functionName}`);
}
