
import { supabase } from "@/integrations/supabase/client";

/**
 * Get a single team by ID
 */
export async function getTeamById(teamId: string) {
  try {
    console.log(`Fetching team details for ID: ${teamId}`);
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to view team details');
    }
    
    const { data, error } = await supabase
      .from('team')
      .select('*')
      .eq('id', teamId)
      .is('deleted_at', null)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching team:', error);
      throw error;
    }
    
    if (!data) {
      console.log(`No team found with ID: ${teamId}`);
      throw new Error('Team not found');
    }
    
    console.log('Successfully fetched team details');
    return data;
  } catch (error) {
    console.error('Error in getTeamById:', error);
    throw error;
  }
}

/**
 * Export combined retrieval functions
 */
export { getTeams } from './getTeams';
