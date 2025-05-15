
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/types";
import { processDateFields } from "@/utils/authUtils";

/**
 * Update equipment record in the database
 * @param id - Equipment ID
 * @param processedEquipment - Processed equipment data
 * @returns Updated equipment record
 */
export async function updateEquipmentInDb(id: string, processedEquipment: any): Promise<Equipment> {
  console.log('Updating equipment in database, ID:', id);
  
  const { data, error } = await supabase
    .from('equipment')
    .update(processedEquipment)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating equipment in database:', error);
    if (error.code === '42501') {
      // Permission denied error code
      throw new Error('Permission denied: You do not have sufficient privileges to update this equipment');
    }
    throw error;
  }
  
  return data as Equipment;
}

/**
 * Process equipment data for update
 * @param equipmentData - Equipment data to process
 * @returns Processed equipment data ready for database update
 */
export function prepareEquipmentForUpdate(equipmentData: Partial<Equipment>): any {
  // Handle 'none' value for team_id
  if (equipmentData.team_id === 'none') {
    equipmentData.team_id = null;
  }
  
  // Process dates and prepare data
  return processDateFields({
    ...equipmentData,
    updated_at: new Date().toISOString(),
  }, ['install_date', 'warranty_expiration']);
}
