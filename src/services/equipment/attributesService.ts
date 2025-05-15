
import { supabase } from "@/integrations/supabase/client";
import { EquipmentAttribute } from "@/types";

/**
 * Get attributes for a specific equipment item
 */
export async function getEquipmentAttributes(equipmentId: string): Promise<EquipmentAttribute[]> {
  try {
    const { data, error } = await supabase
      .from('equipment_attributes')
      .select('*')
      .eq('equipment_id', equipmentId);
      
    if (error) {
      console.error('Error fetching equipment attributes:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getEquipmentAttributes:', error);
    return [];
  }
}

/**
 * Save or update attributes for a specific equipment item
 */
export async function saveEquipmentAttributes(
  equipmentId: string, 
  attributes: EquipmentAttribute[]
): Promise<EquipmentAttribute[]> {
  try {
    if (!equipmentId || !attributes || attributes.length === 0) {
      return [];
    }
    
    // First, get existing attributes to determine what to update/delete/insert
    const { data: existingAttributes, error: fetchError } = await supabase
      .from('equipment_attributes')
      .select('*')
      .eq('equipment_id', equipmentId);
      
    if (fetchError) {
      console.error('Error fetching existing equipment attributes:', fetchError);
      throw fetchError;
    }
    
    // Prepare maps for easy lookup
    const existingMap = new Map(
      (existingAttributes || []).map(attr => [attr.key, attr])
    );
    
    const newMap = new Map(
      attributes.map(attr => [attr.key, attr])
    );
    
    // Attributes to delete (exist in DB but not in new set)
    const toDelete = (existingAttributes || [])
      .filter(attr => !newMap.has(attr.key))
      .map(attr => attr.id);
    
    // Attributes to update (exist in both DB and new set)
    const toUpdate = attributes
      .filter(attr => existingMap.has(attr.key) && existingMap.get(attr.key)?.value !== attr.value)
      .map(attr => ({
        id: existingMap.get(attr.key)?.id,
        value: attr.value,
      }));
    
    // Attributes to insert (in new set but not in DB)
    const toInsert = attributes
      .filter(attr => !existingMap.has(attr.key))
      .map(attr => ({
        equipment_id: equipmentId,
        key: attr.key,
        value: attr.value,
      }));
    
    // Perform delete operations if needed
    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('equipment_attributes')
        .delete()
        .in('id', toDelete);
        
      if (deleteError) {
        console.error('Error deleting equipment attributes:', deleteError);
        throw deleteError;
      }
    }
    
    // Perform update operations if needed
    for (const attr of toUpdate) {
      const { error: updateError } = await supabase
        .from('equipment_attributes')
        .update({ value: attr.value })
        .eq('id', attr.id);
        
      if (updateError) {
        console.error('Error updating equipment attribute:', updateError);
        throw updateError;
      }
    }
    
    // Perform insert operations if needed
    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('equipment_attributes')
        .insert(toInsert);
        
      if (insertError) {
        console.error('Error inserting equipment attributes:', insertError);
        throw insertError;
      }
    }
    
    // Return the updated list of attributes
    const { data: updatedAttributes, error: refetchError } = await supabase
      .from('equipment_attributes')
      .select('*')
      .eq('equipment_id', equipmentId);
      
    if (refetchError) {
      console.error('Error refetching equipment attributes:', refetchError);
      throw refetchError;
    }
    
    return updatedAttributes || [];
  } catch (error) {
    console.error('Error in saveEquipmentAttributes:', error);
    throw error;
  }
}
