
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
    throw new Error('Valid creator ID is required (must be auth.users.id)');
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
    asset_id: equipmentDataForDb.asset_id?.trim() || null,
    location_address: equipmentDataForDb.location_address?.trim() || null,
    location_coordinates: equipmentDataForDb.location_coordinates?.trim() || null,
    // Handle team_id - convert empty string to null and validate if present
    team_id: equipmentDataForDb.team_id && equipmentDataForDb.team_id.trim() !== '' 
      ? (isValidUuid(equipmentDataForDb.team_id.trim()) ? equipmentDataForDb.team_id.trim() : null)
      : null,
    // Ensure created_by is properly validated - this should be auth.users.id
    created_by: equipmentDataForDb.created_by.trim(),
    // Set default status if not provided
    status: equipmentDataForDb.status || 'active',
    // Set dates properly
    install_date: equipmentDataForDb.install_date || null,
    warranty_expiration: equipmentDataForDb.warranty_expiration || null
  };
  
  // Final validation of cleaned data
  if (!cleanedData.org_id || !isValidUuid(cleanedData.org_id)) {
    throw new Error('Invalid organization ID after cleaning. Please refresh the page and try again.');
  }
  
  if (!cleanedData.name) {
    throw new Error('Equipment name is required after cleaning');
  }
  
  if (!cleanedData.created_by || !isValidUuid(cleanedData.created_by)) {
    throw new Error('Invalid creator ID after cleaning. This should be the authenticated user ID.');
  }
  
  console.log('Cleaned data for database insert:', cleanedData);
  console.log('About to insert equipment with created_by (auth.users.id):', cleanedData.created_by);
  
  const { data, error } = await supabase
    .from('equipment')
    .insert(cleanedData)
    .select()
    .single();
    
  if (error) {
    console.error('Error creating equipment:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    
    // More user-friendly error message for RLS failures
    if (error.message?.includes('new row violates row-level security policy')) {
      throw new Error('Permission denied: You do not have permission to create equipment in this organization');
    }
    
    // Handle foreign key constraint errors with specific guidance
    if (error.message?.includes('violates foreign key constraint')) {
      if (error.message?.includes('created_by')) {
        console.error('Foreign key constraint failed for created_by field:', {
          provided_value: cleanedData.created_by,
          constraint_details: error.details
        });
        throw new Error('Authentication error: Your user session may be invalid. Please sign out and sign back in.');
      } else if (error.message?.includes('org_id')) {
        throw new Error('Invalid organization selected. Please select a valid organization and try again.');
      } else if (error.message?.includes('team_id')) {
        throw new Error('Invalid team selected. Please select a valid team or leave it unassigned.');
      } else {
        throw new Error('Database constraint error. Please check your data and try again.');
      }
    }
    
    // Handle specific constraint violations
    if (error.message?.includes('duplicate key value')) {
      throw new Error('Equipment with this information already exists. Please use different values.');
    }
    
    // Handle other database errors
    if (error.code === 'PGRST116') {
      throw new Error('Database connection error. Please try again in a moment.');
    }
    
    throw new Error(`Failed to create equipment: ${error.message}`);
  }
  
  console.log('Successfully created equipment with auth.users.id:', data);
  return data as Equipment;
}
