
// Helper functions for equipment access validation
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

/**
 * Check if a user has access to a piece of equipment
 */
export async function validateEquipmentAccess(userId: string, equipmentId: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data, error } = await supabase.rpc('can_access_equipment', {
    p_uid: userId,
    p_equipment_id: equipmentId
  });
  
  if (error) {
    console.error('Error checking equipment access:', error);
    throw error;
  }
  
  return !!data;
}

/**
 * Check if a user has edit permissions for a piece of equipment
 */
export async function validateEquipmentEditAccess(userId: string, equipmentId: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data, error } = await supabase.rpc('can_edit_equipment', {
    p_uid: userId,
    p_equipment_id: equipmentId
  });
  
  if (error) {
    console.error('Error checking equipment edit access:', error);
    throw error;
  }
  
  return !!data;
}
