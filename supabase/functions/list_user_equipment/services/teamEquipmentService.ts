
import { createAdminClient } from "../adminClient.ts";

/**
 * Fetch equipment assigned to teams that the user is a member of
 */
export async function fetchTeamEquipment(appUserId: string, orgId?: string): Promise<any[]> {
  try {
    const adminClient = createAdminClient();
    
    let teamEquipmentQuery = adminClient
      .from('team_member')
      .select(`
        user_id,
        team:team_id (
          id,
          name,
          org_id,
          organization:org_id (
            id,
            name
          ),
          equipment:equipment (
            *
          )
        )
      `)
      .eq('user_id', appUserId);
    
    const { data: teamMemberships, error: teamError } = await teamEquipmentQuery;
    
    if (teamError) {
      console.error('Error getting team equipment:', teamError);
      return [];
    }
    
    // Extract equipment items from team memberships
    let teamEquipment = [];
    if (teamMemberships) {
      teamMemberships.forEach(membership => {
        // Skip if team or equipment is missing or team belongs to a different org than requested
        if (!membership.team || !membership.team.equipment) return;
        if (orgId && membership.team.org_id !== orgId) return;
        
        teamEquipment = [
          ...teamEquipment,
          ...membership.team.equipment
            .filter(item => !item.deleted_at)
            .map(item => ({
              ...item,
              access_via: 'team',
              team_name: membership.team.name,
              org_name: membership.team.organization ? membership.team.organization.name : 'Unknown Organization'
            }))
        ];
      });
    }
    
    return teamEquipment;
  } catch (error) {
    console.error('Error fetching team equipment:', error);
    return [];
  }
}
