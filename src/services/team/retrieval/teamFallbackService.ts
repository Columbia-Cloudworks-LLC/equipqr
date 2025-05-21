
import { supabase } from '@/integrations/supabase/client';
import { Team } from '../../team';

/**
 * Direct fallback database query to get teams
 */
export async function getTeamsDirectly(userId: string, orgId?: string): Promise<Team[]> {
  try {
    // First, get app_user ID for this auth user
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

    // Get user's own organization for filtering
    const { data: userProfile, error: userProfileError } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', userId)
      .single();

    if (userProfileError) {
      console.error('Error getting user profile:', userProfileError);
    }

    const userOrgId = userProfile?.org_id;
    
    // Build query for teams the user is a member of
    let memberTeamsQuery = supabase
      .from('team')
      .select(`
        *,
        org:org_id (
          id,
          name
        ),
        members:team_member(
          id,
          user:user_id (
            id,
            email
          ),
          roles:team_roles (
            role
          )
        )
      `)
      .eq('team_member.user_id', appUserId);

    // If orgId is specified, filter by that specific organization
    if (orgId) {
      memberTeamsQuery = memberTeamsQuery.eq('org_id', orgId);
    }

    const { data: memberTeams, error: memberTeamsError } = await memberTeamsQuery;
    
    if (memberTeamsError) {
      console.error('Error getting member teams:', memberTeamsError);
    }

    // Build query for teams in the user's organization
    let orgTeamsQuery = supabase
      .from('team')
      .select(`
        *,
        org:org_id (
          id,
          name
        )
      `);
    
    // Filter by organization
    if (orgId) {
      orgTeamsQuery = orgTeamsQuery.eq('org_id', orgId);
    } else if (userOrgId) {
      orgTeamsQuery = orgTeamsQuery.eq('org_id', userOrgId);
    } else {
      // No org filter available
      return memberTeams || [];
    }

    const { data: orgTeams, error: orgTeamsError } = await orgTeamsQuery;

    if (orgTeamsError) {
      console.error('Error getting organization teams:', orgTeamsError);
    }

    // Combine and deduplicate teams from both queries
    const allTeams = [...(memberTeams || []), ...(orgTeams || [])];
    const uniqueTeams = allTeams.filter((team, index, self) =>
      index === self.findIndex((t) => t.id === team.id)
    );

    // Process and return teams
    return uniqueTeams
      .filter(team => !team.deleted_at)
      .map(team => {
        // Get user's role in this team, if any
        const memberData = team.members?.find(m => m.user?.id === appUserId);
        const role = memberData?.roles?.[0]?.role || null;
        
        // Check if the team is from the user's own organization
        const isExternal = userOrgId && team.org_id !== userOrgId;
        
        return {
          id: team.id,
          name: team.name,
          org_id: team.org_id,
          org_name: team.org?.name || 'Unknown Organization',
          is_external: isExternal,
          role: role,
          created_at: team.created_at,
          has_access: true // User must have access if they can see it
        };
      });
  } catch (error) {
    console.error('Error in getTeamsDirectly:', error);
    return [];
  }
}
