
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/types";
import { getAppUserId, getUserOrganizationId, processDateFields } from "@/utils/authUtils";
import { getEquipmentAttributes, saveEquipmentAttributes } from "./attributesService";
import { recordScan } from "./scanService";
import { getEquipmentById } from "./equipmentDetailsService";
import { toast } from "sonner";

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

    // Use the edge function to fetch equipment, which bypasses RLS recursion issues
    const { data, error } = await supabase.functions.invoke('list_user_equipment', {
      body: { user_id: authUserId }
    });
    
    if (error) {
      console.error('Error fetching equipment via edge function:', error);
      return []; // Return empty array instead of throwing
    }
    
    // Ensure we always have a valid array to work with
    const equipmentArray = Array.isArray(data) ? data : [];
    console.log(`Successfully fetched ${equipmentArray.length} equipment items via edge function`);
    
    return equipmentArray;
  } catch (error) {
    console.error('Error in getEquipment:', error);
    return []; // Return empty array on error
  }
}

/**
 * Create new equipment - only for equipment owned by the current user's organization
 * or for teams the user has manager access to
 */
export async function createEquipment(equipment: Partial<Equipment>) {
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
    
    let orgId;
    
    // If equipment is for a team, get that team's org_id
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
      created_by: appUserId, // Using the app_user ID instead of auth user ID
      org_id: orgId
    }, ['install_date', 'warranty_expiration']);
    
    // Create the equipment record
    const { data, error } = await supabase
      .from('equipment')
      .insert(processedEquipment)
      .select()
      .single();
      
    if (error) {
      console.error('Error creating equipment:', error);
      throw error;
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

/**
 * Update existing equipment - only the organization that owns the equipment
 * or team members with manager role can update equipment
 */
export async function updateEquipment(id: string, equipment: Partial<Equipment>) {
  try {
    // Extract attributes before sending to database
    const attributes = equipment.attributes || [];
    const equipmentData = { ...equipment };
    delete equipmentData.attributes;
    
    // Handle 'none' value for team_id
    if (equipmentData.team_id === 'none') {
      equipmentData.team_id = null;
    }
    
    // Process dates and prepare data
    const processedEquipment = processDateFields({
      ...equipmentData,
      updated_at: new Date().toISOString(),
    }, ['install_date', 'warranty_expiration']);
    
    // Update the equipment
    const { data, error } = await supabase
      .from('equipment')
      .update(processedEquipment)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating equipment:', error);
      throw error;
    }
    
    // Update attributes
    try {
      console.log('Saving updated attributes:', attributes);
      const updatedAttributes = await saveEquipmentAttributes(id, attributes);
      return { ...data, attributes: updatedAttributes } as Equipment;
    } catch (attrError) {
      console.error('Error updating equipment attributes:', attrError);
      // Return equipment without updated attributes on error
      return data as Equipment;
    }
  } catch (error) {
    console.error('Error in updateEquipment:', error);
    throw error;
  }
}

/**
 * Soft delete equipment - only the organization that owns the equipment can delete it
 */
export async function deleteEquipment(id: string) {
  // Soft delete by setting deleted_at
  const { error } = await supabase
    .from('equipment')
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq('id', id);
    
  if (error) {
    console.error('Error deleting equipment:', error);
    throw error;
  }
  
  return true;
}

// Re-export other equipment-related services
export {
  getEquipmentById,
  getEquipmentAttributes,
  saveEquipmentAttributes,
  recordScan
};
