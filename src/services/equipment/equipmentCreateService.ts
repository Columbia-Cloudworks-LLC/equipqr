
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/types";
import { getAppUserId, getUserOrganizationId, processDateFields } from "@/utils/authUtils";
import { saveEquipmentAttributes } from "./attributesService";

/**
 * Create new equipment - only for equipment owned by the current user's organization
 * or for teams the user has manager access to
 */
export async function createEquipment(equipment: Partial<Equipment>): Promise<Equipment> {
  try {
    // Ensure name is provided as it's required in the database
    if (!equipment.name) {
      throw new Error('Equipment name is required');
    }
    
    // Get the current user's auth ID
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to create equipment');
    }
    
    const authUserId = sessionData.session.user.id;
    console.log('Current auth user ID:', authUserId);
    
    // Convert auth user ID to app_user ID
    const appUserId = await getAppUserId(authUserId);
    console.log('Mapped to app_user ID:', appUserId);
    
    if (!appUserId) {
      throw new Error('Failed to retrieve user profile information');
    }
    
    let orgId;
    
    // First check permission using edge function
    try {
      console.log('Checking permission via edge function');
      const checkPermissionPayload = {
        user_id: authUserId,
        action: 'create'
      };
      
      // Add team_id to payload if provided
      if (equipment.team_id && equipment.team_id !== 'none') {
        Object.assign(checkPermissionPayload, { team_id: equipment.team_id });
      }
      
      const { data: permissionCheck, error: permissionError } = await supabase.functions.invoke(
        'check_equipment_permission', 
        { body: checkPermissionPayload }
      );
      
      if (permissionError) {
        console.error('Error from check_equipment_permission edge function:', permissionError);
        throw new Error(`Permission check failed: ${permissionError.message}`);
      }
      
      if (!permissionCheck?.has_permission) {
        const reason = permissionCheck?.reason || 'unknown';
        throw new Error(`You don't have permission to create equipment. Reason: ${reason}`);
      }
      
      // Get the org_id from the response
      orgId = permissionCheck.org_id;
      console.log(`Permission check successful. Using org ID: ${orgId}`);
    } catch (edgeFnError) {
      // Fallback logic if edge function fails
      console.error('Edge function error, falling back to direct permission checks:', edgeFnError);
      
      try {
        if (equipment.team_id && equipment.team_id !== 'none') {
          // For team equipment, get team's org ID
          const { data: teamData, error: teamError } = await supabase
            .from('team')
            .select('org_id')
            .eq('id', equipment.team_id)
            .is('deleted_at', null)
            .single();
            
          if (teamError) {
            throw new Error(`Failed to retrieve team information: ${teamError.message}`);
          }
          
          orgId = teamData.org_id;
          console.log(`Using team's org ID: ${orgId}`);
        } else {
          // Use user's organization for non-team equipment
          orgId = await getUserOrganizationId(authUserId);
          console.log(`Using user's org ID: ${orgId}`);
        }
        
        if (!orgId) {
          throw new Error('Failed to determine organization ID for equipment creation');
        }
      } catch (fallbackError) {
        console.error('Fallback permission check failed:', fallbackError);
        throw new Error('Could not verify permissions to create equipment. Please try again.');
      }
    }
    
    // Extract attributes before sending to database
    const attributes = equipment.attributes || [];
    const equipmentData = { ...equipment };
    delete equipmentData.attributes;
    
    // Process dates and prepare data
    const processedEquipment = processDateFields({
      name: equipment.name,
      model: equipment.model,
      serial_number: equipment.serial_number,
      manufacturer: equipment.manufacturer,
      status: equipment.status || 'active',
      location: equipment.location,
      install_date: equipment.install_date,
      warranty_expiration: equipment.warranty_expiration,
      notes: equipment.notes,
      team_id: equipment.team_id === 'none' ? null : equipment.team_id,
      // Add required fields
      created_by: appUserId,
      org_id: orgId
    }, ['install_date', 'warranty_expiration']);
    
    console.log('Creating equipment with data:', processedEquipment);
    
    // Create the equipment record
    const { data, error } = await supabase
      .from('equipment')
      .insert(processedEquipment)
      .select()
      .single();
      
    if (error) {
      console.error('Error creating equipment:', error);
      
      // More user-friendly error message for RLS failures
      if (error.message?.includes('new row violates row-level security policy')) {
        throw new Error('Permission denied: You do not have permission to create equipment in this organization');
      }
      
      throw new Error(`Failed to create equipment: ${error.message}`);
    }
    
    // If we have attributes, insert them
    if (attributes.length > 0) {
      try {
        console.log('Saving attributes:', attributes);
        const savedAttributes = await saveEquipmentAttributes(data.id, attributes);
        return { ...data, attributes: savedAttributes } as Equipment;
      } catch (attrError) {
        console.error('Error adding equipment attributes:', attrError);
        // Return equipment without attributes on attribute error
        return data as Equipment;
      }
    }
    
    return data as Equipment;
  } catch (error) {
    console.error('Error in createEquipment:', error);
    throw error;
  }
}
