
import { supabase } from '@/integrations/supabase/client';

export interface TeamAccessibleEquipment {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  status: 'active' | 'maintenance' | 'inactive';
  location: string;
  organizationId: string;
  teamId: string | null;
  teamName?: string;
}

// Get equipment that a user can access based on their team memberships and role
export const getTeamAccessibleEquipment = async (
  organizationId: string, 
  userTeamIds: string[],
  isOrgAdmin: boolean = false
): Promise<TeamAccessibleEquipment[]> => {
  try {
    console.log('🔍 Fetching team-accessible equipment for teams:', userTeamIds, 'isAdmin:', isOrgAdmin);
    
    let query = supabase
      .from('equipment')
      .select(`
        id,
        name,
        manufacturer,
        model,
        serial_number,
        status,
        location,
        organization_id,
        team_id,
        teams:team_id (
          name
        )
      `)
      .eq('organization_id', organizationId);

    // Organization admins can see all equipment
    if (isOrgAdmin) {
      console.log('👑 Admin access - showing all equipment');
    } else {
      // Regular users can only see equipment assigned to their teams
      if (userTeamIds.length > 0) {
        query = query.in('team_id', userTeamIds);
        console.log('👥 Team member access - showing equipment for teams:', userTeamIds);
      } else {
        // Users with no team memberships see no equipment
        console.log('⚠️ User has no team memberships - showing no equipment');
        return [];
      }
    }

    const { data, error } = await query.order('name', { ascending: true });

    if (error) {
      console.error('❌ Error fetching team-accessible equipment:', error);
      throw error;
    }

    console.log('✅ Found team-accessible equipment:', data?.length || 0);

    return (data || []).map(equipment => ({
      id: equipment.id,
      name: equipment.name,
      manufacturer: equipment.manufacturer,
      model: equipment.model,
      serialNumber: equipment.serial_number,
      status: equipment.status,
      location: equipment.location,
      organizationId: equipment.organization_id,
      teamId: equipment.team_id,
      teamName: equipment.teams?.name
    }));
  } catch (error) {
    console.error('💥 Error in getTeamAccessibleEquipment:', error);
    throw error;
  }
};

// Get equipment IDs that a user can access (for work order filtering)
export const getAccessibleEquipmentIds = async (
  organizationId: string,
  userTeamIds: string[],
  isOrgAdmin: boolean = false
): Promise<string[]> => {
  try {
    const equipment = await getTeamAccessibleEquipment(organizationId, userTeamIds, isOrgAdmin);
    return equipment.map(e => e.id);
  } catch (error) {
    console.error('💥 Error getting accessible equipment IDs:', error);
    return [];
  }
};
