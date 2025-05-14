
// Equipment access helper functions can be added here
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

/**
 * Check if a user has access to view an equipment record
 */
export async function checkEquipmentAccess(
  userId: string, 
  equipmentId: string, 
  supabase?: ReturnType<typeof createClient>
) {
  try {
    // Use provided supabase client or create a new one
    const client = supabase || createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Call our updated function that avoids recursion
    const { data, error } = await client.rpc(
      'can_access_equipment',
      { 
        p_uid: userId, 
        p_equipment_id: equipmentId 
      }
    );

    if (error) {
      console.error('Error checking equipment access:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Exception in checkEquipmentAccess:', error);
    return false;
  }
}

/**
 * Check if a user has permission to edit an equipment record
 */
export async function checkEquipmentEditAccess(
  userId: string, 
  equipmentId: string, 
  supabase?: ReturnType<typeof createClient>
) {
  try {
    // Use provided supabase client or create a new one
    const client = supabase || createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Call the can_edit_equipment function
    const { data, error } = await client.rpc(
      'can_edit_equipment',
      { 
        p_uid: userId, 
        p_equipment_id: equipmentId 
      }
    );

    if (error) {
      console.error('Error checking equipment edit access:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Exception in checkEquipmentEditAccess:', error);
    return false;
  }
}
