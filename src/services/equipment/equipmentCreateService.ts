
import { supabase } from '@/integrations/supabase/client';
import { Equipment } from '@/types';
import { EquipmentFormValues, CreateEquipmentParams } from '@/types/equipment';

export async function createEquipment(params: CreateEquipmentParams): Promise<{ 
  success: boolean; 
  equipment?: Equipment;
  error?: string;
}> {
  try {
    const { equipment, userId, orgId } = params;

    if (!equipment.name || !equipment.status || !orgId || !userId) {
      throw new Error('Required fields missing: name, status, organization, and user ID');
    }

    // Validate equipment status is one of the allowed values
    const validStatuses = ['active', 'inactive', 'maintenance'];
    if (!validStatuses.includes(equipment.status)) {
      throw new Error('Invalid status value. Must be one of: active, inactive, maintenance');
    }

    // Create new equipment record
    const { data, error } = await supabase
      .from('equipment')
      .insert({
        created_by: userId,
        org_id: orgId,
        name: equipment.name,
        description: equipment.description,
        serial_number: equipment.serial_number,
        model: equipment.model,
        manufacturer: equipment.manufacturer,
        status: equipment.status as 'active' | 'inactive' | 'maintenance',
        location: equipment.location,
        purchase_date: equipment.purchase_date,
        install_date: equipment.install_date,
        warranty_expiration: equipment.warranty_expiration,
        notes: equipment.notes,
        team_id: equipment.team_id || null
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create equipment: ${error.message}`);
    }

    const createdEquipment = data as Equipment;

    // If attributes exist, create them as well
    if (equipment.attributes && equipment.attributes.length > 0) {
      const attributeRecords = equipment.attributes.map(attr => ({
        equipment_id: createdEquipment.id,
        key: attr.key,
        value: attr.value || null
      }));

      const { error: attrError } = await supabase
        .from('equipment_attributes')
        .insert(attributeRecords);

      if (attrError) {
        console.error('Failed to create equipment attributes:', attrError);
        // Don't throw, just log - we still created the equipment
      }
    }

    return {
      success: true,
      equipment: createdEquipment
    };
  } catch (error: any) {
    console.error('Error creating equipment:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while creating equipment'
    };
  }
}
