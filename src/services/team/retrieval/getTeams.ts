
import { supabase } from '@/integrations/supabase/client';
import { Team } from '../../team';
import { processTeamData } from './teamCache';
import { getTeamsViaEdgeFunction } from './edgeFunctionService';
import { getTeamsDirectly } from './teamFallbackService';
import { clearTeamCache } from './teamCache';

interface GetTeamsOptions {
  forceRefresh?: boolean;
  orgId?: string;
}

/**
 * Get all teams the current user has access to
 */
export async function getTeams(options?: GetTeamsOptions): Promise<Team[]> {
  try {
    const forceRefresh = options?.forceRefresh || false;
    const orgId = options?.orgId;

    // If force refresh is true, clear the cache
    if (forceRefresh) {
      clearTeamCache();
    }

    // Check if user is authenticated
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session.session) {
      throw new Error('User must be logged in to fetch teams');
    }
    
    const userId = session.session.user.id;
    
    try {
      // First try edge function
      console.log('Fetching teams via edge function', orgId ? `for org: ${orgId}` : '');
      const teamsData = await getTeamsViaEdgeFunction(userId, orgId);
      return processTeamData(teamsData);
    } catch (edgeFunctionError) {
      console.warn('Edge function failed, falling back to direct query:', edgeFunctionError);
      
      // Fall back to direct database query
      const teamsData = await getTeamsDirectly(userId, orgId);
      return processTeamData(teamsData);
    }
  } catch (error) {
    console.error('Error in getTeams:', error);
    return [];
  }
}
