
import { supabase } from "@/integrations/supabase/client";
import { getAppUserId } from "@/utils/authUtils";

/**
 * Fallback function to get teams using direct database queries when edge function fails
 * @param userId The authenticated user's ID
 * @returns Array of teams the user has access to
 */
export async function getTeamsFallback(userId: string): Promise<any[]> {
  try {
    console.log('Using fallback direct query for teams');
    
    // 1. Get user's organization
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', userId)
      .single();
      
    if (!userProfile?.org_id) {
      console.warn('No organization found for user');
      return [];
    }
    
    // 2. Get teams from user's organization
    const { data: orgTeams, error: orgTeamsError } = await supabase
      .from('team')
      .select(`
        id,
        name,
        org_id,
        organization:org_id (name)
      `)
      .eq('org_id', userProfile.org_id)
      .is('deleted_at', null);
      
    if (orgTeamsError) {
      console.error('Error fetching organization teams:', orgTeamsError);
      return [];
    }
    
    // 3. Get user's app_user ID
    const { data: appUser } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', userId)
      .single();
      
    if (!appUser?.id) {
      console.warn('No app_user found');
      // Return org teams if we have them
      return orgTeams?.map(team => ({
        ...team,
        org_name: team.organization?.name,
        is_external_org: false
      })) || [];
    }
    
    // 4. Get teams user is a member of (including external orgs)
    const { data: memberTeams, error: memberTeamsError } = await supabase
      .from('team_member')
      .select(`
        team:team_id (
          id,
          name,
          org_id,
          organization:org_id (name)
        ),
        team_roles!team_member_id(role)
      `)
      .eq('user_id', appUser.id);
      
    if (memberTeamsError) {
      console.error('Error fetching member teams:', memberTeamsError);
      // Return org teams if we have them
      return orgTeams?.map(team => ({
        ...team,
        org_name: team.organization?.name,
        is_external_org: false
      })) || [];
    }
    
    // Process member teams
    const externalTeams = memberTeams
      ?.filter(item => item.team?.org_id !== userProfile.org_id && item.team !== null)
      .map(item => {
        // Extract role from team_roles relationship
        const role = item.team_roles && item.team_roles.length > 0 ? 
          item.team_roles[0]?.role : null;
          
        return {
          id: item.team.id,
          name: item.team.name,
          org_id: item.team.org_id,
          org_name: item.team.organization?.name,
          is_external_org: true,
          role
        };
      }) || [];
      
    // Process org teams
    const internalTeams = orgTeams?.map(team => ({
      id: team.id,
      name: team.name,
      org_id: team.org_id,
      org_name: team.organization?.name,
      is_external_org: false
    })) || [];
    
    // Combine and deduplicate
    const allTeams = [...internalTeams];
    
    // Add external teams if they're not already in the list
    externalTeams.forEach(extTeam => {
      if (!allTeams.some(team => team.id === extTeam.id)) {
        allTeams.push(extTeam);
      } else {
        // Update existing team with role information
        const existingTeam = allTeams.find(team => team.id === extTeam.id);
        if (existingTeam) {
          existingTeam.role = extTeam.role;
        }
      }
    });
    
    console.log(`Successfully fetched ${allTeams.length} teams via fallback query`);
    return allTeams;
  } catch (error) {
    console.error('Error in getTeamsFallback:', error);
    return [];
  }
}
