
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/types";

/**
 * Insert equipment into the database
 * @param processedEquipment - The processed equipment data (without attributes field)
 * @returns The created equipment record
 */
export async function insertEquipment(processedEquipment: any) {
  console.log('Creating equipment with data:', processedEquipment);
  
  // Ensure no attributes field is included in the database insert
  const { attributes, ...equipmentDataForDb } = processedEquipment;
  
  const { data, error } = await supabase
    .from('equipment')
    .insert(equipmentDataForDb)
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
  
  return data as Equipment;
}
