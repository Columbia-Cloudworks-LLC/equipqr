
import { supabase } from '@/integrations/supabase/client';
import { Equipment, EquipmentAttribute, CreateEquipmentParams } from '@/types/equipment';
import { EquipmentStatus } from '@/types/supabase-enums';

export async function createEquipment(params: CreateEquipmentParams): Promise<{
  success: boolean;
  equipment?: Equipment;
  error?: string;
}> {
  try {
    // Get current user session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      return { success: false, error: 'Authentication required' };
    }

    const userId = sessionData.session.user.id;
    
    // Check if user has permission to create equipment
    const { data: permission, error: permissionError } = await supabase.rpc(
      'can_create_equipment_safe',
      { 
        p_user_id: userId, 
        p_team_id: params.team_id || null
      }
    );
    
    if (permissionError) {
      return { 
        success: false, 
        error: `Permission check failed: ${permissionError.message}` 
      };
    }
    
    if (!permission) {
      return { 
        success: false, 
        error: `You don't have permission to create equipment` 
      };
    }

    // Prepare equipment data with proper typing
    const equipmentData = {
      name: params.name,
      org_id: params.org_id,
      team_id: params.team_id || null,
      status: (params.status || 'active') as EquipmentStatus,
      location: params.location || null,
      manufacturer: params.manufacturer || null,
      model: params.model || null,
      serial_number: params.serial_number || null,
      notes: params.notes || null,
      install_date: params.install_date || null,
      warranty_expiration: params.warranty_expiration || null,
      created_by: userId
    };

    // Insert equipment with proper typing
    const { data: equipmentResult, error: equipmentError } = await supabase
      .from('equipment')
      .insert(equipmentData)
      .select()
      .single();

    if (equipmentError) {
      return { 
        success: false, 
        error: `Failed to create equipment: ${equipmentError.message}` 
      };
    }

    // Insert attributes if any
    if (params.attributes && params.attributes.length > 0) {
      const attributesWithEquipmentId = params.attributes.map(attr => ({
        equipment_id: equipmentResult.id,
        key: attr.key,
        value: attr.value
      }));

      const { error: attrError } = await supabase
        .from('equipment_attributes')
        .insert(attributesWithEquipmentId);

      if (attrError) {
        console.error('Failed to add equipment attributes:', attrError);
      }
    }

    return {
      success: true,
      equipment: equipmentResult
    };
  } catch (error: any) {
    console.error('Error creating equipment:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
}
