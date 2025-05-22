
import { createAdminClient } from "../adminClient.ts";

/**
 * Fetch equipment directly from a specific organization
 */
export async function fetchDirectOrgEquipment(orgId: string): Promise<any[]> {
  try {
    const adminClient = createAdminClient();
    
    // First, get the organization name
    const { data: orgData, error: orgError } = await adminClient
      .from('organization')
      .select('name')
      .eq('id', orgId)
      .single();
    
    if (orgError) {
      console.error('Error getting organization name:', orgError);
      return [];
    }
    
    const orgName = orgData?.name || 'Unknown Organization';
    
    // Then get the equipment with team information
    const { data: orgEq, error: orgEqError } = await adminClient
      .from('equipment')
      .select(`
        *,
        team:team_id (
          id,
          name
        )
      `)
      .eq('org_id', orgId)
      .is('deleted_at', null);
    
    if (orgEqError) {
      console.error('Error getting direct org equipment:', orgEqError);
      return [];
    }
    
    if (!orgEq) {
      return [];
    }
    
    return orgEq.map(item => ({
      ...item,
      access_via: 'direct_org',
      org_name: orgName,
      team_name: item.team?.name || null
    }));
    
  } catch (error) {
    console.error('Error fetching direct org equipment:', error);
    return [];
  }
}
