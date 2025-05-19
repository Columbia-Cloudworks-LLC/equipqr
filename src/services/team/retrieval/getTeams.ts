
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getTeamsFallback } from "./teamFallbackService";
import { getTeamsViaEdgeFunction } from "./edgeFunctionService";
import { getCachedTeams } from "./teamCache";

/**
 * Get all teams for the current user, including those from other organizations where
 * the user has been granted access through organization_acl
 * 
 * @param options Optional configuration
 * @param options.forceRefresh Force refresh from server instead of using cache
 */
export async function getTeams(options?: { forceRefresh?: boolean }) {
  const forceRefresh = options?.forceRefresh || false;

  try {
    console.log(`Fetching all teams for current user (forceRefresh: ${forceRefresh})`);
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
    
    // Check cache first (if not forcing refresh)
    const cachedTeams = getCachedTeams(forceRefresh);
    if (cachedTeams) {
      console.log(`Using ${cachedTeams.length} cached teams`);
      return normalizeTeamData(cachedTeams);
    }
    
    // Try the edge function first with a short timeout
    try {
      const teams = await getTeamsViaEdgeFunction(authUserId, forceRefresh);
      return normalizeTeamData(teams);
    } catch (edgeFunctionError) {
      console.warn('Edge function failed, falling back to direct query:', edgeFunctionError);
      
      // Use fallback direct query approach
      const teams = await getTeamsFallback(authUserId);
      return normalizeTeamData(teams);
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

/**
 * Normalize team data to ensure consistent format for components
 */
function normalizeTeamData(teams: any[]): any[] {
  if (!Array.isArray(teams)) {
    console.warn('Teams data is not an array, returning empty array');
    return [];
  }
  
  return teams.map(team => {
    if (!team) return null;
    
    return {
      id: team.id,
      name: team.name || 'Unnamed Team',
      role: team.role || 'viewer',
      org_id: team.org_id || '',
      org_name: team.org_name || team.organization?.name || 'Unknown Organization',
      is_external: typeof team.is_external === 'boolean' ? team.is_external : false
    };
  }).filter(Boolean); // Remove any null entries
}
