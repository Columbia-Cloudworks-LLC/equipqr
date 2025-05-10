
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/types";
import { getAppUserId, getUserOrganizationId, processDateFields } from "@/utils/authUtils";
import { getEquipmentAttributes, saveEquipmentAttributes } from "./equipmentAttributesService";
import { recordScan } from "./scanService";

/**
 * Get all equipment items
 */
export async function getEquipment() {
  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .is('deleted_at', null)
    .order('name');
    
  if (error) {
    console.error('Error fetching equipment:', error);
    throw error;
  }
  
  return data as Equipment[];
}

/**
 * Get a single equipment by ID with its attributes
 */
export async function getEquipmentById(id: string) {
  try {
    // First fetch the equipment
    const { data: equipment, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();
      
    if (error) {
      console.error('Error fetching equipment by id:', error);
      throw error;
    }
    
    // Then fetch the attributes
    const attributes = await getEquipmentAttributes(id);
    
    // Return equipment with attributes
    return {
      ...equipment,
      attributes
    } as Equipment;
  } catch (error) {
    console.error('Error in getEquipmentById:', error);
    throw error;
  }
}

/**
 * Create new equipment
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
    
    // Get organization ID
    const orgId = await getUserOrganizationId(authUserId);
    console.log('Found organization ID:', orgId);
    
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
      team_id: equipment.team_id,
      // Add required fields
      created_by: appUserId, // Using the app_user ID instead of auth user ID
      org_id: orgId
    }, ['install_date', 'warranty_expiration']);
    
    // Start a transaction for equipment and attributes
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
      const attributesWithEquipmentId = attributes.map(attr => ({
        ...attr,
        equipment_id: data.id
      }));
      
      try {
        const savedAttributes = await saveEquipmentAttributes(data.id, attributesWithEquipmentId);
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
 * Update existing equipment
 */
export async function updateEquipment(id: string, equipment: Partial<Equipment>) {
  try {
    // Extract attributes before sending to database
    const attributes = equipment.attributes || [];
    const equipmentData = { ...equipment };
    delete equipmentData.attributes;
    
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
 * Soft delete equipment
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

// Re-export scan service functionality
export { recordScan } from "./scanService";
