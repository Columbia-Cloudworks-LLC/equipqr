
import { supabase } from '@/integrations/supabase/client';
import { Team } from '../../team';
import { saveTeamCache } from './teamCache';

/**
 * Fallback method to get teams directly from the database
 * Used when edge function fails
 */
export async function getTeamsDirectly(userId: string, orgId?: string): Promise<Team[]> {
  try {
    console.log('Fetching teams directly from the database');
    
    // Get app_user ID for this auth user
    const { data: appUserData, error: appUserError } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', userId)
      .single();
    
    if (appUserError) {
      console.error('Error getting app_user ID:', appUserError);
      return [];
    }
    
    const appUserId = appUserData.id;
    
    // Get user's organization
    const { data: userProfile, error: userProfileError } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', userId)
      .single();
    
    if (userProfileError) {
      console.error('Error getting user profile:', userProfileError);
    }
    
    const userOrgId = userProfile?.org_id;
    
    // 1. Get teams the user is a member of
    let memberTeamsQuery = supabase
      .rpc('get_team_members_with_roles')
      .select('*');
    
    const { data: memberTeams, error: memberTeamsError } = await memberTeamsQuery;
    
    if (memberTeamsError) {
      console.error('Error getting member teams:', memberTeamsError);
    }
    
    // 2. Get teams in the user's organization or specified organization
    let orgTeamsQuery = supabase
      .from('team')
      .select(`
        *,
        org:org_id (
          id,
          name
        )
      `);
    
    // Apply organization filter if provided
    const targetOrgId = orgId || userOrgId;
    if (targetOrgId) {
      orgTeamsQuery = orgTeamsQuery.eq('org_id', targetOrgId);
    }
    
    // Don't show deleted teams
    orgTeamsQuery = orgTeamsQuery.is('deleted_at', null);
    
    const { data: orgTeams, error: orgTeamsError } = await orgTeamsQuery;
    
    if (orgTeamsError) {
      console.error('Error getting organization teams:', orgTeamsError);
    }
    
    // 3. Process and combine the results
    const teams: Team[] = [];
    
    // Add organization teams
    if (orgTeams) {
      orgTeams.forEach(team => {
        teams.push({
          id: team.id,
          name: team.name,
          org_id: team.org_id,
          org_name: team.org?.name || 'Unknown Organization',
          is_external: userOrgId && team.org_id !== userOrgId,
          created_at: team.created_at,
          deleted_at: null,
          has_access: true
        });
      });
    }
    
    // Save to cache and return
    const cacheKey = orgId ? `${userId}_${orgId}` : userId;
    saveTeamCache(cacheKey, teams);
    
    return teams;
  } catch (error) {
    console.error('Error in getTeamsDirectly:', error);
    return [];
  }
}
