
import { supabase } from '@/integrations/supabase/client';
import { useTeamMembership } from '@/hooks/useTeamMembership';

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

// Get equipment that a user can access based on their team memberships
export const getTeamAccessibleEquipment = async (
  organizationId: string, 
  userTeamIds: string[]
): Promise<TeamAccessibleEquipment[]> => {
  try {
    console.log('🔍 Fetching team-accessible equipment for teams:', userTeamIds);
    
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

    // If user has team memberships, filter to equipment assigned to those teams
    // Also include unassigned equipment (team_id is null) so managers can see and assign it
    if (userTeamIds.length > 0) {
      query = query.or(`team_id.in.(${userTeamIds.join(',')}),team_id.is.null`);
    } else {
      // If user has no team memberships, only show unassigned equipment
      query = query.is('team_id', null);
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
  userTeamIds: string[]
): Promise<string[]> => {
  try {
    const equipment = await getTeamAccessibleEquipment(organizationId, userTeamIds);
    return equipment.map(e => e.id);
  } catch (error) {
    console.error('💥 Error getting accessible equipment IDs:', error);
    return [];
  }
};
