
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/types";
import { getEquipmentAttributes } from "./attributesService";

interface PermissionResponse {
  has_permission: boolean;
  reason?: string;
  role?: string;
}

/**
 * Get a single equipment by ID with its attributes
 */
export async function getEquipmentById(id: string): Promise<Equipment> {
  try {
    // Get current user's auth ID
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error('Authentication error: Please log in again');
    }
    
    if (!sessionData?.session?.user) {
      console.error('No session user found');
      throw new Error('User must be logged in to view equipment details');
    }
    
    const authUserId = sessionData.session.user.id;
    console.log('Getting equipment by ID. Auth user ID:', authUserId);
    
    // Verify access to this equipment using our edge function
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
    console.log('Permission check response:', response);
    
    if (!response || !response.has_permission) {
      console.error('User does not have access to this equipment. Reason:', response?.reason);
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
    
    // Check if user has edit permissions
    const { data: editCheck, error: editError } = await supabase.functions.invoke('check_equipment_permission', {
      body: {
        user_id: authUserId,
        equipment_id: id,
        action: 'edit'
      }
    });
    
    if (editError) {
      console.error('Error checking edit permission:', editError);
    }
    
    const editResponse = editCheck as PermissionResponse;
    const canEdit = editResponse?.has_permission || false;
    console.log('Edit permission check result:', editResponse);
    
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
