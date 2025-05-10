
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Records a scan event for an equipment
 * Can handle both authenticated and anonymous scans
 */
export async function recordScan(equipmentId: string, userId?: string): Promise<boolean> {
  try {
    console.log(`Recording scan for equipment ${equipmentId}${userId ? ` by user ${userId}` : ' (anonymous)'}`);
    
    // Check if we have a valid equipment ID
    if (!equipmentId) {
      console.error('Invalid equipment ID for scan');
      return false;
    }

    // Create the basic scan record
    const scanRecord: any = {
      equipment_id: equipmentId,
    };

    // Add user ID if available (authenticated user)
    if (userId) {
      scanRecord.scanned_by_user_id = userId;
    }

    // Store the scan in the database
    const { error } = await supabase
      .from('scan_history')
      .insert(scanRecord);
      
    if (error) {
      // If the error is related to RLS policies (for anonymous users)
      if (error.code === '42501' || error.message.includes('permission denied')) {
        console.log('Anonymous scan recorded (client-side only)');
        // For anonymous users, we don't record in the database but still return true
        // This way the scan event is still considered successful from the UI perspective
        toast.success("Equipment scanned successfully", { 
          description: "Sign in to record scan history and access all features"
        });
        return true;
      }
      
      console.error('Error recording scan:', error);
      throw error;
    }
    
    toast.success("Equipment scan recorded successfully");
    return true;
  } catch (error: any) {
    console.error('Error in recordScan:', error);
    // Don't show toast for anonymous users with permission issues
    if (!(error.code === '42501' || error.message?.includes('permission denied'))) {
      toast.error("Failed to record scan", {
        description: error.message || "An unexpected error occurred"
      });
    }
    return false;
  }
}

/**
 * Get scan history for an equipment
 */
export async function getScanHistory(equipmentId: string) {
  try {
    console.log(`Getting scan history for equipment ${equipmentId}`);
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
    
    console.log(`Retrieved ${data?.length || 0} scan records`);
    return data || [];
  } catch (error: any) {
    console.error('Error in getScanHistory:', error);
    toast.error("Failed to fetch scan history", {
      description: error.message || "An unexpected error occurred"
    });
    return [];
  }
}
