
import { supabase } from '@/integrations/supabase/client';
import { CreateEquipmentParams } from '@/types/equipment';
import { EquipmentStatus } from '@/types/supabase-enums';

// Function to create equipment - make sure it accepts the correct type
export async function createEquipment(params: CreateEquipmentParams) {
  try {
    // Create a processed object with specific status values for DB compatibility
    const processedParams = {
      ...params,
      // Explicitly map to one of the allowed string literals that Supabase expects
      status: mapToAllowedStatus(params.status as EquipmentStatus)
    };

    console.log('Processed params for equipment creation:', processedParams);

    // Fixed: Don't wrap object in array for single insert
    const { data, error } = await supabase
      .from('equipment')
      .insert(processedParams) // No array wrapper here
      .select()
      .single();

    if (error) {
      console.error("Error creating equipment:", error);
      throw new Error(error.message);
    }

    return { equipment: data, error: null };
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
