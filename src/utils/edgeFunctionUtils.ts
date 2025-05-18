
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
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload
      });
      
      if (error) {
        console.error(`Edge function ${functionName} error:`, error);
        throw error;
      }
      
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
