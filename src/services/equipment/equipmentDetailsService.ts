
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
    
    // Get equipment data using LEFT JOIN to handle NULL created_by values
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

    if (equipmentError) {
      console.error('Error fetching equipment:', equipmentError);
      
      // Provide more specific error handling
      if (equipmentError.code === 'PGRST116') {
        throw new Error('Equipment not found');
      } else if (equipmentError.message?.includes('foreign key')) {
        console.warn('Foreign key issue detected, attempting fallback query');
        
        // Fallback query without joins
        const { data: basicEquipment, error: basicError } = await supabase
          .from('equipment')
          .select('*')
          .eq('id', equipmentId)
          .is('deleted_at', null)
          .single();
          
        if (basicError || !basicEquipment) {
          throw new Error('Equipment not found or access denied');
        }
        
        // Manually fetch related data
        const [orgData, teamData] = await Promise.allSettled([
          supabase.from('organization').select('name').eq('id', basicEquipment.org_id).single(),
          basicEquipment.team_id ? 
            supabase.from('team').select('name').eq('id', basicEquipment.team_id).single() : 
            Promise.resolve({ data: null })
        ]);
        
        // Construct equipment object with fallback data
        const equipment = {
          ...basicEquipment,
          organization: orgData.status === 'fulfilled' ? orgData.value.data : { name: 'Unknown Organization' },
          team: teamData.status === 'fulfilled' && teamData.value.data ? teamData.value.data : null,
          created_by_user: basicEquipment.created_by ? { display_name: 'Unknown User' } : null
        };
        
        console.log('Equipment data loaded via fallback query:', equipment.name);
      } else {
        throw new Error('Equipment not found or access denied');
      }
    }

    if (!equipment) {
      throw new Error('Equipment not found');
    }

    console.log('Equipment data loaded successfully:', equipment.name);

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
      ...equipment,
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
