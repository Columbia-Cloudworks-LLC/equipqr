
import { supabase } from "@/integrations/supabase/client";

/**
 * Options for invoking edge functions
 */
interface EdgeFunctionOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  timeoutMs?: number;
  onRetry?: (attempt: number, error: any) => void;
}

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
  timeoutMs: number = 8000 // Increased from 5000ms
): Promise<T> {
  // Check session before making the request
  const { data: sessionData } = await supabase.auth.getSession();
  const isAuthenticated = !!sessionData?.session;
  
  // Log authentication status for debugging
  if (!isAuthenticated) {
    console.warn(`WARNING: Calling edge function ${functionName} without authentication`);
    // Don't proceed if authentication is required but missing
    if (functionName !== 'health_check') { // Allow specific functions to run without auth
      throw new Error('Authentication required to call this edge function');
    }
  } else {
    console.log(`Calling edge function ${functionName} with authenticated user: ${sessionData.session?.user?.email}`);
  }
  
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
 * Circuit breaker state - tracks failed calls to prevent continuous failures
 */
const circuitBreakerState: Record<string, {
  failures: number;
  lastFailure: number;
  backoffUntil: number;
}> = {};

/**
 * Invoke a Supabase Edge Function with retry logic and circuit breaker pattern
 * @param functionName Name of the edge function to invoke
 * @param payload JSON payload to send to the function
 * @param config Retry configuration
 * @returns Function response data
 */
export async function invokeEdgeFunctionWithRetry<T = any>(
  functionName: string,
  payload: Record<string, any>,
  config: EdgeFunctionOptions = {}
): Promise<T> {
  const { 
    maxRetries = 2, 
    initialDelayMs = 1000, 
    timeoutMs = 8000, 
    onRetry 
  } = config;
  
  // Check circuit breaker - if too many failures, don't even try
  const now = Date.now();
  const breakerState = circuitBreakerState[functionName] || { failures: 0, lastFailure: 0, backoffUntil: 0 };
  
  // If circuit is open (too many recent failures), wait before retrying
  if (breakerState.failures >= 5 && now < breakerState.backoffUntil) {
    console.warn(`Circuit breaker open for ${functionName} - skipping call until ${new Date(breakerState.backoffUntil).toISOString()}`);
    throw new Error(`Function ${functionName} temporarily unavailable due to repeated failures. Try again later.`);
  }
  
  let lastError: any = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Exponential backoff delay after the first attempt
      if (attempt > 0) {
        const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
        console.log(`Retry attempt ${attempt}/${maxRetries} for ${functionName} after ${delayMs}ms`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      
      const result = await invokeEdgeFunction<T>(functionName, payload, timeoutMs);
      
      // Success - reset circuit breaker for this function
      if (breakerState.failures > 0) {
        circuitBreakerState[functionName] = { failures: 0, lastFailure: 0, backoffUntil: 0 };
      }
      
      return result;
    } catch (error) {
      console.warn(`Attempt ${attempt + 1}/${maxRetries + 1} failed for ${functionName}:`, error);
      lastError = error;
      
      // Call the onRetry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, error);
      }
      
      // Update circuit breaker state
      circuitBreakerState[functionName] = {
        failures: breakerState.failures + 1,
        lastFailure: now,
        backoffUntil: now + Math.min(breakerState.failures * 5000, 60000) // Increasing backoff up to 1 minute
      };
      
      // If this is a connection error or timeout, continue retrying
      // Otherwise, throw immediately
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isRetryableError = errorMessage.includes('timeout') || 
                              errorMessage.includes('network') ||
                              errorMessage.includes('connection');
      
      if (!isRetryableError && attempt > 0) {
        throw error;
      }
    }
  }
  
  // If we got here, all attempts failed
  throw lastError || new Error(`All ${maxRetries + 1} attempts failed for ${functionName}`);
}
