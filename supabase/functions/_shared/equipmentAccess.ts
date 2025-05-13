
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// Helper function to check if a user can access an equipment item
export async function canAccessEquipment(userId: string, equipmentId: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required environment variables for Supabase client');
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data, error } = await supabase.rpc('can_access_equipment', {
    p_uid: userId,
    p_equipment_id: equipmentId
  });
  
  if (error) {
    console.error('Error checking equipment access:', error);
    return false;
  }
  
  return data === true;
}

// Helper function to check if a user can edit an equipment item
export async function canEditEquipment(userId: string, equipmentId: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required environment variables for Supabase client');
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data, error } = await supabase.rpc('can_edit_equipment', {
    p_uid: userId,
    p_equipment_id: equipmentId
  });
  
  if (error) {
    console.error('Error checking equipment edit permission:', error);
    return false;
  }
  
  return data === true;
}
