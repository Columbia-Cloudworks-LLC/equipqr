
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/types";
import { getEquipmentAttributes } from "../equipmentAttributesService";

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
    
    // Verify access to this equipment
    const { data: accessCheck } = await supabase.functions.invoke('check_equipment_access', {
      body: {
        equipment_id: id,
        user_id: authUserId
      }
    });
    
    if (!accessCheck?.has_access) {
      console.error('User does not have access to this equipment');
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
    
    // Get user's primary organization for determining external orgs
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', authUserId)
      .single();
    
    const userOrgId = userProfile?.org_id;
    const isExternalOrg = equipment.team?.org_id && userOrgId && equipment.team.org_id !== userOrgId;
    
    // Check if user has edit permissions
    let canEdit = !isExternalOrg; // Default: can edit if it's in user's org
    
    if (isExternalOrg) {
      // Get role for this team or org to determine edit permissions
      const { data: teamAccess } = await supabase.functions.invoke('validate_team_access', {
        body: {
          team_id: equipment.team_id,
          user_id: authUserId
        }
      });
      
      // Can edit if manager or higher role
      const editRoles = ['manager', 'creator', 'owner', 'admin'];
      canEdit = teamAccess?.role && editRoles.includes(teamAccess.role);
    }
    
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
