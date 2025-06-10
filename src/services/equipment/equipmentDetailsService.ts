
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
    
    // Check access permission using the corrected function
    const { data: accessCheck, error: accessError } = await supabase.rpc(
      'can_access_equipment',
      {
        user_id: userId,
        equipment_id: equipmentId
      }
    );

    if (accessError) {
      console.error('Error checking equipment access:', accessError);
      throw new Error('Permission check failed');
    }

    if (!accessCheck) {
      throw new Error('Access denied to this equipment');
    }

    // Get equipment data
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select(`
        *,
        organization:org_id(name),
        team:team_id(name),
        created_by_user:created_by(display_name)
      `)
      .eq('id', equipmentId)
      .is('deleted_at', null)
      .single();

    if (equipmentError || !equipment) {
      console.error('Error fetching equipment:', equipmentError);
      throw new Error('Equipment not found');
    }

    // Check additional permissions using the unified permissions function
    const { data: editPermission } = await supabase.functions.invoke('permissions', {
      body: {
        userId: userId,
        resource: 'equipment',
        action: 'edit',
        resourceId: equipmentId
      }
    });

    // Get scan history if user has permission
    let scanHistory: any[] = [];
    try {
      scanHistory = await getEnhancedScanHistory(equipmentId, 20);
    } catch (error) {
      console.log('Could not load scan history:', error);
    }

    const result: EquipmentDetails = {
      ...equipment,
      scanHistory,
      canEdit: editPermission?.has_permission || false,
      canDelete: editPermission?.has_permission || false // Same permission for now
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
