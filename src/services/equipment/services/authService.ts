
import { supabase } from "@/integrations/supabase/client";

/**
 * Get the current user's ID from auth session
 * @returns Promise resolving to user ID or throws if not authenticated
 */
export async function getCurrentUserId(): Promise<string> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('Error getting auth session:', sessionError);
    throw new Error('Failed to authenticate user');
  }
  
  if (!sessionData?.session?.user) {
    console.error('User is not authenticated, cannot fetch equipment');
    throw new Error('User must be logged in to view equipment');
  }

  return sessionData.session.user.id;
}
