import { supabase } from '@/integrations/supabase/client';

export interface ScanData {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  userAgent?: string;
  sessionId?: string;
  deviceType?: string;
  scanMethod?: string;
}

export interface ScanHistoryEntry {
  id: string;
  ts: string;
  scanned_by_user_id: string;
  user_display_name: string | null;
  user_org_name: string | null;
  scanned_from_ip: string | null;
  user_agent: string | null;
  device_type: string | null;
  browser_name: string | null;
  browser_version: string | null;
  operating_system: string | null;
  latitude: number | null;
  longitude: number | null;
  location_accuracy: number | null;
  scan_method: string | null;
  session_id: string | null;
  timezone: string | null;
  screen_resolution: string | null;
  language: string | null;
}

// Export as alias for backward compatibility
export type ScanHistoryRecord = ScanHistoryEntry;

/**
 * Records an equipment scan with enhanced data collection
 */
export async function recordEnhancedScan(
  equipmentId: string,
  scanMethod: string = 'qr_code',
  additionalData?: ScanData
): Promise<boolean> {
  try {
    console.log(`Recording enhanced scan for equipment ${equipmentId}`);
    
    // Get current user
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      console.error('No authenticated user for scan recording');
      return false;
    }

    const userId = session.session.user.id;
    
    // Collect scan data with geolocation if available
    const scanData: any = {
      scan_method: scanMethod,
      user_agent: navigator.userAgent,
      device_type: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop',
      session_id: session.session.access_token.substring(0, 12), // Use part of token as session ID
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      screen_resolution: `${screen.width}x${screen.height}`,
      ...additionalData
    };

    // Try to get geolocation if not provided
    if (!scanData.latitude && !scanData.longitude && navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 60000
          });
        });
        
        scanData.latitude = position.coords.latitude;
        scanData.longitude = position.coords.longitude;
        scanData.location_accuracy = position.coords.accuracy;
      } catch (geoError) {
        console.log('Geolocation not available:', geoError);
      }
    }

    // Use the database function directly since it exists in our migration
    const { data, error } = await supabase.rpc('record_equipment_scan', {
      p_equipment_id: equipmentId,
      p_user_id: userId,
      p_scan_data: scanData
    });

    if (error) {
      console.error('Error recording scan:', error);
      return false;
    }

    if (data && typeof data === 'object' && 'success' in data) {
      if (!(data as any).success) {
        console.error('Scan recording failed:', (data as any).error);
        return false;
      }
    }

    console.log('Scan recorded successfully:', data);
    return true;
    
  } catch (error) {
    console.error('Enhanced scan recording error:', error);
    return false;
  }
}

/**
 * Gets enhanced scan history for an equipment
 */
export async function getEnhancedScanHistory(
  equipmentId: string,
  limit: number = 50
): Promise<ScanHistoryEntry[]> {
  try {
    console.log(`Getting enhanced scan history for equipment ${equipmentId}`);
    
    // Get current user
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      console.error('No authenticated user for scan history');
      return [];
    }

    const userId = session.session.user.id;
    
    // Use the updated function with proper parameter naming
    const { data, error } = await supabase.rpc('get_equipment_scan_history', {
      p_equipment_id: equipmentId,
      p_user_id: userId,
      p_limit: limit
    });

    if (error) {
      console.error('Error getting scan history:', error);
      return [];
    }

    console.log(`Retrieved ${data?.length || 0} scan history entries`);
    
    // Ensure proper typing for the return data
    return (data || []).map((record: any): ScanHistoryEntry => ({
      id: record.id,
      ts: record.ts,
      scanned_by_user_id: record.scanned_by_user_id,
      user_display_name: record.user_display_name,
      user_org_name: record.user_org_name,
      scanned_from_ip: record.scanned_from_ip || null,
      user_agent: record.user_agent,
      device_type: record.device_type,
      browser_name: record.browser_name,
      browser_version: record.browser_version,
      operating_system: record.operating_system,
      latitude: record.latitude,
      longitude: record.longitude,
      location_accuracy: record.location_accuracy,
      scan_method: record.scan_method,
      session_id: record.session_id || null,
      timezone: record.timezone || null,
      screen_resolution: record.screen_resolution || null,
      language: record.language || null
    }));
    
  } catch (error) {
    console.error('Enhanced scan history error:', error);
    return [];
  }
}

/**
 * Checks if user can view scan history for equipment
 */
export async function canViewScanHistory(equipmentId: string): Promise<boolean> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      return false;
    }

    const userId = session.session.user.id;
    
    const { data, error } = await supabase.rpc('can_view_scan_history', {
      p_user_id: userId,
      p_equipment_id: equipmentId
    });

    if (error) {
      console.error('Error checking scan history permission:', error);
      return false;
    }

    return !!data;
    
  } catch (error) {
    console.error('Scan history permission check error:', error);
    return false;
  }
}
