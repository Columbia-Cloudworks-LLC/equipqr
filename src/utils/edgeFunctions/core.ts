
import { supabase } from '@/integrations/supabase/client';
import { retry } from './retry';

/**
 * Basic function to invoke a Supabase Edge Function
 * 
 * @param functionName Name of the edge function to invoke
 * @param payload Payload to send to the function
 * @param timeoutMs Timeout in milliseconds (optional)
 * @returns The function response data
 */
export async function invokeEdgeFunction<T = any>(
  functionName: string, 
  payload: any,
  timeoutMs = 30000
): Promise<T> {
  // Add timeout handling for edge functions
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  
  try {
    return await invokeEdgeFunctionWithRetry<T>(functionName, payload, { timeoutMs });
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Invoke a Supabase Edge Function with retry capabilities
 * 
 * CRITICAL: This function now explicitly includes the Supabase authentication token
 * to ensure proper authorization when calling edge functions.
 *
 * @param functionName The name of the edge function to invoke
 * @param payload The payload to send to the function
 * @param options Configuration options for retries
 * @returns The function response data
 */
export async function invokeEdgeFunctionWithRetry<T>(
  functionName: string,
  payload: any,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    onRetry?: (attempt: number, error?: any) => void;
    onSuccess?: (data: T) => void;
    timeoutMs?: number;
    authToken?: string; // Optional explicit auth token
  } = {}
): Promise<T> {
  const { 
    maxRetries = 3, 
    retryDelay = 1000, 
    onRetry, 
    onSuccess, 
    timeoutMs = 30000,
    authToken
  } = options;

  // Get the current session for auth headers if not explicitly provided
  const { data: sessionData } = await supabase.auth.getSession();
  const token = authToken || sessionData?.session?.access_token;

  if (!token) {
    console.error('No authentication token available for edge function call');
    throw new Error('Authentication required to perform this action');
  }

  // Add error handling for common edge function failures
  return await retry<T>(
    async () => {
      try {
        console.log(`Invoking Supabase function ${functionName} with auth token (first 10 chars): ${token.substring(0, 10)}...`);
        
        // Now explicitly pass the auth token in headers via the invoke method
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: payload,
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (error) {
          console.error(`Error in edge function ${functionName}:`, error);
          throw new Error(error.message || `Error calling ${functionName}`);
        }
        
        // Check for error in response payload (some edge functions return success but with error inside)
        if (data && typeof data === 'object' && 'error' in data) {
          console.error(`Error returned in edge function ${functionName} payload:`, data.error);
          throw new Error(typeof data.error === 'string' ? data.error : 'Error in edge function response');
        }
        
        console.log(`Edge function ${functionName} succeeded:`, data);
        onSuccess?.(data as T);
        return data as T;
      } catch (error: any) {
        // Better error classification for debugging
        if (error.name === 'AbortError') {
          console.error(`Timeout exceeded calling Supabase function ${functionName}`);
          throw new Error(`Function ${functionName} timed out after ${timeoutMs}ms`);
        }
        
        // Log additional details for auth errors to help diagnose the issue
        if (error.status === 401 || error.message?.includes('unauthorized')) {
          console.error(`Authentication error (401) calling ${functionName}. Token length: ${token?.length || 0}`);
        }
        
        console.error(`Failed to invoke Supabase function ${functionName}:`, error);
        throw error;
      }
    },
    {
      maxRetries,
      retryDelay,
      onRetry,
    }
  );
}
