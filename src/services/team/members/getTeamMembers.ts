
import { supabase } from '@/integrations/supabase/client';
import { TeamMember } from '@/types';

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  try {
    if (!teamId) {
      throw new Error('Team ID is required');
    }

    // Check if team exists
    const { data: teamData, error: teamError } = await supabase
      .from('team')
      .select('id, name')
      .eq('id', teamId)
      .single();

    if (teamError || !teamData) {
      if (teamError?.code === 'PGRST116') {
        throw { code: 'TEAM_NOT_FOUND', message: 'Team not found' };
      }
      throw new Error(teamError?.message || 'Team not found');
    }

    // Call Edge function to get team members instead of RPC
    const { data, error } = await supabase.functions.invoke('get_team_members', {
      body: { team_id: teamId }
    });

    if (error) {
      console.error('Error invoking get_team_members function:', error);
      throw new Error(error.message || 'Failed to load team members');
    }

    if (!Array.isArray(data)) {
      console.error('Unexpected response format from get_team_members function', data);
      throw new Error('Invalid response format from server');
    }

    return data;
  } catch (error: any) {
    console.error('Error in getTeamMembers:', error);
    throw error;
  }
}
