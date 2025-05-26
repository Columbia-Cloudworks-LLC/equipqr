
import { createAdminClient } from "../adminClient.ts";

/**
 * Fetch equipment from user's organizations with proper team joins
 */
export async function fetchOrgEquipment(userId: string, orgId?: string): Promise<any[]> {
  try {
    const adminClient = createAdminClient();
    
    // Get user's organization with equipment that includes team information
    let userOrgQuery = adminClient
      .from('user_profiles')
      .select(`
        org:org_id (
          id,
          name,
          equipment (
            *,
            team:team_id (
              id,
              name
            )
          )
        )
      `)
      .eq('id', userId);
    
    const { data: userOrgs, error: userOrgError } = await userOrgQuery;
    
    if (userOrgError) {
      console.error('Error getting user org equipment:', userOrgError);
      return [];
    }
    
    // Extract equipment items from user organizations
    let orgEquipment = [];
    if (userOrgs && userOrgs.length > 0) {
      userOrgs.forEach(userOrg => {
        // Skip if org or equipment is missing or org doesn't match requested org
        if (!userOrg.org || !userOrg.org.equipment) return;
        if (orgId && userOrg.org.id !== orgId) return;
        
        orgEquipment = [
          ...orgEquipment,
          ...userOrg.org.equipment
            .filter(item => !item.deleted_at)
            .map(item => ({
              ...item,
              access_via: 'org',
              org_name: userOrg.org.name,
              team_name: item.team?.name || null
            }))
        ];
      });
    }
    
    console.log(`Org equipment: found ${orgEquipment.length} items with team names resolved`);
    
    return orgEquipment;
  } catch (error) {
    console.error('Error fetching org equipment:', error);
    return [];
  }
}
