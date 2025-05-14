
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/types";
import { getEquipmentAttributes } from "../equipmentAttributesService";

/**
 * Get a single equipment by ID with its attributes
 */
export async function getEquipmentById(id: string): Promise<Equipment> {
  try {
    console.log(`Fetching equipment details for ID: ${id}`);
    // First check session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to view equipment details');
    }
    
    // Use the edge function to check access first
    const { data: accessCheck, error: accessError } = await supabase.functions.invoke('check_equipment_access', {
      body: { 
        equipment_id: id,
        user_id: sessionData.session.user.id
      }
    });
    
    if (accessError) {
      console.error('Error checking equipment access:', accessError);
      throw new Error(`Access check failed: ${accessError.message}`);
    }
    
    if (!accessCheck?.has_access) {
      console.error('Access denied:', accessCheck?.reason);
      throw new Error('You do not have permission to view this equipment');
    }
    
    // Fetch the equipment directly
    const { data: equipment, error } = await supabase
      .from('equipment')
      .select(`
        *,
        team:team_id (name, org_id),
        org:org_id (name)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();
      
    if (error) {
      console.error('Error fetching equipment by id:', error);
      throw error;
    }
    
    // Get user's org id to determine if this is external
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', sessionData.session.user.id)
      .single();
    
    const isExternalOrg = equipment.team?.org_id && userProfile?.org_id && 
                         equipment.team.org_id !== userProfile.org_id;
    
    // Then fetch the attributes
    const attributes = await getEquipmentAttributes(id);
    
    // Return equipment with attributes and extra info
    return {
      ...equipment,
      team_name: equipment.team?.name || null, 
      org_name: equipment.org?.name || 'Unknown Organization',
      is_external_org: isExternalOrg,
      can_edit: accessCheck.role === 'editor',
      attributes
    } as Equipment;
  } catch (error) {
    console.error('Error in getEquipmentById:', error);
    throw error;
  }
}
