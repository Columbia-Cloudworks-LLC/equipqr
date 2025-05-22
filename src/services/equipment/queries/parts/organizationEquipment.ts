
import { Equipment } from "@/types";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch equipment from a specific organization
 * @param orgId Organization ID
 * @returns Array of equipment items with organization details
 */
export async function getOrganizationEquipment(orgId: string): Promise<Equipment[]> {
  try {
    // Get organization name first
    const { data: orgData, error: orgError } = await supabase
      .from('organization')
      .select('name')
      .eq('id', orgId)
      .single();
    
    if (orgError) {
      console.error('Error getting organization:', orgError);
      return [];
    }
    
    const orgName = orgData?.name || 'Unknown Organization';
    
    // Then get the equipment with team information
    const { data: orgEquipment, error: orgEquipmentError } = await supabase
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
    
    if (orgEquipmentError) {
      console.error('Error getting organization equipment:', orgEquipmentError);
      return [];
    }
    
    if (!orgEquipment) {
      return [];
    }

    // Map equipment with organization details
    return orgEquipment.map(item => ({ 
      ...item,
      org_name: orgName,
      team_name: item.team?.name || null
    }));
  } catch (error) {
    console.error('Error fetching organization equipment:', error);
    return [];
  }
}
