
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/types";
import { isValidUuid } from "@/utils/validationUtils";

/**
 * Insert equipment into the database
 * @param processedEquipment - The processed equipment data (without attributes field)
 * @returns The created equipment record
 */
export async function insertEquipment(processedEquipment: any) {
  console.log('Creating equipment with data:', processedEquipment);
  
  // Critical validation before database insert
  if (!processedEquipment.org_id || processedEquipment.org_id.trim() === '') {
    throw new Error('Organization ID is required for equipment creation');
  }
  
  if (!isValidUuid(processedEquipment.org_id)) {
    throw new Error('Invalid organization ID format');
  }
  
  if (!processedEquipment.name || processedEquipment.name.trim() === '') {
    throw new Error('Equipment name is required');
  }
  
  if (!processedEquipment.created_by || !isValidUuid(processedEquipment.created_by)) {
    throw new Error('Valid creator ID is required');
  }
  
  // Ensure no attributes field is included in the database insert
  const { attributes, ...equipmentDataForDb } = processedEquipment;
  
  // Additional data cleaning with more robust checks
  const cleanedData = {
    ...equipmentDataForDb,
    org_id: equipmentDataForDb.org_id.trim(),
    name: equipmentDataForDb.name.trim(),
    // Handle empty strings for optional fields
    model: equipmentDataForDb.model?.trim() || null,
    serial_number: equipmentDataForDb.serial_number?.trim() || null,
    manufacturer: equipmentDataForDb.manufacturer?.trim() || null,
    location: equipmentDataForDb.location?.trim() || null,
    notes: equipmentDataForDb.notes?.trim() || null,
    // Handle team_id - convert empty string to null and validate if present
    team_id: equipmentDataForDb.team_id && equipmentDataForDb.team_id.trim() !== '' 
      ? (isValidUuid(equipmentDataForDb.team_id.trim()) ? equipmentDataForDb.team_id.trim() : null)
      : null
  };
  
  // Final validation of cleaned data
  if (!cleanedData.org_id || !isValidUuid(cleanedData.org_id)) {
    throw new Error('Invalid organization ID after cleaning. Please refresh the page and try again.');
  }
  
  if (!cleanedData.name) {
    throw new Error('Equipment name is required after cleaning');
  }
  
  console.log('Cleaned data for database insert:', cleanedData);
  
  const { data, error } = await supabase
    .from('equipment')
    .insert(cleanedData)
    .select()
    .single();
    
  if (error) {
    console.error('Error creating equipment:', error);
    
    // More user-friendly error message for RLS failures
    if (error.message?.includes('new row violates row-level security policy')) {
      throw new Error('Permission denied: You do not have permission to create equipment in this organization');
    }
    
    // Handle organization not found errors
    if (error.message?.includes('violates foreign key constraint') && 
        error.message?.includes('org_id')) {
      throw new Error('Invalid organization selected. Please select a valid organization and try again.');
    }
    
    // Handle user ID constraint errors
    if (error.message?.includes('violates foreign key constraint') && 
        error.message?.includes('created_by')) {
      throw new Error('User authentication error. Please sign out and sign back in.');
    }
    
    throw new Error(`Failed to create equipment: ${error.message}`);
  }
  
  return data as Equipment;
}
