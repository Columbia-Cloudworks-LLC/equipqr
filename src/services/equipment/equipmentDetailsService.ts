import { supabase } from '@/integrations/supabase/client';
import { Equipment } from '@/types';
import { recordEnhancedScan, getEnhancedScanHistory } from './enhancedScanService';

export interface EquipmentDetails extends Equipment {
  scanHistory?: any[];
  canEdit?: boolean;
  canDelete?: boolean;
}

// Define the type for the equipment data returned from the RPC function
interface EquipmentWithDetailsRow {
  id: string;
  name: string;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  asset_id: string | null;
  status: string;
  location: string | null;
  location_address: string | null;
  location_coordinates: string | null;
  notes: string | null;
  install_date: string | null;
  warranty_expiration: string | null;
  org_id: string;
  team_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  organization_name: string | null;
  team_name: string | null;
  created_by_display_name: string | null;
  last_scan_latitude: number | null;
  last_scan_longitude: number | null;
  last_scan_accuracy: number | null;
  last_scan_timestamp: string | null;
  last_scan_by_user_id: string | null;
  location_override: boolean | null;
  location_source: string | null;
}

/**
 * Get detailed equipment information including permissions and scan history
 */
export async function getEquipmentDetails(equipmentId: string): Promise<EquipmentDetails | null> {
  try {
    console.log(`Getting equipment details for ${equipmentId}`);
    
    // First check if user can access this equipment
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      throw new Error('Authentication required');
    }

    const userId = session.session.user.id;
    
    // Use a raw SQL query to get equipment data with related information
    const { data: equipmentData, error: equipmentError } = await supabase
      .from('equipment')
      .select(`
        *,
        organization:organization!inner(name),
        team:team(name),
        created_by_user:user_profiles!equipment_created_by_fkey(display_name)
      `)
      .eq('id', equipmentId)
      .is('deleted_at', null)
      .single();

    if (equipmentError) {
      console.error('Error fetching equipment:', equipmentError);
      
      // Provide more specific error handling
      if (equipmentError.code === 'PGRST116') {
        throw new Error('Equipment not found');
      } else {
        throw new Error('Equipment not found or access denied');
      }
    }

    if (!equipmentData) {
      throw new Error('Equipment not found');
    }

    console.log('Equipment data loaded successfully:', equipmentData.name);

    // Transform the database result to match our Equipment interface
    // Handle the case where created_by_user might be an array or single object
    const createdByUser = Array.isArray(equipmentData.created_by_user) 
      ? equipmentData.created_by_user[0] 
      : equipmentData.created_by_user;

    const transformedEquipment = {
      ...equipmentData,
      // Map the related data fields
      organization: equipmentData.organization ? { name: equipmentData.organization.name } : null,
      team: equipmentData.team ? { name: equipmentData.team.name } : null,
      created_by_user: createdByUser ? { display_name: createdByUser.display_name } : null,
      // Keep team_name for compatibility
      team_name: equipmentData.team?.name || null
    };

    // Check permissions using the corrected edge function call
    let hasReadPermission = true; // Already verified by successful equipment fetch
    let hasEditPermission = false;
    
    try {
      console.log('Checking edit permission for equipment:', equipmentId);
      
      // Call the edge function with non-prefixed parameters
      const { data: editPermissionResult, error: editPermissionError } = await supabase.functions.invoke(
        'permissions',
        {
          body: {
            userId: userId,
            resource: 'equipment',
            action: 'edit',
            resourceId: equipmentId,
            targetId: null
          }
        }
      );

      if (editPermissionError) {
        console.warn('Edit permission check failed, defaulting to false:', editPermissionError);
        hasEditPermission = false;
      } else {
        // Handle the response properly with type safety
        const permissionData = editPermissionResult as { has_permission?: boolean; [key: string]: any };
        hasEditPermission = permissionData?.has_permission || false;
        console.log('Edit permission result:', permissionData);
      }
      
    } catch (editPermissionError) {
      console.warn('Edit permission check error, defaulting to false:', editPermissionError);
      hasEditPermission = false;
    }

    // Get scan history if user has permission
    let scanHistory: any[] = [];
    try {
      scanHistory = await getEnhancedScanHistory(equipmentId, 20);
    } catch (scanError) {
      console.log('Could not load scan history (this is normal for some users):', scanError);
    }

    const result: EquipmentDetails = {
      ...transformedEquipment,
      scanHistory,
      canEdit: hasEditPermission,
      canDelete: hasEditPermission // Same permission for now
    };

    console.log(`Equipment details loaded successfully for ${equipmentId}`);
    return result;
    
  } catch (error) {
    console.error('Error getting equipment details:', error);
    throw error;
  }
}

// Export getEquipmentById as an alias for backward compatibility
export const getEquipmentById = getEquipmentDetails;

/**
 * Record a scan for equipment
 */
export async function recordEquipmentScan(
  equipmentId: string,
  scanMethod: string = 'qr_code'
): Promise<boolean> {
  try {
    console.log(`Recording scan for equipment ${equipmentId}`);
    return await recordEnhancedScan(equipmentId, scanMethod);
  } catch (error) {
    console.error('Error recording equipment scan:', error);
    return false;
  }
}

/**
 * Get equipment scan history
 */
export async function getEquipmentScanHistory(equipmentId: string, limit: number = 50) {
  try {
    console.log(`Getting scan history for equipment ${equipmentId}`);
    return await getEnhancedScanHistory(equipmentId, limit);
  } catch (error) {
    console.error('Error getting equipment scan history:', error);
    return [];
  }
}
