
// Equipment access helper functions using our optimized DB functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

/**
 * Check if a user has access to view an equipment record
 * Uses our optimized non-recursive functions
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
    
    // Use our optimized RPC function
    const { data, error } = await client.rpc(
      'rpc_check_equipment_permission',
      { 
        user_id: userId, 
        action: 'view',
        equipment_id: equipmentId
      }
    );

    if (error) {
      console.error('Error checking equipment access:', error);
      return false;
    }

    return data?.has_permission || false;
  } catch (error) {
    console.error('Exception in checkEquipmentAccess:', error);
    return false;
  }
}

/**
 * Check if a user has permission to edit an equipment record
 * Uses our optimized non-recursive functions
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
    
    // Use our optimized RPC function
    const { data, error } = await client.rpc(
      'rpc_check_equipment_permission',
      { 
        user_id: userId, 
        action: 'edit',
        equipment_id: equipmentId
      }
    );

    if (error) {
      console.error('Error checking equipment edit access:', error);
      return false;
    }

    return data?.has_permission || false;
  } catch (error) {
    console.error('Exception in checkEquipmentEditAccess:', error);
    return false;
  }
}
