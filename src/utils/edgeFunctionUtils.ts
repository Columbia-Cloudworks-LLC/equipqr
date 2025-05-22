
import { supabase } from '@/integrations/supabase/client';
import { isValidUuid } from './validationUtils';

/**
 * Invoke an edge function with proper error handling and timeout
 * @param functionName The edge function name to call
 * @param payload The data to send to the edge function
 * @param timeoutMs Optional timeout in milliseconds
 * @returns Promise resolving to the function's response data
 */
export async function invokeEdgeFunction(
  functionName: string, 
  payload: any, 
  timeoutMs: number = 8000
): Promise<any> {
  return new Promise(async (resolve, reject) => {
    // Set timeout to reject the promise if it takes too long
    const timeoutId = setTimeout(() => {
      reject(new Error(`Edge function call to ${functionName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload
      });
      
      clearTimeout(timeoutId);
      
      if (error) {
        console.error(`Edge function ${functionName} error:`, error);
        reject(new Error(error.message || 'Unknown edge function error'));
      } else {
        resolve(data);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      reject(err);
    }
  });
}
