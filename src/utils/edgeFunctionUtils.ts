
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
  // Create an AbortController with the specified timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    // Call the Supabase function with the abort signal
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (error) {
      console.error(`Edge function ${functionName} error:`, error);
      throw error;
    }
    
    return data as T;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError' || error.code === 20) {
      console.error(`Edge function ${functionName} timed out after ${timeout}ms`);
      throw new Error(`Request to ${functionName} timed out. Please try again.`);
    }
    
    console.error(`Edge function ${functionName} failed:`, error);
    throw error;
  }
}
