
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from '@/types';
import { EquipmentFormValues, CreateEquipmentParams } from '@/types/equipment';
import { saveEquipmentAttributes } from './attributesService';
import { fallbackPermissionCheck } from './permissions';

/**
 * Create a new equipment record
 */
export async function createEquipment(
  equipment: EquipmentFormValues,
  userId: string,
  orgId: string
): Promise<{ success: boolean; equipment?: Equipment; error?: string }> {
  try {
    if (!equipment || !userId || !orgId) {
      throw new Error('Missing required parameters');
    }
    
    // Check if user has permission to create equipment for this org
    const hasPermission = await fallbackPermissionCheck(null, orgId);
    
    if (!hasPermission) {
      throw new Error('You do not have permission to create equipment for this organization');
    }
    
    // Extract attributes for separate insertion
    const attributes = equipment.attributes || [];
    const equipmentInput = { ...equipment };
    delete equipmentInput.attributes;
    
    // Create the equipment record
    const { data: newEquipment, error } = await supabase
      .from('equipment')
      .insert({
        ...equipmentInput,
        created_by: userId,
        org_id: orgId
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating equipment:', error);
      throw new Error(`Failed to create equipment: ${error.message}`);
    }
    
    if (!newEquipment) {
      throw new Error('Failed to create equipment: No data returned');
    }
    
    // Create attributes if any
    if (attributes.length > 0) {
      await saveEquipmentAttributes(newEquipment.id, attributes);
    }
    
    return {
      success: true,
      equipment: newEquipment
    };
  } catch (error: any) {
    console.error('Error in createEquipment:', error);
    return {
      success: false,
      error: error.message || 'Failed to create equipment'
    };
  }
}
