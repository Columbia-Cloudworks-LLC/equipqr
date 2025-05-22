import { supabase } from '@/integrations/supabase/client';
import { CreateEquipmentParams } from '@/types/equipment';
import { EquipmentStatus } from '@/types/supabase-enums';

// Function to create equipment - make sure it accepts the correct type
export async function createEquipment(params: CreateEquipmentParams) {
  // Convert string status to EquipmentStatus if needed
  const processedParams = {
    ...params,
    status: params.status as EquipmentStatus
  };

  try {
    const { data, error } = await supabase
      .from('equipment')
      .insert([processedParams])
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
