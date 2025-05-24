
import { supabase } from "@/integrations/supabase/client";
import { getDeviceInfo, getLocationInfo, getSessionId, type DeviceInfo, type LocationInfo } from "@/utils/deviceDetection";
import { toast } from "sonner";

export interface EnhancedScanData {
  equipment_id: string;
  scanned_by_user_id?: string;
  user_agent: string;
  device_type: string;
  browser_name: string;
  browser_version: string;
  operating_system: string;
  screen_resolution: string;
  latitude?: number;
  longitude?: number;
  location_accuracy?: number;
  session_id: string;
  referrer_url: string;
  scan_method: 'qr_code' | 'direct' | 'search';
  device_fingerprint: string;
  timezone: string;
  language: string;
}

export interface ScanHistoryRecord {
  id: string;
  ts: string;
  scanned_by_user_id?: string;
  scanned_from_ip?: string;
  user_agent?: string;
  device_type?: string;
  browser_name?: string;
  browser_version?: string;
  operating_system?: string;
  screen_resolution?: string;
  latitude?: number;
  longitude?: number;
  location_accuracy?: number;
  session_id?: string;
  referrer_url?: string;
  scan_method?: string;
  device_fingerprint?: string;
  timezone?: string;
  language?: string;
  user_display_name?: string;
  user_org_name?: string;
}

/**
 * Record an enhanced scan event with comprehensive device and audit information
 */
export async function recordEnhancedScan(
  equipmentId: string, 
  scanMethod: 'qr_code' | 'direct' | 'search' = 'direct'
): Promise<boolean> {
  try {
    console.log(`Recording enhanced scan for equipment ${equipmentId} via ${scanMethod}`);
    
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    // Collect device information
    const deviceInfo = getDeviceInfo();
    
    // Collect location information (with user permission)
    const locationInfo = await getLocationInfo();
    
    // Create enhanced scan record
    const scanData: EnhancedScanData = {
      equipment_id: equipmentId,
      scanned_by_user_id: userId,
      user_agent: deviceInfo.userAgent,
      device_type: deviceInfo.deviceType,
      browser_name: deviceInfo.browserName,
      browser_version: deviceInfo.browserVersion,
      operating_system: deviceInfo.operatingSystem,
      screen_resolution: deviceInfo.screenResolution,
      latitude: locationInfo.latitude,
      longitude: locationInfo.longitude,
      location_accuracy: locationInfo.accuracy,
      session_id: getSessionId(),
      referrer_url: document.referrer || window.location.href,
      scan_method: scanMethod,
      device_fingerprint: deviceInfo.deviceFingerprint,
      timezone: deviceInfo.timezone,
      language: deviceInfo.language
    };
    
    // Insert scan record
    const { error } = await supabase
      .from('scan_history')
      .insert(scanData);
      
    if (error) {
      // If the error is related to RLS policies (for anonymous users)
      if (error.code === '42501' || error.message.includes('permission denied')) {
        console.log('Anonymous scan recorded (client-side only)');
        // For anonymous users, we don't record in the database but still return true
        toast.success("Equipment scanned successfully", { 
          description: "Sign in to record detailed scan history"
        });
        return true;
      }
      
      console.error('Error recording enhanced scan:', error);
      throw error;
    }
    
    // Show success message based on scan method
    const methodText = scanMethod === 'qr_code' ? 'QR code scan' : 'equipment access';
    toast.success(`${methodText} recorded successfully`, {
      description: userId ? "Scan history logged for audit purposes" : "Sign in for detailed tracking"
    });
    
    return true;
  } catch (error: any) {
    console.error('Error in recordEnhancedScan:', error);
    
    // Don't show error toast for anonymous users with permission issues
    if (!(error.code === '42501' || error.message?.includes('permission denied'))) {
      toast.error("Failed to record scan", {
        description: error.message || "An unexpected error occurred"
      });
    }
    
    return false;
  }
}

/**
 * Get enhanced scan history for equipment with permission checking
 */
export async function getEnhancedScanHistory(
  equipmentId: string, 
  limit: number = 50
): Promise<ScanHistoryRecord[]> {
  try {
    console.log(`Getting enhanced scan history for equipment ${equipmentId}`);
    
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    if (!userId) {
      console.log('No authenticated user, cannot view scan history');
      return [];
    }
    
    // Use the database function with permission checking
    const { data, error } = await supabase.rpc('get_equipment_scan_history', {
      p_equipment_id: equipmentId,
      p_user_id: userId,
      p_limit: limit
    });
    
    if (error) {
      console.error('Error fetching enhanced scan history:', error);
      throw error;
    }
    
    console.log(`Retrieved ${data?.length || 0} enhanced scan records`);
    return data || [];
    
  } catch (error: any) {
    console.error('Error in getEnhancedScanHistory:', error);
    toast.error("Failed to fetch scan history", {
      description: error.message || "An unexpected error occurred"
    });
    return [];
  }
}

/**
 * Check if current user can view scan history for equipment
 */
export async function canViewScanHistory(equipmentId: string): Promise<boolean> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    if (!userId) {
      return false;
    }
    
    const { data, error } = await supabase.rpc('can_view_scan_history', {
      p_user_id: userId,
      p_equipment_id: equipmentId
    });
    
    if (error) {
      console.error('Error checking scan history permission:', error);
      return false;
    }
    
    return data || false;
  } catch (error) {
    console.error('Error in canViewScanHistory:', error);
    return false;
  }
}
