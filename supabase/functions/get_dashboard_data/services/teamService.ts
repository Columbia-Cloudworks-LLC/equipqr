
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
    
    // Build the query for teams
    let query = supabase
      .from('teams')
      .select(`
        *,
        team_members!inner(user_id, role),
        org:org_id(*)
      `)
      .eq('team_members.user_id', userId);
    
    // Add org filter if provided
    if (orgId) {
      query = query.eq('org_id', orgId);
    }
    
    const { data: teams, error } = await query;
    
    if (error) {
      console.error('Error fetching teams:', error);
      return { 
        success: false, 
        teams: [],
        error: error.message || 'Failed to fetch teams'
      };
    }
    
    // Process teams to add role and other derived fields
    const processedTeams = teams.map((team: any) => {
      // Get the user's role in the team
      const memberInfo = team.team_members.find((member: any) => member.user_id === userId);
      
      return {
        ...team,
        role: memberInfo ? memberInfo.role : 'viewer',
        org_name: team.org ? team.org.name : 'Unknown Organization',
        is_external: team.org ? team.org.owner_user_id !== userId : false
      };
    });
    
    return { success: true, teams: processedTeams };
  } catch (error) {
    console.error('Error in fetchUserTeams:', error);
    return { 
      success: false, 
      teams: [],
      error: error.message || 'Internal server error in teams service'
    };
  }
}
