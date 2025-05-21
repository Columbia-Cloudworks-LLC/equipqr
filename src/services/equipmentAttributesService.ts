
import { supabase } from '@/integrations/supabase/client';
import { EquipmentAttribute } from '@/types';

/**
 * Get all attributes for an equipment item
 * @param equipmentId ID of the equipment
 */
export async function getEquipmentAttributes(equipmentId: string): Promise<EquipmentAttribute[]> {
  try {
    const { data, error } = await supabase
      .from('equipment_attributes')
      .select('*')
      .eq('equipment_id', equipmentId);

    if (error) {
      throw new Error(`Error fetching attributes: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error getting equipment attributes:', error);
    throw error;
  }
}

/**
 * Add new attribute to an equipment item
 * @param equipmentId ID of the equipment
 * @param key Attribute key
 * @param value Attribute value
 */
export async function addEquipmentAttribute(
  equipmentId: string,
  key: string,
  value: string
): Promise<EquipmentAttribute> {
  try {
    const newAttribute = {
      equipment_id: equipmentId,
      key: key,
      value: value
    };

    const { data, error } = await supabase
      .from('equipment_attributes')
      .insert([newAttribute])
      .select()
      .single();

    if (error) {
      throw new Error(`Error adding attribute: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error adding equipment attribute:', error);
    throw error;
  }
}

/**
 * Update an existing attribute
 * @param attributeId ID of the attribute to update
 * @param key New key
 * @param value New value
 */
export async function updateEquipmentAttribute(
  attributeId: string,
  key: string,
  value: string
): Promise<EquipmentAttribute> {
  try {
    const { data, error } = await supabase
      .from('equipment_attributes')
      .update({ key, value, updated_at: new Date().toISOString() })
      .eq('id', attributeId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating attribute: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error updating equipment attribute:', error);
    throw error;
  }
}

/**
 * Delete an attribute
 * @param attributeId ID of the attribute to delete
 */
export async function deleteEquipmentAttribute(attributeId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('equipment_attributes')
      .delete()
      .eq('id', attributeId);

    if (error) {
      throw new Error(`Error deleting attribute: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting equipment attribute:', error);
    throw error;
  }
}

/**
 * Creates a new attribute for equipment
 */
export async function createEquipmentAttribute(
  equipmentId: string,
  key: string,
  value: string
): Promise<EquipmentAttribute> {
  try {
    const attributeData = {
      id: crypto.randomUUID(), // Ensure there's an ID
      equipment_id: equipmentId,
      key: key,
      value: value,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('equipment_attributes')
      .insert(attributeData)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating attribute: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error creating equipment attribute:', error);
    throw error;
  }
}
