
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
