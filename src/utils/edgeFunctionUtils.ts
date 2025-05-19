import { supabase } from "@/integrations/supabase/client";

/**
 * Invoke a Supabase Edge Function with timeout handling
 * @param functionName Name of the edge function to invoke
 * @param payload JSON payload to send to the function
 * @param timeoutMs Optional timeout in milliseconds (default: 5000ms)
 * @returns Function response data
 */
export async function invokeEdgeFunction<T = any>(
  functionName: string, 
  payload: Record<string, any>,
  timeoutMs: number = 5000
): Promise<T> {
  // Create a promise for the edge function call
  const functionPromise = supabase.functions.invoke(functionName, {
    body: payload
  });
  
  // Create a timeout promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Edge function ${functionName} timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  
  try {
    // Race the function call against the timeout
    const result = await Promise.race([functionPromise, timeoutPromise]) as any;
    
    if (result.error) {
      console.error(`Error invoking edge function ${functionName}:`, result.error);
      throw new Error(result.error.message || `${functionName} failed`);
    }
    
    return result.data as T;
  } catch (error) {
    console.error(`Failed to invoke edge function ${functionName}:`, error);
    throw error;
  }
}

/**
 * Invoke a Supabase Edge Function with retry logic
 * @param functionName Name of the edge function to invoke
 * @param payload JSON payload to send to the function
 * @param config Retry configuration
 * @returns Function response data
 */
export async function invokeEdgeFunctionWithRetry<T = any>(
  functionName: string,
  payload: Record<string, any>,
  config: {
    maxRetries?: number;
    initialDelayMs?: number;
    timeoutMs?: number;
  } = {}
): Promise<T> {
  const { maxRetries = 3, initialDelayMs = 500, timeoutMs = 5000 } = config;
  
  let lastError: any = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Exponential backoff delay after the first attempt
      if (attempt > 0) {
        const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} for ${functionName} after ${delayMs}ms`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      
      return await invokeEdgeFunction<T>(functionName, payload, timeoutMs);
    } catch (error) {
      console.warn(`Attempt ${attempt + 1}/${maxRetries} failed for ${functionName}:`, error);
      lastError = error;
      
      // If this is a connection error or timeout, continue retrying
      // Otherwise, throw immediately
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!(
        errorMessage.includes('timeout') ||
        errorMessage.includes('network') ||
        errorMessage.includes('connection')
      ) && attempt > 0) {
        throw error;
      }
    }
  }
  
  // If we got here, all attempts failed
  throw lastError || new Error(`All ${maxRetries} attempts failed for ${functionName}`);
}
