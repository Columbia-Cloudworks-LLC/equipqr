
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
    
    // Simplified query to avoid relying on relationships
    const { data, error } = await supabase
      .from('scan_history')
      .select(`
        id,
        ts,
        scanned_by_user_id,
        scanned_from_ip
      `)
      .eq('equipment_id', equipmentId)
      .order('ts', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error('Error fetching scan history:', error);
      return [];
    }
    
    // Process data to add user and organization info
    const scanHistory = await Promise.all(data.map(async scan => {
      let userName = 'Anonymous';
      let orgName = 'Unknown Organization';
      
      if (scan.scanned_by_user_id) {
        // Get user info
        const { data: user } = await supabase
          .from('user_profiles')
          .select('display_name, org_id')
          .eq('id', scan.scanned_by_user_id)
          .single();
          
        if (user?.display_name) {
          userName = user.display_name;
          
          // Get org name
          if (user.org_id) {
            const { data: org } = await supabase
              .from('organization')
              .select('name')
              .eq('id', user.org_id)
              .single();
              
            if (org?.name) {
              orgName = org.name;
            }
          }
        }
      }
      
      return {
        id: scan.id,
        timestamp: scan.ts,
        userId: scan.scanned_by_user_id,
        userName,
        orgName,
        ipAddress: scan.scanned_from_ip
      };
    }));
    
    return scanHistory;
  } catch (error) {
    console.error('Error in getScanHistory:', error);
    return [];
  }
}
