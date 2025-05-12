
import { supabase } from "@/integrations/supabase/client";
import { getAppUserId } from "@/utils/authUtils";

/**
 * Get all teams for the current user, including those from other organizations where
 * the user has been granted access through organization_acl
 */
export async function getTeams() {
  try {
    console.log('Fetching all teams for current user');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      throw new Error('Authentication error. Please sign in again.');
    }
    
    if (!sessionData?.session?.user) {
      console.warn('No authenticated user found');
      throw new Error('User must be logged in to view teams');
    }
    
    const authUserId = sessionData.session.user.id;
    console.log('Auth user ID:', authUserId);
    
    // Call the edge function to get all teams with access
    const { data, error } = await supabase.functions.invoke('get_user_teams', {
      body: { user_id: authUserId }
    });
    
    if (error) {
      console.error('Error fetching user teams:', error);
      throw error;
    }
    
    console.log(`Successfully fetched ${data?.teams?.length || 0} teams in total`);
    
    return data?.teams || [];
  } catch (error) {
    console.error('Error in getTeams:', error);
    throw error;
  }
}
