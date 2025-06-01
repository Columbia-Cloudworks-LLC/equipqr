
import { CreateEquipmentParams } from '@/types/equipment';
import { EquipmentStatus } from '@/types/supabase-enums';
import { saveEquipmentAttributes } from './attributesService';
import { insertEquipment } from './db/equipmentDbService';

// Function to create equipment - uses auth.users.id directly for created_by
export async function createEquipment(params: CreateEquipmentParams) {
  try {
    console.log('Creating equipment with params:', params);

    // Ensure created_by is provided - this should be auth.users.id
    if (!params.created_by) {
      throw new Error('created_by field is required and must be auth.users.id');
    }

    // Extract attributes before processing equipment data
    const attributes = params.attributes || [];
    
    // Remove attributes from the equipment data since it's not a database column
    const { attributes: _, ...equipmentDataWithoutAttributes } = params;

    // Create a processed object with specific status values for DB compatibility
    const processedParams = {
      ...equipmentDataWithoutAttributes,
      // Explicitly map to one of the allowed string literals that Supabase expects
      status: mapToAllowedStatus(params.status as EquipmentStatus),
      // Use the auth.users.id directly - no mapping needed
      created_by: params.created_by
    };

    console.log('Processed params for equipment creation with auth.users.id:', processedParams);

    // Insert the equipment record using the database service
    const createdEquipment = await insertEquipment(processedParams);

    // After successfully creating equipment, save attributes if any exist
    if (attributes.length > 0 && createdEquipment.id) {
      try {
        await saveEquipmentAttributes(createdEquipment.id, attributes);
        console.log('Successfully saved equipment attributes');
      } catch (attributesError) {
        console.error('Error saving equipment attributes:', attributesError);
        // Note: We don't throw here because the equipment was successfully created
        // The attributes failure is logged but doesn't fail the entire operation
      }
    }

    return { equipment: createdEquipment, error: null };
  } catch (error: any) {
    console.error("Error creating equipment:", error);
    return { equipment: null, error: error.message };
  }
}

// Helper function to ensure status is one of the allowed values expected by Supabase
function mapToAllowedStatus(status: EquipmentStatus): 'active' | 'inactive' | 'maintenance' {
  // This maps any EquipmentStatus to the three specific values Supabase will accept
  // If the database schema eventually gets updated to support all enum values, this can be removed
  switch (status) {
    case 'active':
      return 'active';
    case 'inactive':
      return 'inactive';
    case 'maintenance':
      return 'maintenance';
    case 'storage':
    case 'retired':
      // Map these to 'inactive' as a fallback since they're not in the accepted list
      return 'inactive';
    default:
      return 'active'; // Default fallback
  }
}
