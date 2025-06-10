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
  scanned_from_ip?: unknown; // Database returns unknown type for inet
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

// Type for the record_equipment_scan function response
interface RecordScanResponse {
  success: boolean;
  scan_id?: string;
  location_updated?: boolean;
  message?: string;
  error?: string;
  reason?: string;
}

/**
 * Get app_user ID from auth user ID
 */
async function getAppUserId(authUserId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', authUserId)
      .single();
    
    if (error) {
      console.error('Error getting app_user ID:', error);
      return null;
    }
    
    return data?.id || null;
  } catch (error) {
    console.error('Error in getAppUserId:', error);
    return null;
  }
}

/**
 * Log detailed debug information for permission failures
 */
async function logPermissionDebug(
  functionName: string,
  userId: string,
  equipmentId?: string,
  teamId?: string,
  result?: boolean,
  details?: any
): Promise<void> {
  try {
    // Use type assertion since this is a new function not in the generated types yet
    await supabase.rpc('log_permission_debug' as any, {
      p_function_name: functionName,
      p_user_id: userId,
      p_equipment_id: equipmentId || null,
      p_team_id: teamId || null,
      p_result: result,
      p_details: details ? JSON.stringify(details) : null
    });
  } catch (error) {
    console.error('Failed to log permission debug info:', error);
  }
}

/**
 * Record an enhanced scan event with comprehensive device and audit information
 * Uses the new database function that validates permissions and records the scan
 */
export async function recordEnhancedScan(
  equipmentId: string, 
  scanMethod: 'qr_code' | 'direct' | 'search' = 'qr_code'
): Promise<boolean> {
  try {
    console.log(`Recording enhanced scan for equipment ${equipmentId} via ${scanMethod}`);
    
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    const authUserId = sessionData?.session?.user?.id;
    
    if (!authUserId) {
      console.log('No authenticated user found for scan recording');
      toast.info("Equipment scanned successfully", { 
        description: "Sign in to record scan history and access all features"
      });
      return true; // Return true for anonymous scans to not break the UI flow
    }
    
    // Log the scan attempt for debugging
    await logPermissionDebug(
      'recordEnhancedScan_start',
      authUserId,
      equipmentId,
      undefined,
      undefined,
      { scan_method: scanMethod, timestamp: new Date().toISOString() }
    );
    
    // Collect device information
    const deviceInfo = getDeviceInfo();
    
    // Collect location information (with user permission)
    const locationInfo = await getLocationInfo();
    
    // Create scan data object
    const scanData = {
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
    
    console.log('Calling record_equipment_scan with data:', {
      equipmentId,
      userId: authUserId.substring(0, 8) + '...',
      scanMethod
    });
    
    // Use the database function with type assertion to handle the missing type definition
    const { data, error } = await supabase.rpc(
      'record_equipment_scan' as any,
      {
        p_equipment_id: equipmentId,
        p_user_id: authUserId,
        p_scan_data: scanData
      }
    ) as { data: RecordScanResponse | null; error: any };
    
    if (error) {
      console.error('Error calling record_equipment_scan:', error);
      
      // Log the error for debugging
      await logPermissionDebug(
        'recordEnhancedScan_db_error',
        authUserId,
        equipmentId,
        undefined,
        false,
        { 
          error: error.message || 'Unknown database error',
          code: error.code,
          details: error.details,
          hint: error.hint
        }
      );
      
      throw error;
    }
    
    if (!data?.success) {
      const errorMsg = data?.error || 'Unknown error occurred';
      console.error('Scan recording failed:', errorMsg, 'Reason:', data?.reason);
      
      // Log the permission failure for debugging
      await logPermissionDebug(
        'recordEnhancedScan_permission_failed',
        authUserId,
        equipmentId,
        undefined,
        false,
        { 
          error: errorMsg,
          reason: data?.reason,
          function_result: data
        }
      );
      
      // Handle permission denied specifically
      if (errorMsg.includes('Access denied')) {
        toast.error("Access denied", {
          description: "You don't have permission to scan this equipment"
        });
      } else if (errorMsg.includes('Equipment not found')) {
        toast.error("Equipment not found", {
          description: "The equipment you're trying to scan doesn't exist or has been deleted"
        });
      } else {
        toast.error("Failed to record scan", {
          description: errorMsg
        });
      }
      return false;
    }
    
    // Log successful scan for debugging
    await logPermissionDebug(
      'recordEnhancedScan_success',
      authUserId,
      equipmentId,
      undefined,
      true,
      { 
        scan_id: data.scan_id,
        location_updated: data.location_updated,
        message: data.message
      }
    );
    
    // Show success message based on scan method
    const methodText = scanMethod === 'qr_code' ? 'QR code scan' : 'equipment access';
    const locationUpdated = data.location_updated;
    
    toast.success(`${methodText} recorded successfully`, {
      description: locationUpdated 
        ? "Scan history and location updated" 
        : "Scan history logged for audit purposes"
    });
    
    return true;
  } catch (error: any) {
    console.error('Error in recordEnhancedScan:', error);
    
    // Get session data again for error logging since it might be out of scope
    const { data: errorSessionData } = await supabase.auth.getSession();
    
    // Log the unexpected error
    if (errorSessionData?.session?.user?.id) {
      await logPermissionDebug(
        'recordEnhancedScan_unexpected_error',
        errorSessionData.session.user.id,
        equipmentId,
        undefined,
        false,
        { 
          error: error.message || 'Unknown error',
          stack: error.stack,
          name: error.name
        }
      );
    }
    
    // Handle specific permission errors gracefully
    if (error.message?.includes('Access denied') || error.message?.includes('permission')) {
      toast.error("Access denied", {
        description: "You don't have permission to scan this equipment"
      });
    } else if (error.message?.includes('column reference') && error.message?.includes('ambiguous')) {
      toast.error("System error", {
        description: "There's a configuration issue. Please contact support."
      });
    } else {
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
    
    // Use the database function with permission checking and type assertion
    const { data, error } = await supabase.rpc(
      'get_equipment_scan_history' as any,
      {
        p_equipment_id: equipmentId,
        p_user_id: userId,
        p_limit: limit
      }
    ) as { data: ScanHistoryRecord[] | null; error: any };
    
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
    
    const { data, error } = await supabase.rpc(
      'can_view_scan_history' as any,
      {
        p_user_id: userId,
        p_equipment_id: equipmentId
      }
    ) as { data: boolean | null; error: any };
    
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
