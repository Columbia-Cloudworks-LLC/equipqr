
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

    // Call RPC function to get team members with roles
    const { data: members, error: membersError } = await supabase
      .rpc('get_team_members_with_roles', { _team_id: teamId });

    if (membersError) {
      console.error('Error fetching team members:', membersError);
      throw new Error('Failed to load team members');
    }

    return members || [];
  } catch (error: any) {
    console.error('Error in getTeamMembers:', error);
    throw error;
  }
}
