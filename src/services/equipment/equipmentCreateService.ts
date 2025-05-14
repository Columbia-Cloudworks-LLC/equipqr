
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
    
    // If equipment is for a team, get that team's org_id and check permissions through RLS
    if (equipment.team_id && equipment.team_id !== 'none') {
      console.log(`Getting org ID for team ${equipment.team_id}`);
      
      // Use the edge function to check permission instead of direct DB access
      // This avoids RLS recursion issues
      const { data: permissionCheck, error: permissionError } = await supabase.functions.invoke('check_equipment_create_permission', {
        body: {
          user_id: authUserId,
          team_id: equipment.team_id
        }
      });
      
      if (permissionError) {
        console.error('Error checking equipment creation permission:', permissionError);
        throw new Error('Failed to verify permissions');
      }
      
      if (!permissionCheck?.can_create) {
        throw new Error('You do not have permission to create equipment for this team');
      }
      
      // Get the org_id from the response
      orgId = permissionCheck.org_id;
      
      if (!orgId) {
        throw new Error('Failed to determine organization for this team');
      }
      
      console.log(`Using team's org ID: ${orgId}`);
    } else {
      // Use user's organization ID for non-team equipment
      orgId = await getUserOrganizationId(authUserId);
      console.log('Using user org ID:', orgId);
      
      // Verify user has permission in their organization
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUserId)
        .eq('org_id', orgId)
        .maybeSingle();
        
      const orgRole = userRoles?.role;
      
      if (!orgRole || !['owner', 'manager'].includes(orgRole)) {
        throw new Error('You need to be an organization manager or owner to create equipment');
      }
    }
    
    if (!orgId) {
      throw new Error('Could not determine organization ID for equipment creation');
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
