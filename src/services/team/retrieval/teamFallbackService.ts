
import { supabase } from '@/integrations/supabase/client';
import { Team } from '../../team';

/**
 * Direct database query fallback for getting teams
 */
export async function getTeamsDirectly(userId: string, orgId?: string): Promise<Team[]> {
  try {
    // Get user's organization ID for context
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', userId)
      .single();
      
    const userOrgId = userProfile?.org_id;
    
    // Get app_user ID
    const { data: appUser } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', userId)
      .single();
      
    if (!appUser?.id) {
      throw new Error('User not found in app_user table');
    }
    
    const appUserId = appUser.id;
    
    // 1. Get teams the user is a direct member of
    const { data: memberTeams, error: memberTeamsError } = await supabase
      .from('team')
      .select(`
        *,
        org:organization(id, name)
      `)
      .eq('team_member.user_id', appUserId)
      .is('deleted_at', null);
    
    if (memberTeamsError) {
      console.error('Error fetching member teams:', memberTeamsError);
    }
    
    // 2. Get teams from user's organization
    let orgQuery = supabase
      .from('team')
      .select(`
        *,
        org:organization(id, name)
      `)
      .is('deleted_at', null);
    
    // Filter by organization ID if provided or use user's organization
    if (orgId) {
      orgQuery = orgQuery.eq('org_id', orgId);
    } else if (userOrgId) {
      orgQuery = orgQuery.eq('org_id', userOrgId);
    } else {
      // If no org context available, just use member teams
      return processTeams(memberTeams || [], appUserId, userOrgId);
    }
    
    const { data: orgTeams, error: orgTeamsError } = await orgQuery;
    
    if (orgTeamsError) {
      console.error('Error fetching organization teams:', orgTeamsError);
    }
    
    // 3. Get user's role in each team
    const { data: teamRoles } = await supabase
      .from('team_member')
      .select(`
        team_id,
        team_roles(role)
      `)
      .eq('user_id', appUserId);
    
    // Process and return teams
    const allTeams = [...(memberTeams || []), ...(orgTeams || [])];
    
    // Deduplicate teams
    const uniqueTeamIds = new Set();
    const uniqueTeams = allTeams.filter(team => {
      if (uniqueTeamIds.has(team.id)) {
        return false;
      }
      uniqueTeamIds.add(team.id);
      return true;
    });
    
    return processTeams(uniqueTeams, appUserId, userOrgId);
  } catch (error) {
    console.error('Error in getTeamsDirectly:', error);
    throw error;
  }
}

/**
 * Helper function to process team data
 */
function processTeams(teams: any[], appUserId: string, userOrgId?: string): Team[] {
  if (!Array.isArray(teams)) return [];
  
  return teams.map(team => {
    // Convert team data to Team interface
    const teamData: Team = {
      id: team.id,
      name: team.name,
      org_id: team.org_id,
      org_name: team.org?.name || 'Unknown Organization',
      is_external: userOrgId && team.org_id !== userOrgId,
      created_at: team.created_at,
      deleted_at: team.deleted_at
    };
    
    return teamData;
  });
}
