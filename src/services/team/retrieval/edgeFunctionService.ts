
import { invokeEdgeFunction } from "@/utils/edgeFunctionUtils";
import { clearTeamCache, cacheTeams } from "./teamCache";

/**
 * Get teams using the edge function
 * @param userId The authenticated user's ID
 * @returns Array of teams the user has access to
 */
export async function getTeamsViaEdgeFunction(userId: string): Promise<any[]> {
  // Clear any cached data before making the new request to ensure fresh data
  clearTeamCache();
  
  console.log('Calling get_user_teams edge function...');
  const data = await invokeEdgeFunction('get_user_teams', { user_id: userId }, 8000);
  
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
