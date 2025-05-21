
import { supabase } from '@/integrations/supabase/client';
import { Equipment, EquipmentAttribute, CreateEquipmentParams } from '@/types/equipment';
import { processAttributes } from './utils/dataProcessing';

/**
 * Create a new equipment record
 */
export async function createEquipment(params: CreateEquipmentParams): Promise<{ success: boolean; equipment?: Equipment; error?: string }> {
  try {
    // Validate inputs
    if (!params.name) {
      throw new Error('Equipment name is required');
    }

    if (!params.org_id) {
      throw new Error('Organization ID is required');
    }

    // Get the current user's ID
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw new Error(`Authentication required: ${sessionError.message}`);
    }

    const userId = session?.session?.user?.id;
    if (!userId) {
      throw new Error('Authentication required');
    }

    // Process optional fields
    const equipmentData = {
      name: params.name,
      org_id: params.org_id,
      team_id: params.team_id === 'none' ? null : params.team_id,
      status: params.status || 'active',
      location: params.location,
      manufacturer: params.manufacturer,
      model: params.model,
      serial_number: params.serial_number,
      notes: params.notes,
      install_date: params.install_date || null,
      warranty_expiration: params.warranty_expiration || null,
      created_by: userId
    };

    // Create the equipment record
    const { data: equipment, error: createError } = await supabase
      .from('equipment')
      .insert(equipmentData)
      .select('*')
      .single();

    if (createError) {
      throw new Error(`Failed to create equipment: ${createError.message}`);
    }

    // Process and save attributes if any
    if (params.attributes && params.attributes.length > 0) {
      const { error: attrError } = await processAttributes(params.attributes, equipment.id);
      if (attrError) {
        console.error('Error saving equipment attributes:', attrError);
      }
    }

    return {
      success: true,
      equipment
    };
  } catch (error: any) {
    console.error('Error creating equipment:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
}
