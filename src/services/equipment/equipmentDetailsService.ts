
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/types";
import { getEquipmentAttributes } from "./attributesService";
import { determineEditPermission } from "./permissions/accessCheck";

interface PermissionResponse {
  has_permission: boolean;
  reason?: string;
}

/**
 * Get a single equipment by ID with its attributes
 */
export async function getEquipmentById(id: string): Promise<Equipment> {
  try {
    // Get current user's auth ID
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to view equipment details');
    }
    
    const authUserId = sessionData.session.user.id;
    
    // Verify access to this equipment using our non-recursive edge function
    const { data: accessCheck, error: accessCheckError } = await supabase.functions.invoke('check_equipment_permission', {
      body: {
        user_id: authUserId,
        equipment_id: id,
        action: 'view'
      }
    });
    
    if (accessCheckError) {
      console.error('Error checking equipment access:', accessCheckError);
      throw new Error(`Access check failed: ${accessCheckError.message}`);
    }
    
    const response = accessCheck as PermissionResponse;
    
    if (!response || !response.has_permission) {
      console.error('User does not have access to this equipment:', response?.reason);
      throw new Error('You do not have permission to view this equipment');
    }
    
    // First fetch the equipment
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
    
    // Get user's primary organization
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', authUserId)
      .single();
    
    const userOrgId = userProfile?.org_id;
    const isExternalOrg = equipment.team?.org_id && userOrgId && equipment.team.org_id !== userOrgId;
    
    // Check if user has edit permissions using the same edge function
    const { data: editCheck } = await supabase.functions.invoke('check_equipment_permission', {
      body: {
        user_id: authUserId,
        equipment_id: id,
        action: 'edit'
      }
    });
    
    const editResponse = editCheck as PermissionResponse;
    const canEdit = editResponse?.has_permission || false;
    
    // Then fetch the attributes
    const attributes = await getEquipmentAttributes(id);
    
    // Return equipment with attributes and extra info
    return {
      ...equipment,
      team_name: equipment.team?.name || null, 
      org_name: equipment.org?.name || 'Unknown Organization',
      is_external_org: isExternalOrg,
      can_edit: canEdit,
      attributes
    } as Equipment;
  } catch (error) {
    console.error('Error in getEquipmentById:', error);
    throw error;
  }
}
