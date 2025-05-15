
import { supabase } from "@/integrations/supabase/client";
import { EquipmentAttribute } from "@/types";

/**
 * Get attributes for a specific equipment item
 */
export async function getEquipmentAttributes(equipmentId: string): Promise<EquipmentAttribute[]> {
  try {
    console.log('Fetching attributes for equipment:', equipmentId);
    
    const { data, error } = await supabase
      .from('equipment_attributes')
      .select('*')
      .eq('equipment_id', equipmentId);
      
    if (error) {
      console.error('Error fetching equipment attributes:', error);
      throw error;
    }
    
    console.log(`Found ${data?.length || 0} attributes for equipment ${equipmentId}:`, data);
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
      (existingAttributes || []).map(attr => [attr.id, attr])
    );
    
    // Attributes to delete (exist in DB but not in new set)
    const toDelete = (existingAttributes || [])
      .filter(attr => !attributes.some(newAttr => newAttr.id === attr.id))
      .map(attr => attr.id);
    
    // Attributes to update (exist in both DB and new set)
    const toUpdate = attributes
      .filter(attr => attr.id && existingMap.has(attr.id))
      .map(attr => ({
        id: attr.id,
        key: attr.key,
        value: attr.value,
      }));
    
    // Attributes to insert (in new set but not in DB)
    const toInsert = attributes
      .filter(attr => !attr.id || !existingMap.has(attr.id))
      .map(attr => ({
        equipment_id: equipmentId,
        key: attr.key,
        value: attr.value,
      }));
    
    console.log('Attributes processing:', {
      toDelete: toDelete.length,
      toUpdate: toUpdate.length,
      toInsert: toInsert.length
    });
    
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
        .update({ key: attr.key, value: attr.value })
        .eq('id', attr.id);
        
      if (updateError) {
        console.error(`Error updating equipment attribute ${attr.id}:`, updateError);
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
    
    console.log('Updated equipment attributes:', updatedAttributes);
    return updatedAttributes || [];
  } catch (error) {
    console.error('Error in saveEquipmentAttributes:', error);
    throw error;
  }
}
