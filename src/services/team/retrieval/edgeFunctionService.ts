
import { invokeEdgeFunction } from "@/utils/edgeFunctions";
import { clearTeamCache, cacheTeams } from "./teamCache";

/**
 * Get teams using the edge function
 * @param userId The authenticated user's ID
 * @param forceRefresh Whether to force a refresh from the server
 * @returns Array of teams the user has access to
 */
export async function getTeamsViaEdgeFunction(userId: string, forceRefresh = false): Promise<any[]> {
  // Clear any cached data if force refresh requested
  if (forceRefresh) {
    clearTeamCache();
  }
  
  console.log('Calling get_user_teams edge function...');
  const data = await invokeEdgeFunction('get_user_teams', { 
    user_id: userId,
    include_all_orgs: true // Always include all organizations for consistency
  }, 8000);
  
  // Check if data is properly structured
  if (!data || !Array.isArray(data.teams)) {
    console.error('Invalid response structure from get_user_teams:', data);
    throw new Error('Invalid response from server');
  }
  
  console.log(`Successfully fetched ${data.teams.length || 0} teams via edge function`);
  
  // Cache the results
  cacheTeams(data.teams);
  
  return data.teams || [];
}
