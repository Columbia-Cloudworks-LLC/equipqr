
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
      console.log(`Calling edge function ${functionName} with payload:`, JSON.stringify(payload));
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload
      });
      
      if (error) {
        console.error(`Edge function ${functionName} error:`, error);
        
        // Check for specific response status codes
        if (error.message?.includes('status code: 400')) {
          console.error('Bad request error (400). This often indicates parameter validation failure.');
        } else if (error.message?.includes('status code: 500')) {
          console.error('Server error (500). This often indicates an unhandled exception in the edge function.');
        }
        
        throw new Error(`Edge function error: ${error.message || error}`);
      }
      
      console.log(`Edge function ${functionName} returned:`, data);
      return data as T;
    } catch (error: any) {
      console.error(`Edge function ${functionName} failed:`, error);
      
      // Enhanced error detail reporting
      if (error.message?.includes('status code:')) {
        const statusMatch = error.message.match(/status code: (\d+)/);
        if (statusMatch) {
          const statusCode = statusMatch[1];
          console.error(`HTTP status ${statusCode} received from edge function`);
        }
      }
      
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
      
      // Provide detailed failure information
      const isNetworkError = error.message?.includes('network') || 
                             error.message?.includes('fetch') ||
                             error.message?.includes('connection');
      
      const isTimeoutError = error.message?.includes('timed out');
      
      console.log(`Error type: ${isNetworkError ? 'Network' : isTimeoutError ? 'Timeout' : 'Other'}`);
      
      // Don't retry if it's not a timeout or network error, unless it's specifically a 500 error
      if (!isTimeoutError && !isNetworkError && !error.message?.includes('status code: 500')) {
        throw error;
      }
    }
  }
  
  // If we reach here, all retries failed
  throw lastError || new Error(`All ${retries} retries failed for ${functionName}`);
}
