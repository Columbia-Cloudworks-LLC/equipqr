
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
    
    // Use the database function to get equipment data with related information
    const { data: equipmentData, error: equipmentError } = await supabase.rpc(
      'get_equipment_with_details',
      { p_equipment_id: equipmentId }
    );

    if (equipmentError) {
      console.error('Error fetching equipment:', equipmentError);
      
      // Provide more specific error handling
      if (equipmentError.code === 'PGRST116') {
        throw new Error('Equipment not found');
      } else {
        throw new Error('Equipment not found or access denied');
      }
    }

    // The function returns an array, get the first (and only) result
    const equipment = Array.isArray(equipmentData) ? equipmentData[0] : equipmentData;

    if (!equipment) {
      throw new Error('Equipment not found');
    }

    console.log('Equipment data loaded successfully:', equipment.name);

    // Transform the database result to match our Equipment interface
    const transformedEquipment = {
      ...equipment,
      // Map the related data fields
      organization: equipment.organization_name ? { name: equipment.organization_name } : null,
      team: equipment.team_name ? { name: equipment.team_name } : null,
      created_by_user: equipment.created_by_display_name ? { display_name: equipment.created_by_display_name } : null,
      // Clean up the transformed fields
      organization_name: undefined,
      team_name: equipment.team_name, // Keep team_name for compatibility
      created_by_display_name: undefined
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
