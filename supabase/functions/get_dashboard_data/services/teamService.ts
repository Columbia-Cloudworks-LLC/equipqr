
/**
 * Service for fetching user teams
 */
interface TeamResult {
  success: boolean;
  teams: any[];
  error?: string;
}

/**
 * Fetch teams for a specific user, optionally filtered by org_id
 */
export async function fetchUserTeams(supabase: any, userId: string, orgId?: string): Promise<TeamResult> {
  try {
    console.log(`Fetching teams for user: ${userId}${orgId ? `, filtered by org: ${orgId}` : ''}`);
    
    // Get app_user ID for this auth user
    const { data: appUser, error: appUserError } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', userId)
      .single();
    
    if (appUserError || !appUser) {
      console.error('Error fetching app_user:', appUserError);
      return { 
        success: false, 
        teams: [],
        error: appUserError?.message || 'Failed to fetch app_user'
      };
    }
    
    // Build the query for teams - use correct table name 'team' instead of 'teams'
    let query = supabase
      .from('team')
      .select(`
        *,
        org:org_id (*)
      `);
    
    // Add org filter if provided
    if (orgId) {
      query = query.eq('org_id', orgId);
    }
    
    const { data: teams, error: teamsError } = await query;
    
    if (teamsError) {
      console.error('Error fetching teams:', teamsError);
      return { 
        success: false, 
        teams: [],
        error: teamsError.message || 'Failed to fetch teams'
      };
    }
    
    // Get team memberships for this user using correct table name 'team_member'
    const { data: teamMemberships, error: membershipError } = await supabase
      .from('team_member')
      .select(`
        team_id,
        team_roles (role)
      `)
      .eq('user_id', appUser.id);
    
    if (membershipError) {
      console.error('Error fetching team memberships:', membershipError);
      return { 
        success: false, 
        teams: [],
        error: membershipError.message || 'Failed to fetch team memberships'
      };
    }
    
    console.log(`Found ${teamMemberships?.length || 0} team memberships and ${teams?.length || 0} total teams`);
    
    // Create membership lookup map
    const membershipMap = new Map();
    teamMemberships?.forEach((membership: any) => {
      const role = membership.team_roles?.[0]?.role || 'viewer';
      membershipMap.set(membership.team_id, role);
    });
    
    // Process teams to add role and other derived fields
    // Only include teams where the user is a member
    const userTeams = teams
      .filter((team: any) => membershipMap.has(team.id))
      .map((team: any) => {
        return {
          ...team,
          role: membershipMap.get(team.id),
          org_name: team.org ? team.org.name : 'Unknown Organization',
          is_external: team.org ? team.org.owner_user_id !== appUser.id : false
        };
      });
    
    console.log(`Returning ${userTeams.length} teams the user is member of`);
    
    return { success: true, teams: userTeams };
  } catch (error) {
    console.error('Error in fetchUserTeams:', error);
    return { 
      success: false, 
      teams: [],
      error: error.message || 'Internal server error in teams service'
    };
  }
}
