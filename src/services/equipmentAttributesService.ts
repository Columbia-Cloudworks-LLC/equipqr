
import { supabase } from "@/integrations/supabase/client";
import { EquipmentAttribute } from "@/types";

/**
 * Creates or updates multiple attributes for an equipment
 */
export async function saveEquipmentAttributes(
  equipmentId: string, 
  attributes: EquipmentAttribute[]
): Promise<EquipmentAttribute[]> {
  if (!attributes.length) return [];
  
  try {
    // Get existing attributes to determine which to update/create/delete
    const { data: existingAttributes } = await supabase
      .from('equipment_attributes')
      .select('*')
      .eq('equipment_id', equipmentId);
    
    const existing = existingAttributes || [];
    
    // Process updates & new attributes
    for (const attr of attributes) {
      if (attr.id) {
        // Update existing attribute
        await supabase
          .from('equipment_attributes')
          .update({
            key: attr.key,
            value: attr.value,
            updated_at: new Date().toISOString()
          })
          .eq('id', attr.id);
      } else {
        // Add new attribute
        await supabase
          .from('equipment_attributes')
          .insert({
            equipment_id: equipmentId,
            key: attr.key,
            value: attr.value
          });
      }
    }
    
    // Delete attributes not in the updated list
    const updatedIds = attributes.filter(a => a.id).map(a => a.id);
    const toDelete = existing.filter(a => !updatedIds.includes(a.id));
    
    if (toDelete.length > 0) {
      await supabase
        .from('equipment_attributes')
        .delete()
        .in('id', toDelete.map(a => a.id));
    }
    
    // Return the updated attributes
    const { data: updatedAttributes } = await supabase
      .from('equipment_attributes')
      .select('*')
      .eq('equipment_id', equipmentId);
      
    return updatedAttributes || [];
  } catch (error) {
    console.error('Error in saveEquipmentAttributes:', error);
    throw error;
  }
}

/**
 * Get all attributes for an equipment
 */
export async function getEquipmentAttributes(equipmentId: string): Promise<EquipmentAttribute[]> {
  const { data, error } = await supabase
    .from('equipment_attributes')
    .select('*')
    .eq('equipment_id', equipmentId)
    .order('key');
    
  if (error) {
    console.error('Error fetching equipment attributes:', error);
    throw error;
  }
  
  return data || [];
}
