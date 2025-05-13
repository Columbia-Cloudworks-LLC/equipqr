
import { supabase } from "@/integrations/supabase/client";

/**
 * Record a scan event for an equipment
 * @param equipmentId The ID of the equipment that was scanned
 * @returns A boolean indicating success
 */
export async function recordScan(equipmentId: string): Promise<boolean> {
  try {
    if (!equipmentId) {
      return false;
    }
    
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    // Insert scan record
    const { error } = await supabase
      .from('scan_history')
      .insert({
        equipment_id: equipmentId,
        scanned_by_user_id: userId
      });
      
    if (error) {
      console.error('Error recording scan:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in recordScan:', error);
    return false;
  }
}

/**
 * Get scan history for an equipment
 * @param equipmentId The ID of the equipment
 * @param limit Optional limit of records to return (default 10)
 * @returns An array of scan history records
 */
export async function getScanHistory(equipmentId: string, limit: number = 10) {
  try {
    if (!equipmentId) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('scan_history')
      .select(`
        id,
        ts,
        scanned_by_user_id,
        scanned_from_ip,
        scanner:scanned_by_user_id (
          display_name,
          org:user_profiles(organization(name))
        )
      `)
      .eq('equipment_id', equipmentId)
      .order('ts', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error('Error fetching scan history:', error);
      return [];
    }
    
    // Process data to extract user and organization info
    return data.map(scan => {
      const userName = scan.scanner?.display_name || 'Anonymous';
      const orgName = scan.scanner?.org?.[0]?.organization?.name || 'Unknown Organization';
      
      return {
        id: scan.id,
        timestamp: scan.ts,
        userId: scan.scanned_by_user_id,
        userName,
        orgName,
        ipAddress: scan.scanned_from_ip
      };
    });
  } catch (error) {
    console.error('Error in getScanHistory:', error);
    return [];
  }
}
