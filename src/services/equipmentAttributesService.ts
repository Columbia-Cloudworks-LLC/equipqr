
import { supabase } from "@/integrations/supabase/client";
import { EquipmentAttribute } from "@/types";

/**
 * Get attributes for a specific equipment
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
    
    return data as EquipmentAttribute[];
  } catch (error) {
    console.error('Error in getEquipmentAttributes:', error);
    throw error;
  }
}

/**
 * Save equipment attributes (create new ones, update existing ones, delete removed ones)
 */
export async function saveEquipmentAttributes(
  equipmentId: string,
  attributes: EquipmentAttribute[]
): Promise<EquipmentAttribute[]> {
  try {
    // Get existing attributes
    const { data: existingAttributes, error: fetchError } = await supabase
      .from('equipment_attributes')
      .select('*')
      .eq('equipment_id', equipmentId);

    if (fetchError) {
      console.error('Error fetching existing attributes:', fetchError);
      throw fetchError;
    }

    // Filter out attributes with empty keys
    const validAttributes = attributes.filter(attr => attr.key.trim() !== '');
    
    console.log('Valid attributes to save:', validAttributes);
    console.log('Existing attributes:', existingAttributes);
    
    // Handle create, update, delete operations as needed
    const attributesToCreate: EquipmentAttribute[] = [];
    const attributesToUpdate: EquipmentAttribute[] = [];
    const existingIds = new Set();

    // Sort attributes into update and create categories
    validAttributes.forEach(attr => {
      // If it has an ID, it might be an update
      if (attr.id) {
        // Check if the ID actually exists in the database
        const exists = existingAttributes?.some(existing => existing.id === attr.id);
        if (exists) {
          attributesToUpdate.push(attr);
          existingIds.add(attr.id);
        } else {
          // ID is invalid, treat as new attribute
          const { id, ...restAttr } = attr;
          attributesToCreate.push({
            ...restAttr,
            equipment_id: equipmentId
          });
        }
      } else {
        // No ID, definitely a new attribute
        attributesToCreate.push({
          ...attr,
          equipment_id: equipmentId
        });
      }
    });

    // Find attributes to delete (existing but not in the incoming list)
    const attributesToDelete = existingAttributes
      ?.filter(attr => !existingIds.has(attr.id))
      .map(attr => attr.id) || [];

    // Handle creations
    if (attributesToCreate.length > 0) {
      console.log('Creating attributes:', attributesToCreate);
      const { error: createError } = await supabase
        .from('equipment_attributes')
        .insert(attributesToCreate);

      if (createError) {
        console.error('Error creating attributes:', createError);
        throw createError;
      }
    }

    // Handle updates
    for (const attr of attributesToUpdate) {
      console.log('Updating attribute:', attr);
      const { error: updateError } = await supabase
        .from('equipment_attributes')
        .update({ key: attr.key, value: attr.value })
        .eq('id', attr.id);

      if (updateError) {
        console.error(`Error updating attribute ${attr.id}:`, updateError);
        throw updateError;
      }
    }

    // Handle deletions
    if (attributesToDelete.length > 0) {
      console.log('Deleting attributes:', attributesToDelete);
      const { error: deleteError } = await supabase
        .from('equipment_attributes')
        .delete()
        .in('id', attributesToDelete);

      if (deleteError) {
        console.error('Error deleting attributes:', deleteError);
        throw deleteError;
      }
    }

    // Get the updated list of attributes
    const { data: updatedAttributes, error: finalFetchError } = await supabase
      .from('equipment_attributes')
      .select('*')
      .eq('equipment_id', equipmentId);

    if (finalFetchError) {
      console.error('Error fetching updated attributes:', finalFetchError);
      throw finalFetchError;
    }

    return updatedAttributes as EquipmentAttribute[];
  } catch (error) {
    console.error('Error in saveEquipmentAttributes:', error);
    throw error;
  }
}
