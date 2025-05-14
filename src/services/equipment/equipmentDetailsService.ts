
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/types";
import { getEquipmentAttributes } from "./attributesService";

/**
 * Get a single equipment by ID with its attributes
 */
export async function getEquipmentById(id: string): Promise<Equipment> {
  try {
    console.log(`Fetching equipment details for ID: ${id}`);
    // First check session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session?.user) {
      console.error('Authentication error:', sessionError);
      throw new Error('User must be logged in to view equipment details');
    }
    
    const userId = sessionData.session.user.id;
    console.log(`User ${userId} requesting equipment ${id}`);
    
    // Check access using edge function to avoid RLS recursion
    const { data: accessCheck, error: accessError } = await supabase.functions.invoke('check_equipment_access', {
      body: { 
        equipment_id: id,
        user_id: userId
      }
    });
    
    if (accessError) {
      console.error('Error checking equipment access:', accessError);
      throw new Error(`Access check failed: ${accessError.message}`);
    }
    
    console.log('Access check result:', accessCheck);
    
    if (!accessCheck?.has_access) {
      const reason = accessCheck?.reason || 'unknown';
      console.error('Access denied:', reason);
      throw new Error('You do not have permission to view this equipment');
    }
    
    // Now fetch the equipment with RLS taking effect
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
      .eq('id', userId)
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
