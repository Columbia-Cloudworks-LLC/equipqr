
import { Equipment } from "@/types";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch equipment for specific teams with organization details
 * @param teamIds Array of team IDs
 * @returns Array of equipment items with team and organization details
 */
export async function getTeamsEquipment(teamIds: string[]): Promise<Equipment[]> {
  try {
    if (!teamIds.length) {
      return [];
    }
    
    // First get teams with their org details
    const { data: teamsWithOrgs, error: teamsWithOrgsError } = await supabase
      .from('team')
      .select('id, name, org_id, organization:org_id(name)')
      .in('id', teamIds);
    
    if (teamsWithOrgsError || !teamsWithOrgs) {
      console.error('Error getting teams with orgs:', teamsWithOrgsError);
      return [];
    }
    
    // Now get equipment for these teams with team information
    const { data: teamEquipment, error: teamEquipmentError } = await supabase
      .from('equipment')
      .select(`
        *,
        team:team_id (
          id,
          name
        )
      `)
      .in('team_id', teamIds)
      .is('deleted_at', null);
    
    if (teamEquipmentError || !teamEquipment) {
      console.error('Error getting team equipment:', teamEquipmentError);
      return [];
    }

    // Process equipment with team and org details
    return teamEquipment.map(item => {
      const team = teamsWithOrgs.find(t => t.id === item.team_id);
      const orgName = team?.organization?.name || 'Unknown Organization';
      
      return { 
        ...item,
        team_name: item.team?.name || team?.name,
        org_name: orgName
      };
    });
  } catch (error) {
    console.error('Error fetching teams equipment:', error);
    return [];
  }
}

/**
 * Get teams that a user is a member of
 * @param appUserId User's app_user ID
 * @returns Array of team IDs
 */
export async function getUserTeamIds(appUserId: string): Promise<string[]> {
  try {
    // Get teams the user is a member of
    const { data: userTeams, error: userTeamsError } = await supabase
      .from('team_member')
      .select('team_id')
      .eq('user_id', appUserId);
    
    if (userTeamsError || !userTeams) {
      console.error('Error getting user teams:', userTeamsError);
      return [];
    }
    
    return userTeams.map(t => t.team_id);
  } catch (error) {
    console.error('Error getting user team IDs:', error);
    return [];
  }
}

/**
 * Get team IDs for specific organization
 * @param teamIds All user team IDs
 * @param orgId Organization ID
 * @returns Filtered array of team IDs belonging to the organization
 */
export async function filterTeamsByOrg(teamIds: string[], orgId: string): Promise<string[]> {
  try {
    if (!teamIds.length) {
      return [];
    }
    
    const { data: teamsInOrg, error: teamsInOrgError } = await supabase
      .from('team')
      .select('id')
      .in('id', teamIds)
      .eq('org_id', orgId);
    
    if (teamsInOrgError || !teamsInOrg) {
      console.error('Error filtering teams by org:', teamsInOrgError);
      return [];
    }
    
    return teamsInOrg.map(t => t.id);
  } catch (error) {
    console.error('Error filtering teams by org:', error);
    return [];
  }
}
