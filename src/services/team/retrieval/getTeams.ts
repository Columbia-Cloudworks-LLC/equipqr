
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getTeamsFallback } from "./teamFallbackService";
import { getTeamsViaEdgeFunction } from "./edgeFunctionService";
import { getCachedTeams } from "./teamCache";

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
    
    // Check cache first
    const cachedTeams = getCachedTeams();
    if (cachedTeams) {
      console.log(`Using ${cachedTeams.length} cached teams`);
      return cachedTeams;
    }
    
    // Try the edge function first with a short timeout
    try {
      return await getTeamsViaEdgeFunction(authUserId);
    } catch (edgeFunctionError) {
      console.warn('Edge function failed, falling back to direct query:', edgeFunctionError);
      
      // Use fallback direct query approach
      return await getTeamsFallback(authUserId);
    }
  } catch (error) {
    console.error('Error in getTeams:', error);
    
    // Show a toast with the error unless it's already being shown elsewhere
    if (!error.message?.includes('must be logged in')) {
      toast.error("Error loading teams", {
        description: "Please try refreshing the page"
      });
    }
    
    throw error;
  }
}
