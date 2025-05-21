
import { supabase } from '@/integrations/supabase/client';
import { Equipment, CreateEquipmentParams, EquipmentAttribute } from '@/types';

export interface CreateResponse {
  success: boolean;
  equipment?: Equipment;
  error?: string;
}

/**
 * Create a new equipment record
 */
export async function createEquipment(params: CreateEquipmentParams): Promise<CreateResponse> {
  try {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Authentication required');
    }
    
    // Prepare equipment data, ensuring correct types for fields
    const equipmentData = {
      name: params.name,
      org_id: params.org_id,
      model: params.model || null,
      serial_number: params.serial_number || null,
      manufacturer: params.manufacturer || null,
      status: params.status || 'active', 
      location: params.location || null,
      install_date: params.install_date || null,
      warranty_expiration: params.warranty_expiration || null,
      notes: params.notes || null,
      team_id: params.team_id === 'none' ? null : params.team_id,
      created_by: session.user.id
    };
    
    // Insert equipment
    const { data: equipment, error } = await supabase
      .from('equipment')
      .insert(equipmentData)
      .select()
      .single();
      
    if (error) {
      console.error('Error creating equipment:', error);
      return { 
        success: false, 
        error: `Failed to create equipment: ${error.message}` 
      };
    }

    // Insert attributes if any
    if (params.attributes && params.attributes.length > 0) {
      const attributesWithEquipmentId = params.attributes.map(attr => ({
        equipment_id: equipment.id,
        key: attr.key,
        value: attr.value || ''
      }));

      const { error: attrError } = await supabase
        .from('equipment_attributes')
        .insert(attributesWithEquipmentId);
        
      if (attrError) {
        console.warn('Error saving attributes:', attrError);
        // Continue anyway since the main equipment was created
      }
    }

    return {
      success: true,
      equipment
    };
  } catch (error: any) {
    console.error('Error in createEquipment:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to create equipment' 
    };
  }
}
