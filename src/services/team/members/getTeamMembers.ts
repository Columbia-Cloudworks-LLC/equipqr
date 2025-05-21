
import { supabase } from '@/integrations/supabase/client';
import { TeamMember } from '@/types';

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  try {
    if (!teamId) {
      throw new Error('Team ID is required');
    }
    
    // First check if the team exists
    const { data: team, error: teamError } = await supabase
      .from('team')
      .select('id, name')
      .eq('id', teamId)
      .single();
    
    if (teamError) {
      if (teamError.code === 'PGRST116') {
        throw { message: 'Team not found or has been deleted', code: 'TEAM_NOT_FOUND' };
      }
      throw new Error(`Failed to check team: ${teamError.message}`);
    }
    
    // Fetch team members using edge function for better performance and security
    const { data: members, error } = await supabase
      .functions.invoke('get_team_members', {
        body: { team_id: teamId }
      });
    
    if (error) {
      throw new Error(`Failed to load team members: ${error.message}`);
    }
    
    return members || [];
  } catch (error: any) {
    console.error('Error in getTeamMembers:', error);
    throw error;
  }
}
