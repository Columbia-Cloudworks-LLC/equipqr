
import { supabase } from "@/integrations/supabase/client";

/**
 * Records a scan event for an equipment
 */
export async function recordScan(equipmentId: string, userId?: string): Promise<boolean> {
  const { error } = await supabase
    .from('scan_history')
    .insert({
      equipment_id: equipmentId,
      scanned_by_user_id: userId,
    });
    
  if (error) {
    console.error('Error recording scan:', error);
    throw error;
  }
  
  return true;
}

/**
 * Get scan history for an equipment
 */
export async function getScanHistory(equipmentId: string) {
  const { data, error } = await supabase
    .from('scan_history')
    .select(`
      *,
      user_profiles!scan_history_scanned_by_user_id_fkey(display_name)
    `)
    .eq('equipment_id', equipmentId)
    .order('ts', { ascending: false });
    
  if (error) {
    console.error('Error fetching scan history:', error);
    throw error;
  }
  
  return data || [];
}
