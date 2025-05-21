
import { supabase } from '@/integrations/supabase/client';
import { Team } from '../../team';
import { invokeEdgeFunction } from '@/utils/edgeFunctions';

/**
 * Get teams via edge function for better performance
 */
export async function getTeamsViaEdgeFunction(userId: string, orgId?: string): Promise<Team[]> {
  try {
    // Call the edge function to get user's teams
    const response = await invokeEdgeFunction('get_user_teams', { 
      user_id: userId,
      org_id: orgId || null
    });

    if (!response?.data?.teams || !Array.isArray(response.data.teams)) {
      throw new Error('Invalid response from edge function');
    }

    return response.data.teams;
  } catch (error) {
    console.error('Error fetching teams via edge function:', error);
    throw error;
  }
}
