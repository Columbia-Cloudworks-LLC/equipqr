
import { supabase } from "@/integrations/supabase/client";
import { EquipmentAttribute } from "@/types";

/**
 * Get attributes for a specific equipment
 * @param equipmentId The ID of the equipment
 * @returns An array of equipment attributes
 */
export async function getEquipmentAttributes(equipmentId: string): Promise<EquipmentAttribute[]> {
  try {
    if (!equipmentId) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('equipment_attributes')
      .select('*')
      .eq('equipment_id', equipmentId);
      
    if (error) {
      console.error('Error fetching equipment attributes:', error);
      return [];
    }
    
    return data as EquipmentAttribute[];
  } catch (error) {
    console.error('Error in getEquipmentAttributes:', error);
    return [];
  }
}

/**
 * Save attributes for a specific equipment
 * This handles both creating new attributes and updating existing ones
 * @param equipmentId The ID of the equipment
 * @param attributes The attributes to save
 * @returns An array of the saved equipment attributes
 */
export async function saveEquipmentAttributes(
  equipmentId: string,
  attributes: EquipmentAttribute[]
): Promise<EquipmentAttribute[]> {
  try {
    if (!equipmentId || attributes.length === 0) {
      return [];
    }
    
    console.log('Saving attributes for equipment:', equipmentId);
    console.log('Attributes to save:', attributes);
    
    // Get existing attributes
    const existingAttrs = await getEquipmentAttributes(equipmentId);
    
    // Prepare arrays for operations
    const toUpdate: EquipmentAttribute[] = [];
    const toInsert: { equipment_id: string; key: string; value?: string }[] = [];
    const existingIds = new Set();
    
    // Determine which attributes to update vs. insert
    attributes.forEach(attr => {
      if (!attr.key) return; // Skip attributes with no key
      
      const existing = existingAttrs.find(e => e.id === attr.id || e.key === attr.key);
      
      if (existing) {
        // Only add to update if the value has changed
        if (existing.value !== attr.value) {
          toUpdate.push({
            ...existing,
            value: attr.value,
            updated_at: new Date().toISOString()
          });
        }
        existingIds.add(existing.id);
      } else {
        // New attribute - ensuring required properties are present
        toInsert.push({
          equipment_id: equipmentId,
          key: attr.key,
          value: attr.value
        });
      }
    });
    
    // IDs of attributes to delete (ones that existed but weren't included in the new attributes)
    const toDeleteIds = existingAttrs
      .filter(attr => !existingIds.has(attr.id) && 
                      !attributes.some(a => a.key === attr.key))
      .map(attr => attr.id);
    
    console.log('Attributes to update:', toUpdate);
    console.log('Attributes to insert:', toInsert);
    console.log('Attributes to delete:', toDeleteIds);
    
    // Handle updates first
    if (toUpdate.length > 0) {
      const { error: updateError } = await supabase
        .from('equipment_attributes')
        .upsert(toUpdate);
        
      if (updateError) {
        console.error('Error updating equipment attributes:', updateError);
        throw updateError;
      }
    }
    
    // Then handle inserts
    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('equipment_attributes')
        .insert(toInsert);
        
      if (insertError) {
        console.error('Error inserting equipment attributes:', insertError);
        throw insertError;
      }
    }
    
    // Finally handle deletes
    if (toDeleteIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('equipment_attributes')
        .delete()
        .in('id', toDeleteIds);
        
      if (deleteError) {
        console.error('Error deleting equipment attributes:', deleteError);
        throw deleteError;
      }
    }
    
    // Fetch the updated attributes
    return await getEquipmentAttributes(equipmentId);
  } catch (error) {
    console.error('Error in saveEquipmentAttributes:', error);
    throw error;
  }
}

/**
 * Delete an equipment attribute
 * @param id The ID of the attribute to delete
 * @returns A boolean indicating success
 */
export async function deleteEquipmentAttribute(id: string): Promise<boolean> {
  try {
    if (!id) {
      return false;
    }
    
    const { error } = await supabase
      .from('equipment_attributes')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting equipment attribute:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteEquipmentAttribute:', error);
    return false;
  }
}
