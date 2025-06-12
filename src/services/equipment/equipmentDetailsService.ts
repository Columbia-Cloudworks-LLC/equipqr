import { supabase } from '@/integrations/supabase/client';
import { Equipment } from '@/types';
import { recordEnhancedScan, getEnhancedScanHistory } from './enhancedScanService';

export interface EquipmentDetails extends Equipment {
  scanHistory?: any[];
  canEdit?: boolean;
  canDelete?: boolean;
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
    
    // Use the safer database function that handles NULL created_by values
    const { data: equipmentData, error: equipmentError } = await supabase.rpc(
      'get_equipment_with_details_safe',
      { p_equipment_id: equipmentId }
    );

    if (equipmentError) {
      console.error('Error fetching equipment:', equipmentError);
      throw new Error('Equipment not found or access denied');
    }

    if (!equipmentData || equipmentData.length === 0) {
      throw new Error('Equipment not found');
    }

    // Get the first (and should be only) result
    const rawEquipment = equipmentData[0];
    console.log('Equipment data loaded successfully:', rawEquipment.name);

    // Transform the database result to match our Equipment interface
    const transformedEquipment = {
      id: rawEquipment.id,
      name: rawEquipment.name,
      manufacturer: rawEquipment.manufacturer,
      model: rawEquipment.model,
      serial_number: rawEquipment.serial_number,
      status: rawEquipment.status,
      location: rawEquipment.location,
      notes: rawEquipment.notes,
      install_date: rawEquipment.install_date,
      warranty_expiration: rawEquipment.warranty_expiration,
      org_id: rawEquipment.org_id,
      team_id: rawEquipment.team_id,
      created_by: rawEquipment.created_by,
      created_at: rawEquipment.created_at,
      updated_at: rawEquipment.updated_at,
      deleted_at: rawEquipment.deleted_at,
      // Map the related data fields
      organization: rawEquipment.organization_name ? { name: rawEquipment.organization_name } : null,
      team: rawEquipment.team_name ? { name: rawEquipment.team_name } : null,
      created_by_user: rawEquipment.created_by_display_name ? { display_name: rawEquipment.created_by_display_name } : null,
      // Keep team_name for compatibility
      team_name: rawEquipment.team_name || null
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
