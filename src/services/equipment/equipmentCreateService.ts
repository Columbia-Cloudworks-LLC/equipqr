
import { supabase } from '@/integrations/supabase/client';
import { CreateEquipmentParams } from '@/types/equipment';
import { EquipmentStatus } from '@/types/supabase-enums';

// Function to create equipment - make sure it accepts the correct type
export async function createEquipment(params: CreateEquipmentParams) {
  try {
    // Convert any string status to database-compatible format
    const processedParams = {
      ...params,
      // Ensure we're using the proper type for status
      status: params.status
    };

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
