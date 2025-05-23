
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Performs an actual API call to verify if the current session is working correctly
 * @returns Promise<boolean> true if session is valid, false otherwise
 */
export async function verifySessionWithApiCall(): Promise<boolean> {
  try {
    console.log('Session verification: Testing session with API call');
    
    // Use a lightweight API call to test authentication
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Session verification failed:', error);
      return false;
    }
    
    if (!data?.user) {
      console.warn('Session verification: No user found in response');
      return false;
    }
    
    console.log('Session verification successful: Valid user found');
    return true;
  } catch (err) {
    console.error('Error during session verification API call:', err);
    return false;
  }
}

/**
 * Attempts to repair a broken session state by forcing token refresh
 * and storage synchronization
 */
export async function repairBrokenSession(): Promise<boolean> {
  try {
    console.log('Attempting to repair broken session');
    
    // First check if we can retrieve user info without refreshing
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        console.log('User data exists, attempting token refresh');
        
        // Force token refresh to get a fresh session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('Failed to refresh token:', refreshError);
          return false;
        }
        
        if (refreshData?.session) {
          console.log('Session successfully refreshed');
          return true;
        }
      }
    } catch (userError) {
      console.error('Error getting user during repair:', userError);
    }
    
    // As a last resort, try to get a fresh session
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (sessionData?.session) {
      console.log('Got valid session during repair');
      return true;
    }
    
    console.log('Session repair failed - no valid session found');
    return false;
  } catch (err) {
    console.error('Error during session repair:', err);
    return false;
  }
}

/**
 * Complete auth verification that combines session check, API call test,
 * and repair attempts if needed
 */
export async function completeAuthVerification(
  attemptRepair = true, 
  showToasts = false
): Promise<boolean> {
  try {
    // Step 1: Check if we have a session
    const { data: sessionData } = await supabase.auth.getSession();
    const hasSession = !!sessionData?.session;
    
    if (!hasSession) {
      console.warn('Complete auth verification: No session found');
      return false;
    }
    
    // Step 2: Verify session with API call
    const isApiCallSuccessful = await verifySessionWithApiCall();
    
    if (isApiCallSuccessful) {
      return true;
    }
    
    // Step 3: If API call failed but we have a session, try to repair
    if (hasSession && attemptRepair) {
      console.warn('Session exists but API call failed - attempting repair');
      const repaired = await repairBrokenSession();
      
      if (repaired) {
        if (showToasts) {
          toast.success('Authentication restored', {
            description: 'Your session has been successfully restored'
          });
        }
        return true;
      }
      
      if (showToasts) {
        toast.error('Authentication error', {
          description: 'There was a problem with your session that could not be repaired'
        });
      }
    }
    
    return false;
  } catch (err) {
    console.error('Error during complete auth verification:', err);
    return false;
  }
}
