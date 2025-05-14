
import { supabase } from "@/integrations/supabase/client";

/**
 * Get all equipment items that the current user has access to
 * This includes equipment owned by the user's organization
 * and equipment from teams the user belongs to
 */
export async function getEquipment() {
  try {
    console.log('Fetching all equipment for current user');
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to view equipment');
    }
    
    const authUserId = sessionData.session.user.id;

    // Use RLS to fetch equipment the user has access to through policies
    const { data, error } = await supabase
      .from('equipment')
      .select(`
        *,
        team:team_id (name, org_id),
        org:org_id (name)
      `)
      .is('deleted_at', null)
      .order('name');
    
    if (error) {
      console.error('Error fetching equipment:', error);
      return []; // Return empty array instead of throwing
    }
    
    // Ensure we always have a valid array to work with
    const equipmentArray = Array.isArray(data) ? data : [];
    console.log(`Successfully fetched ${equipmentArray.length} equipment items`);
    
    // Get user's org ID for determining external equipment
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', authUserId)
      .single();
    
    const userOrgId = userProfile?.org_id;
    
    // Process the equipment data to add required fields
    const processedEquipment = equipmentArray.map(item => {
      const isExternalOrg = item.team?.org_id && userOrgId && 
                          item.team.org_id !== userOrgId;
      
      return {
        ...item,
        team_name: item.team?.name || null,
        org_name: item.org?.name || 'Unknown Organization',
        is_external_org: isExternalOrg,
      };
    });
    
    return processedEquipment;
  } catch (error) {
    console.error('Error in getEquipment:', error);
    return []; // Return empty array on error
  }
}

// Export equipment service functions properly
export { getEquipmentById } from './equipmentDetailsService';
export { createEquipment } from './equipmentCreateService';
export { updateEquipment } from './equipmentUpdateService';
export { deleteEquipment } from './equipmentDeleteService';
export { getEquipmentAttributes, saveEquipmentAttributes } from '../equipmentAttributesService';
export { recordScan } from './scanService';
